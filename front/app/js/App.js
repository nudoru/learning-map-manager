import React from 'react';
import {connect} from 'react-redux';
import {HashRouter as Router, Route, Switch} from 'react-router-dom';
import {resetId} from './utils/ElementIDCreator';
import HeaderSubPage from './rh-components/rh-HeaderSubPage';
import Footer from './rh-components/rh-Footer';
import PleaseWaitModal from './rh-components/rh-PleaseWaitModal';
import PageModule from './rh-components/rh-PageModule';
import ReportingPage from './pages/ReportingPage';
import SetHierarchy from './store/actions/SetHierarchy';
import SetCurrentUser from './store/actions/SetCurrentUser';
import SetAllegoLRS from './store/actions/SetAllegoLRS';
import SetAudienceMembers from './store/actions/SetAudienceMembers';
import AppStore from './store/AppStore';
import {
  filterHierarchyForAudience, getAllEmployeesInHierarchyTree,
  mergeContentAndLearningProgress
} from './store/selectors';
import {requestUserProfile} from './utils/learningservices/lms/GetUserProfile';
import {getLearningForManagerHierarchy} from './utils/learningservices/shadow/GetHierarchy';
import {requestCohortMembers} from './utils/learningservices/lms/GetCohortMembers';
import {requestUsersLRS} from './utils/learningservices/lrs/RequestUsersLRS';
import {sendFragment} from './utils/learningservices/lrs/LRS';

const LoadingMessage = () =>
  <PleaseWaitModal><h1>Reticulating splines ...</h1>
  </PleaseWaitModal>;

const LoadingProfileMessage = () =>
  <PleaseWaitModal><h1>Loading user profile ...</h1>
  </PleaseWaitModal>;

const LoadingDataMessage = ({progress}) =>
  <PleaseWaitModal><h1>Loading hierarchy and learning data ({progress}) ...</h1>
  </PleaseWaitModal>;

const RouteMessage = ({children}) =>
  <div>
    <PageModule>
      <div className="color-bg-body">
        <h1>{children}</h1>
      </div>
    </PageModule>
  </div>;

const AppHeader = ({config}) =>
  <HeaderSubPage title={config.setup.title}
                 secondaryNav={config.setup.secondaryNav}
                 username='Joe User'/>;

const AppRouter = ({config}) =>
  <Router>
    <div className="application-container">
      <AppHeader config={config}/>
      <div className="application-content">
        <Switch>
          <Route exact path="/" component={ReportingPage}/>
          <Route path="/404" render={() => <RouteMessage>There's nothing
            here.</RouteMessage>}/>
          <Route render={() => <RouteMessage>There's nothing
            here.</RouteMessage>}/>
        </Switch>
      </div>
      <Footer/>
    </div>
  </Router>;

class App extends React.Component {

  constructor() {
    super();
    this.state = {
      isProfileLoaded: false,
      isDataLoaded   : false,
      loadingProgress: 0
    };
    //this.storeListener;
  }

  componentDidMount() {
    //this.storeListener = AppStore.subscribe(() => console.log('Action'));
    // this._loadProfile();
    this._loadAudience();
  }

  // load audience members
  _loadAudience() {
    let {webservice, audienceid} = this.props.config;

    if (audienceid.length) {
      // console.log('load audience', audienceid);
      requestCohortMembers(webservice, audienceid).fork(console.error, res => {
        // console.log('got cohort members', res[0].userids);
        AppStore.dispatch(SetAudienceMembers(res[0].userids));
        // filterHierarchyForAudience();
        // this._loadAllego();
        this._loadProfile();
      });
    } else {
      // this._loadAllego();
      // AppStore.dispatch(SetAudienceMembers([3046, 13366, 7514]));
      this._loadProfile();
    }

  }

  _loadProfile() {
    let {defaultuser, webservice} = this.props.config;

    if (window.userEmail && window.userEmail.length > 10) {
      defaultuser = window.userEmail;
    }

    if(!defaultuser) {
      console.error(`Don't have a user. Stopping.`);
      return;
    } else {
      // console.log(`Loading profile for ${defaultuser}`);
    }

    requestUserProfile(webservice, defaultuser, 'email').fork(console.error, res => {
      //console.log('got user profile', res[0]);
      AppStore.dispatch(SetCurrentUser(res[0]));
      this._sendLoggedInStatement();
      this.setState({isProfileLoaded: true});
      this._loadHierarchyLearningData();
    });
  }

    _sendLoggedInStatement() {
        const state = AppStore.getState();
        const fragment = {
            verbDisplay: 'loggedin',
            objectName: state.config.setup.title + ' Manager Dashboard',
            objectType: 'page',
            objectID: state.config.webservice.lrs.contextID + '#mngrdb',
            subjectName: state.currentuser.fullname,
            subjectID: state.currentuser.email
        };
        sendFragment(state.config.webservice.lrs, fragment)
            .fork(e => {
                    console.error('Error sending statement: ', e);
                },
                r => {
                    console.log('Statement sent!', r);
                });
    }

  // Load the hierarchy and learner data for each direct report
  _loadHierarchyLearningData() {
    let {webservice} = this.props.config,
        currentUser  = AppStore.getState().currentuser,
    audience = AppStore.getState().audiencemembers;

    getLearningForManagerHierarchy(webservice, currentUser.id, audience ,this._onLoadingProgress.bind(this)).fork(console.error, res => {
      console.log('hierarchy loaded', res);
      AppStore.dispatch(SetHierarchy(res));
      // this._loadAudience();
      this._loadAllego();
    });
  }

  _onLoadingProgress(p) {
    this.setState({loadingProgress: p});
  }



  // load allego statements for everyone
  _loadAllego() {
    let {webservice} = this.props.config;

    if (webservice.allegolrs) {
      requestUsersLRS({lrs: webservice.allegolrs}, getAllEmployeesInHierarchyTree().map(o => o.email))
        .fork(err => {
          console.warn('!!! Could not load Allego statements !!!', err);
          this._allDataLoaded();
        }, res => {
          //console.log('Allego LRS', res);
          AppStore.dispatch(SetAllegoLRS(res));
          this._allDataLoaded();
        });
    } else {
      this._allDataLoaded();
    }
  }

  _allDataLoaded() {
    // console.log('all data loaded');
    mergeContentAndLearningProgress();
    this.setState({isDataLoaded: true});
  }

  render() {
    if (this.state.isDataLoaded && this.state.isProfileLoaded) {
      resetId();
      //return <AppRouter config={this.props.config}/>;
      return (<div className="application-container">
        <AppHeader config={this.props.config}/>
        <div className="application-content">
            <ReportingPage/>
        </div>
        <Footer/>
      </div>);

    } else if (!this.state.isProfileLoaded) {
      return <LoadingProfileMessage/>;
    } else if (!this.state.isDataLoaded) {
      return <LoadingDataMessage progress={this.state.loadingProgress}/>;
    }
  }
}

App.propTypes = {};

const mapStateToProps = state => {
  return {
    config: state.config
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(App);