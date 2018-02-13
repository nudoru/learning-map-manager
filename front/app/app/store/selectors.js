import { memoize, curry, concat } from 'ramda';
import { cloneDeep } from 'lodash';
import Either from 'data.either';
import moment from 'moment';
import {get} from 'lodash';
import {
  formatSecondsToDate2,
  removeArrDupes,
  removeWhiteSpace,
  floatRoundOne,
  floatRoundTwo
} from '../utils/Toolbox';
import { hasLength, idMatchObjId, noOp, stripHTML } from '../utils/AppUtils';
import AppStore from './AppStore';
import SetHierarchyTree from './actions/SetHierarchyTree';

let mergedLearnerContent = [];

export const filterHierarchyForAudience = () => {
  let audienceIds  = AppStore.getState().audiencemembers,
      hierarchy    = AppStore.getState().hierarchy,
      managers     = Object.keys(hierarchy.tree),
      filteredTree = managers.reduce((acc, manager) => {
        acc[manager] = hierarchy.tree[manager].filter(objIdInArray(audienceIds));
        return acc;
      }, {});

  AppStore.dispatch(SetHierarchyTree(filteredTree));
};

export const getAllEmployeesInHierarchyTree = () => {
  let tree = AppStore.getState().hierarchy.tree;
  return Object.keys(tree).reduce((acc, mgr) => {
    acc = concat(tree[mgr], acc);
    return acc;
  }, []);
};

const objIdInArray = curry((arry, element) => arry.includes(element.user_id));

// TODO getLastLRSContentRevision(userStatementsSelectorForContext()) || configSelector().currentVersion
export const getCurrentStructure = () =>
  getStructureVersion(AppStore.getState().config.structure, AppStore.getState().config.currentVersion);

// Get the period structure for the given version
const getStructureVersion = memoize((data, version) =>
  Either.fromNullable(data.filter(str => str.version === version)[0]).fold(() => [], s => s));

let CACHE_CONTENT = null;

const getContent  = () => {
  if (CACHE_CONTENT) {
    return CACHE_CONTENT;
  }
  let contentIDsInStructure = getContentIDsFromStructure();
  CACHE_CONTENT             = AppStore.getState().config.content.filter(content => contentIDsInStructure.includes(content.id));
  return CACHE_CONTENT;
};

const getContentIDsFromStructure = () => getCurrentStructure().data.reduce((acc, period) => {
  period.topics.forEach(topic => {
    acc = concat(acc, topic.content);
  });
  return acc;
}, []);

export const getContentForUser = email => {
  let learnerObj = mergedLearnerContent.filter(learner => Object.keys(learner)[0] === email)[0];
  if (learnerObj) {
    let email = Object.keys(learnerObj)[0];
    return learnerObj[email].content;
  } else {
    console.error('Could not get content for ', email);
    return [];
  }
};

export const getContentObjById = id =>
  Either.fromNullable(getContent().filter(idMatchObjId(id))[0])
    .fold(
      () => {
        // It won't be found if it's not required and show only required is on
        //console.warn('Content with ID ' + id + ' not found!');
        return {};
      },
      res => res);

export const getUserContentObjById = (user, id) =>
  Either.fromNullable(getContentForUser(user.email).filter(idMatchObjId(id))[0])
    .fold(
      () => {
        // It won't be found if it's not required and show only required is on
        //console.warn('Content with ID ' + id + ' not found!');
        return {};
      },
      res => res);

// Array => Number
export const getNumActivitiesForPeriod = period =>
  period.topics
    .filter(t => hasLength(t.content))
    .reduce((acc, topic) => acc += topic.content.length, 0);

