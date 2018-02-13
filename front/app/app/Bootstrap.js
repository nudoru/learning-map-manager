import React from 'react';
import {Provider} from 'react-redux';
import ModalMessage from './rh-components/rh-ModalMessage';
import PleaseWaitModal from './rh-components/rh-PleaseWaitModal';
import App from './App';

import {fetchConfigData} from './services/fetchConfig';
import AppStore from './store/AppStore';
import SetConfig from './store/actions/SetConfig';

let configFile = 'config.json';

const LoadingMessage = () =>
  <PleaseWaitModal><h1>Please wait ...</h1>
  </PleaseWaitModal>;

const ErrorMessage = () =>
  <ModalMessage message={{
    title: `There was a problem loading the configuration: ${configFile}.`,
    icon : 'exclamation',
    error: true
  }}>
  </ModalMessage>;

const Application = () =>
  <Provider store={AppStore}>
    <App/>
  </Provider>;

class Bootstrap extends React.Component {

  constructor() {
    super();
    this.state = {
      isLoading: true,  // Loading the config.json file
      isError  : false // Error loading the file?
    };
  }

  // On initial mounting of the component, load config or start app
  componentDidMount() {

    const mapConfig = this.getParameterByName('map');
    if(mapConfig) {
      configFile = mapConfig;
    }

    // Email from URL is for DEBUG ONLY
    const email     = this.getParameterByName('e');
    if(email) {
      // Will be picked up in App.js
      window.userEmail = email;
    }

    console.log(`From the URL: map ${mapConfig}, user ${email}`);

    this.fetchConfig();
  }

  //https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name        = name.replace(/[\[\]]/g, "\\$&");
    let regex   = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // Start the app or load the configuration file
  fetchConfig() {
    fetchConfigData(configFile).fork(e => {
        this.setState({isLoading: false, isError: true});
        console.error('Error loading config file: ', e);
      },
      config => {
        AppStore.dispatch(SetConfig(config));
        this.setState({isLoading: false});
      });
  }

  render() {
    // return Either
    //         .fromBool(this.state.isLoading)
    //         .fold(
    //           () => Either
    //                 .fromBool(this.state.isError)
    //                 .fold(() => <Application/>,
    //                   () => <ErrorMessage/>),
    //           () => <LoadingMessage/>);

    if (this.state.isLoading) {
      return <LoadingMessage/>;
    } else if (this.state.isError) {
      return <ErrorMessage/>;
    } else {
      return <Application/>;
    }

  }
}

export default Bootstrap;