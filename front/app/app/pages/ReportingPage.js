import React from 'react';
import {concat} from 'ramda';
import {connect} from 'react-redux';
import {debounce} from 'lodash';
import PageModule from '../rh-components/rh-PageModule';
import {Col, Row} from '../rh-components/rh-Grid';
import {Card} from '../rh-components/rh-Card';
import Accordion, {AccordionVGroup} from '../rh-components/rh-Accordion';
import {DropDown, Option, TextInput, VForm} from '../rh-components/rh-Form';
import {StatusLabel} from '../rh-components/rh-Status';
import StructureTable from '../components/StructureTable';
import AppStore from '../store/AppStore';
import {
  getCurrentStructure, getStatsForUsersByEmail, getUserObjectByEmail,
  isUserComplete, isUserInProgress, isUserNotStarted
} from '../store/selectors';

// accordion-header-manager
const ManagerRowTitle = ({name}) => (
  <ul className="rh-accordion-header-label-list">
    <li className="f1 padding-left"><em>{name}</em>
    </li>
    <li></li>
    <li></li>
  </ul>);

const EmployeeRowTitle = ({name, pctComplete, status}) => (
  <ul className="rh-accordion-header-label-list">
    <li className="f1 padding-left"><em>{name}</em></li>
    <li><strong>{pctComplete}%</strong> Complete</li>
    <li>{status}</li>
  </ul>);

const FilterForm = ({onFilterChange, onStatusChange}) => (<VForm>
  <fieldset>
    <Row>
      <Col className="padding-right">
        <TextInput label="Name"
                   onChange={onFilterChange}
                   placeholder="Employee's name"
                   help="Filter non-managers for full or partial matches on their full name."/>
      </Col>
      <Col className="padding-left">
        <DropDown label="Activity Status" onChange={onStatusChange}
                  help="Filter non-managers for activity level status.">
          <Option value="">Everything</Option>
          <Option value="complete">All Complete</Option>
          <Option value="inprogress">Some In progress</Option>
          <Option value="notstarted">None Started</Option>
        </DropDown></Col>
    </Row>
  </fieldset>
</VForm>);

const StatisticsRow = ({stats}) => (
  <Card style="bars" className='margin-bottom-double'>
    <Row className="fxgrid-row-center">
      <Col className="text-center">
        <StatusLabel type="success">
          <strong>{stats.numComplete}</strong> people are complete
        </StatusLabel>
        <div><p className="small">{stats.avgPctComplete}% of activities have
          been completed.</p></div>
      </Col>
      <Col className="text-center">
        <StatusLabel icon="refresh" type="info">
          <strong>{stats.numInprogress}</strong> people are in progress
        </StatusLabel>
        <div><p className="small">{stats.avgPctInprogress}% of activities are in
          progress.</p></div>
      </Col>
      <Col className="text-center">
        <StatusLabel>
          <strong>{stats.numNotEnrolled}</strong> people haven't started
        </StatusLabel>
        <div><p className="small">{stats.avgPctNotEnrolled}% of activities
          haven't been started.</p></div>
      </Col>
    </Row>
  </Card>
);

class ReportingPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {nameFilter: '', statusFilter: ''};
  }

  _onFilterChange(e) {
    this.setState({nameFilter: e.target.value});
  }

  _onStatusChange(e) {
    this.setState({statusFilter: e.target.value});
  }

  _isFiltering() {
    return this.state.nameFilter.length > 0 || this.state.statusFilter.length > 0;
  }

  _userObjMatchesFilter(user) {
    let matchName    = true,
        matchStatus  = true,
        userMergedData,
        name         = (user.firstname + ' ' + user.lastname).toLowerCase(),
        nameFilter   = this.state.nameFilter.toLowerCase(),
        statusFilter = this.state.statusFilter;

    if (nameFilter.length) {
      matchName = name.indexOf(nameFilter) >= 0;
    }

    if (statusFilter.length) {
      userMergedData = getUserObjectByEmail(user.email);
      switch (statusFilter) {
        case 'complete':
          matchStatus = userMergedData.stats.pctComplete >= 100;
          break;
        case 'inprogress':
          matchStatus = userMergedData.stats.pctInprogress > 0;
          break;
        case 'notstarted':
          matchStatus = userMergedData.stats.pctNotEnrolled >= 100;
          break;
        default:
          console.warn('Unknown filter status', statusFilter);
      }
    }
    return matchName && matchStatus;
  }

  render() {
    let structure     = getCurrentStructure(),
        allEmployees  = AppStore.getState().hierarchy.allEmployees,
        employees     = AppStore.getState().hierarchy.employees,
        tree          = AppStore.getState().hierarchy.tree,
        currentUser   = AppStore.getState().currentuser,
        firstLevelMgr = true,
        treeToRender,
        treeNotCurrentUser,
        treeCurrentUser;

    treeCurrentUser    = Object.keys(tree).filter(key => key === currentUser.email);
    treeNotCurrentUser = Object.keys(tree).filter(key => key !== currentUser.email);

    if (treeNotCurrentUser.length === 0) {
      // A first level manager
      treeToRender = treeCurrentUser;
    } else {
      // A second level manager
      treeToRender  = treeNotCurrentUser;
      firstLevelMgr = false;
    }

    treeToRender.sort();

    // For 2nd level and above, add data for their directs
    if (!firstLevelMgr) {
      treeToRender.unshift(currentUser.email);
    }

    let allVisibleEmployeesEmail = treeToRender.reduce((acc, mgr) => {
      acc = concat(acc, tree[mgr]);
      return acc;
    }, [])
      .filter(this._userObjMatchesFilter.bind(this))
      .map(obj => obj.email);

    return (
      <div>
        <PageModule className="padding-none">
          <div className="color-bg-body">
            <Row>
              <Col className="">
                <Card hControls={<FilterForm
                  onFilterChange={this._onFilterChange.bind(this)}
                  onStatusChange={this._onStatusChange.bind(this)}/>}
                      title={'Team report for ' + currentUser.fullname}>
                  <p className='margin-bottom text-center'>Note: Learner
                    completions are updated every night at 1am EST.</p>

                  <StatisticsRow
                    stats={getStatsForUsersByEmail(allVisibleEmployeesEmail)}/>
                  {
                    treeToRender.map(mgr => {

                      let employeesUnderMgr = tree[mgr],
                          mgrName           = `${currentUser.fullname}'s directs`,
                          mgrEmail          = currentUser.email,
                          mgrProfile        = allEmployees.filter(m => m.email === mgr)[0],
                          filteredEmployees = employeesUnderMgr.filter(this._userObjMatchesFilter.bind(this)),
                          filterDifference  = employeesUnderMgr.length - filteredEmployees.length,
                          filterMessage     = filterDifference > 0 ?
                            <p>{filterDifference} people are hidden by the
                              filtering options.</p> : null,
                          accordionActive   = false;

                      /*
                      If there are no filters, collapse
                      If there are filters, show only if matched
                       */
                      if (this._isFiltering()) {
                        accordionActive = filteredEmployees.length > 0;
                      }

                      if (!firstLevelMgr && mgrProfile) {
                        mgrName  = mgrProfile.firstname + ' ' + mgrProfile.lastname;
                        mgrEmail = mgrProfile.email;
                      }

                      if (firstLevelMgr) {
                        return (<div>
                          <div className="text-center margin-bottom">
                            <em>{filterMessage}</em></div>
                          <EmployeesList filteredEmployees={filteredEmployees}
                                         structure={structure}/>

                        </div>);
                      } else {
                          return (<Accordion
                            disabled={filteredEmployees.length === 0}
                            title={<ManagerRowTitle
                            name={mgrName}/>}
                                             active={accordionActive}
                                             className='rh-accordion-header-negative'>
                            <div className="text-center margin-bottom">
                              <em>{filterMessage}</em></div>
                            <StatisticsRow
                              stats={getStatsForUsersByEmail(filteredEmployees.map(e => e.email))}/>

                            <EmployeesList filteredEmployees={filteredEmployees}
                                           structure={structure}/>
                          </Accordion>);
                      }
                    })
                  }
                </Card>
              </Col>
            </Row>
          </div>
        </PageModule>
      </div>);
  }
}

const EmployeesList = ({filteredEmployees, structure}) => (
  <AccordionVGroup>
    {
      filteredEmployees.map(employee => {
        let userObject = getUserObjectByEmail(employee.email),
            status     = <StatusLabel>-</StatusLabel>;

        if (isUserComplete(userObject)) {
          status = <StatusLabel
            type="success">Completed</StatusLabel>;
        } else if (isUserInProgress(userObject)) {
          status =
            <StatusLabel icon="refresh" type="info">In
              progress</StatusLabel>;
        } else if (isUserNotStarted(userObject)) {
          status =
            <StatusLabel>Not started</StatusLabel>;
        }

        return (
          <Accordion title={<EmployeeRowTitle
            name={employee.firstname + ' ' + employee.lastname}
            pctComplete={userObject.stats.pctComplete}
            status={status}/>}
                     active={false} className='rh-accordion-header-light'>
            <StructureTable structure={structure}
                            employee={employee}
                            employeeData={userObject}/>
          </Accordion>);

      })
    }
  </AccordionVGroup>
);

ReportingPage.defaultProps = {};
ReportingPage.propTypes    = {};

const mapStateToProps = state => {
  return {
    config: state.config
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(ReportingPage);