// TODO filter content for ONLY items in structure
export const mergeContentAndLearningProgress = () => {
  let content    = getContent(),
      {progress} = AppStore.getState().hierarchy;

  mergedLearnerContent = progress.map(learner => {
    let email              = Object.keys(learner)[0],
        numItems, numComplete, numInprogress, numNotEnrolled, pctComplete,
        pctInprogress,
        pctNotEnrolled;
    learner[email].content = getHydratedContentForUser(learner, content);

    numItems       = learner[email].content.length;
    numComplete    = learner[email].content.filter(obj => obj.status === 2).length;
    numInprogress  = learner[email].content.filter(obj => obj.status === 1).length;
    numNotEnrolled = learner[email].content.filter(obj => obj.status === 0).length;

    pctComplete    = floatRoundOne((numComplete / numItems) * 100);
    pctInprogress  = floatRoundOne((numInprogress / numItems) * 100);
    pctNotEnrolled = floatRoundOne((numNotEnrolled / numItems) * 100);

    learner[email].stats = {
      numComplete,
      numInprogress,
      numNotEnrolled,
      pctComplete,
      pctInprogress,
      pctNotEnrolled
    };

    return learner;
  });

  //console.log(mergedLearnerContent);
};

export const getUserObjectByEmail = email =>
  mergedLearnerContent.filter(obj => Object.keys(obj)[0] === email)[0][email];

export const getUserEmailsUnderManager = mgrEmail =>
  AppStore.getState().hierarchy.tree[mgrEmail].map(employee => employee.email);

export const getStatsForManagerByEmail = email =>
  getStatsForUsersByEmail(getUserEmailsUnderManager(email));

// TODO add user counts for each category
export const getStatsForUsersByEmail = emailArry => {
  let avgPctComplete    = 0,
      avgPctInprogress  = 0,
      avgPctNotEnrolled = 0,
      numComplete       = 0,
      numInprogress     = 0,
      numNotEnrolled    = 0,
      len               = emailArry.length;

  if (emailArry.length) {
    emailArry.forEach(email => {
      let userObj = getUserObjectByEmail(email);
      avgPctComplete += userObj.stats.pctComplete;
      avgPctInprogress += userObj.stats.pctInprogress;
      avgPctNotEnrolled += userObj.stats.pctNotEnrolled;

      if(isUserComplete(userObj)) {
        numComplete++;
      } else {
        numInprogress += (isUserInProgress(userObj) ? 1 : 0);
        numNotEnrolled += (isUserNotStarted(userObj) ? 1 : 0);
      }

      //numComplete += (isUserComplete(userObj) ? 1 : 0);
    });

    avgPctComplete    = floatRoundOne(avgPctComplete / len);
    avgPctInprogress  = floatRoundOne(avgPctInprogress / len);
    avgPctNotEnrolled = floatRoundOne(avgPctNotEnrolled / len);
  }

  return {
    avgPctComplete,
    avgPctInprogress,
    avgPctNotEnrolled,
    numComplete,
    numInprogress,
    numNotEnrolled
  };
};

export const isUserComplete   = obj => obj.stats.pctComplete >= 100;
export const isUserInProgress = obj => (obj.stats.pctComplete > 0 && obj.stats.pctComplete <= 100) || obj.stats.pctInprogress > 0;
export const isUserNotStarted = obj => !isUserInProgress(obj);

const getCompletionStatement = statements => statements.filter(st => st.verb.display['en-US'] === 'completed')[0];
const getClickedStatement    = statements => statements.filter(st => st.verb.display['en-US'] === 'clicked')[0];

const getLMSDataForLMSId = (records, contentid) =>
  records.filter(r => r.course_id === contentid);

const getLRSStatementsForContentLink = (records, id) =>
  records.filter(s => s.object.id === id);

// Defaulting statements help prevent errors when there was a problem getting
// statements for Allego
export const getAllegoStatement = (statements = [], idArr, verb) =>
  statements.filter(filterStatementVerb(verb)).filter(filterStatementAllegoID(idArr));

export const filterStatementVerb = curry((verb, el) => el.verb.display['en-US'] === verb);

export const filterStatementAllegoID = curry((idArr, el) => {
  // Old version that looks at the ID of the recorded video which is INCORRECT!
  // let statementid = el.object.id.split('_')[1]; // "https://my.allego.com#scored_174014"

  let contextParent = get(el, 'context.contextActivities.parent[0].definition.name[\'en-US\']');
  if(contextParent) {
    console.log('Got contextparent', contextParent, 'is match',(idArr.indexOf(contextParent) >= 0))
    return idArr.indexOf(contextParent) >= 0
  }

  let statementid = el.object.definition.name['en-US'];

  /*
  The logic here was changed on 9/19/17 by MBP
  Due to a name change on a content item in Allego - a suffix string was added
  */
  return idArr.reduce((acc, id) => {
    //console.log(statementid,'indexof',id,'result',(statementid.indexOf(id) >= 0));
    acc = acc || statementid.indexOf(id) >= 0;
    return acc;
  }, false)
  //console.log(statementid,'vs',idArr,'result',(idArr.indexOf(statementid) >= 0));
  //return idArr.indexOf(statementid) >= 0;
});

