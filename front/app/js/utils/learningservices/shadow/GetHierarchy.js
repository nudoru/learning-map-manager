let Task                         = require('data.task'),
    {concat}                     = require('ramda'),
    {getHierarchyForManagerById} = require('./ShadowDB'),
    {requestUsersFromSDBandLRS}  = require('../combo/GetUsersFromSDBandLRS'),
    {dynamicSortObjArry}         = require('../shared');

/**
 * Returns a Task that resolves to {employees: list of all people, tree: sorted under managers}
 * Creates a lot of outstanding ws calls at a time and will fail for large structures
 * @param uid
 * @returns {*|Task}
 */
const getShallowManagerHierarchy = (wsOptions, uid, progressFn = () => {
}) => {
  let startingAcc = {
        employees: [],
        tree     : {}
      },
      search      = getHierarchyForManagerById(wsOptions);

  return new Task(function (reject, resolve) {
    // Used to determine exit condition: Goes up for each query, down for each
    // manager and down for each end point (no mo manager). 0 when done, -1 when
    // the user has no reports.
    let numQueries = 0;

    function next(task, acc) {
      if (progressFn) {
        progressFn(acc.employees.length);
      }
      task.fork(reject,
        function (results) {
          acc.employees = concat(acc.employees, results);
          if (results.length) {
            let activeEmployees = results.filter(e => e.suspended === 0 && e.deleted === 0),
                manager         = activeEmployees[0].manager_username;

            acc.tree[manager] = results;
            numQueries--;
            activeEmployees.forEach(employee => {
              numQueries++;
              next(search(employee.user_id), acc);
            });
          } else {
            if (numQueries === 0) {
              resolve(acc);
            } else {
              numQueries--;
            }
          }
        });
    }

    next(search(uid), startingAcc);
  });
};

const getManagerHierarchy = (wsOptions, mgrId, audience = [], progressFn = () => {
}) => {
  let accumulator = {
        employees   : [], // Active employees who are in the audience
        allEmployees: [], // Active employees in the audience or not
        tree        : {}
      },
      search      = getHierarchyForManagerById(wsOptions);


  return new Task((reject, resolve) => {
    // Used to determine exit condition: Goes up for each query, down for each
    // manager and down for each end point (no mo manager). 0 when done, -1 when
    // the user has no reports.
    let numQueries  = 0,
        queryBuffer = [],
        maxActive   = 100,
        countIttr   = 0;

    function next(task) {
      countIttr++;
      if (progressFn) {
        progressFn(accumulator.employees.length);
      }
      task.fork(reject,
        function (results) {
          let activeEmployees     = results.filter(e => e.suspended === 0 && e.deleted === 0);
          let employeesInAudience = audience.length ? activeEmployees.filter(e => audience.includes(e.user_id)) : activeEmployees;

          numQueries--;
          accumulator.allEmployees = concat(accumulator.allEmployees, activeEmployees);
          accumulator.employees    = concat(accumulator.employees, employeesInAudience);
          queryBuffer              = concat(queryBuffer, activeEmployees);

          if (activeEmployees.length) {
            let manager = activeEmployees[0].manager_email;

            accumulator.tree[manager] = employeesInAudience.sort(dynamicSortObjArry('lastname'));
          } else {
            if (countIttr === 1) {
              // We're querying for an end use w/ no DR's, short circuit to the end
              numQueries  = 0;
              queryBuffer = [];
            }
          }

          if (numQueries <= 0) {
            if (queryBuffer.length) {
              //console.log('running buffer', queryBuffer.length);
              // buffer and wait for active to resolve
              let activeQueries = queryBuffer.splice(0, maxActive);
              //console.log(activeQueries.length, queryBuffer.length);
              activeQueries.forEach(function (report) {
                numQueries++;
                next(search(report.user_id));
              });
            } else {
              if (numQueries === 0) {
                accumulator.employees.sort(dynamicSortObjArry('lastname'));
                accumulator.allEmployees.sort(dynamicSortObjArry('lastname'));
                resolve(accumulator);
              }

            }
          }

        });
    }

    next(search(mgrId));
  });
};

const getLearningForManagerHierarchy = (wsOptions, mgrId, audience, progressFn) =>
  new Task((reject, resolve) => {
    getManagerHierarchy(wsOptions.shadowdb, mgrId, audience, progressFn)
      .fork(reject, reports => {
        let emails = reports.employees.map(res => res.email);
        requestUsersFromSDBandLRS(wsOptions, emails, progressFn).fork(reject, progressDeatils => {
          reports.progress = progressDeatils;
          resolve(reports);
        });
      });
  });

module.exports = {
  getManagerHierarchy,
  getShallowManagerHierarchy,
  getLearningForManagerHierarchy
};