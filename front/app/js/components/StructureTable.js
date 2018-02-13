import React from 'react';
import { connect } from 'react-redux';
import { Col, Row } from '../rh-components/rh-Grid';
import { Card } from '../rh-components/rh-Card';
import DonutChart from '../rh-components/rh-DonutChart';
import { StatusIconTiny } from '../rh-components/rh-StatusIcon';
import { removeEntityStr, removeTagsStr } from '../utils/Toolbox';
import { getUserContentObjById } from '../store/selectors';

// TODO Get period title from title prop or category depending
const PeriodCard = (period, employee,showOnlyRequired) => {
  let title = period.title || period.category;
  return period.topics.map(topic => TopicCard(title, topic, employee,showOnlyRequired));
};

const TopicCard = (periodTitle, topic, employee,showOnlyRequired) =>
  topic.content.map(id => <ContentRow periodTitle={periodTitle}
                                      topicTitle={topic.title}
                                      contentId={id}
                                      employee={employee}
                                      showOnlyRequired={showOnlyRequired}
  />);

const ContentRow = ({periodTitle, topicTitle, contentId, employee, showOnlyRequired}) => {
  let contentObj   = getUserContentObjById(employee, contentId),
      title,
      status       = <StatusIconTiny type="none"/>,
      completeDate = '-',
      rowClass     = [];

  // If show only required is true, then it content obj won't be found if the
  // content isn't required.
  if (Object.keys(contentObj).length === 0) {
    return <tr/>;
  }

  title = removeEntityStr(removeTagsStr(contentObj.title));

  if (contentObj.isComplete) {
    let date     = contentObj.lmsStatusDate || contentObj.lrsStatusDate || contentObj.allegoStatusDate;
    status       = <StatusIconTiny type="success"/>;
    completeDate = date.format('ll');
  } else if (contentObj.status === 1) {
    status = <StatusIconTiny type="inprogress"/>;
  }

  if (contentObj.isRequired && !showOnlyRequired) {
    rowClass.push('structure-table-required')
  }

  // Removed topics for WWC since there are none
  //<td className="structure-table-topic">{topicTitle}</td>
  return (<tr className={rowClass.join(' ')}>
    <td className="structure-table-status">{status}</td>
    <td className="structure-table-period">{periodTitle}</td>
    <td className="structure-table-activitytitle">{title}</td>
    <td className="structure-table-completion">{completeDate}</td>
  </tr>);
};

class StructureTable extends React.Component {

  constructor () {
    super();
    this.state = {};
  }

  componentDidMount () {}

  render () {
    let {structure, employee, employeeData} = this.props,
        {showOnlyRequired} = this.props.config.setup.interface;

    // Removed topics for WWC since there are none
    //<td>Topic</td>

    return (<div className="padded">
      <Card style="bars">
        <Row className="fxgrid-row-center">
          <Col><h2>Status
            For {employee.firstname + ' ' + employee.lastname}</h2>
            <p><strong>{employeeData.stats.numComplete}</strong> of&nbsp;
              <strong>{employeeData.content.length}</strong> activities
              completed</p></Col>
          <Col width="2"><DonutChart value={employeeData.stats.pctComplete}
                                     size={80} strokewidth={5}
                                     valuelabel="Complete"
                                     className="rh-donutchart-success margin-center"/></Col>
        </Row>
        <hr/>
        <table className="rh-custom-table table-small">
          <thead>
          <tr>
            <td>Status</td>
            <td>Category</td>
            <td>Activity</td>
            <td>Completed</td>
          </tr>
          </thead>
          {structure.data.map(period => PeriodCard(period, employee,showOnlyRequired))}
        </table>
        {!showOnlyRequired ? <p className="small"><i>Required items are highlighted in blue.</i></p> : null}
      </Card>
    </div>);
  }
}

const mapStateToProps = state => {
  return {
    config: state.config
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(StructureTable);

//StructureTable.defaultProps = {};
//StructureTable.propTypes    = {};
//
//export default StructureTable;