const getLRSId = contentObj => {
  if (contentObj.contentLink) {
    return contentLinkWithId(contentObj.contentLink, contentObj.id);
  } else {
    return contentTitleToLink(contentObj.title, contentObj.id);
  }
};

// Some actions don't have a URL since they're physical tasks. Convert that title
// into a unique URL for tracking to the LRS' object/subject id prop
export const contentTitleToLink = (title, id) => 'https://www.redhat.com/en#' + removeWhiteSpace(stripHTML(title)) + '_' + id;

// Several items have the same endpoint/link. Add the id as a hash to unique them
export const contentLinkWithId = (link, id) => link + '#' + id;

const getAllegoLRSStatementsByEmail = email =>
  AppStore.getState().allegoLRS.reduce((acc, e) => {
    let key = Object.keys(e)[0];
    if (key === email) {
      acc = e[key];
    }
    return acc;
  }, []);

export const getHydratedContentForUser = (user, content) => {
  let email              = Object.keys(user)[0],
      statements         = user[email].lrs,
      lms                = user[email].sdb,
      allego             = getAllegoLRSStatementsByEmail(email),
      {showOnlyRequired} = AppStore.getState().config.setup.interface;

  return content.reduce((acc, contobj) => {
    let o             = Object.assign({}, contobj),
        lrsId         = getLRSId(contobj),
        lrsStatements = getLRSStatementsForContentLink(statements, lrsId),
        allegoStatement,
        bestStatement = getCompletionStatement(lrsStatements) || getClickedStatement(lrsStatements),
        lmsRecord     = getLMSDataForLMSId(lms, contobj.lmsID)[0]; // There will only be one

    o.lmsStatus        = 0;
    o.lmsStatusDate    = null;
    o.lrsStatus        = null;
    o.lrsStatusDate    = null;
    o.allegoStatus     = '';
    o.allegoStatusDate = null;
    o.status           = 0; // 0 not enrolled, 1 in progresss, 2 complete
    o.isComplete       = false;
    //o.requireConfirm   = contobj.requireConfirm;
    //o.isRequired       = contobj.isRequired;

    if (o.hasOwnProperty('allegoID')) {
      //console.log(email,allego, o.allegoID, o.allegoVerb);
      allegoStatement = getAllegoStatement(allego, o.allegoID, o.allegoVerb);
      //console.log('Allego statement(s)', allegoStatement);
      if (allegoStatement.length) {
        o.allegoStatus     = allegoStatement[0].verb.display['en-US'];
        o.allegoStatusDate = moment(allegoStatement[0].timestamp);
      }
    }

    if (bestStatement) {
      o.lrsStatus     = bestStatement.verb.display['en-US'];
      o.lrsStatusDate = moment(bestStatement.timestamp);
      o.status        = 1;
      //console.log('COMPLETION!', o.lrsStatus, o.lrsStatusDate);
    }

    if (lmsRecord) {
      o.status = 1;
      if (lmsRecord.course_completion_status === 25) {
        o.lmsStatus = 1;
      } else if (lmsRecord.course_completion_status >= 50) {
        o.lmsStatus = 2;
      }

      if (o.lmsStatus === 2) {
        // Totara dates are seconds since 1/1/70 12:00am
        o.lmsStatusDate = moment(new Date(parseInt(lmsRecord.coursecompletiondate * 1000)));
      }
    }

    o.isComplete = o.lmsStatus === 2 || (o.lrsStatus === 'clicked' && !o.requireConfirm || o.lrsStatus === 'completed' && o.requireConfirm) || o.allegoStatus.length > 0;

    o.status = o.isComplete ? 2 : o.status;

    if (showOnlyRequired && o.isRequired) {
      acc.push(o);
    } else if (!showOnlyRequired) {
      acc.push(o);
    }

    return acc;
  }, []);

};