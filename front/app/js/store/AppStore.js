import { createStore, applyMiddleware, compose } from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import {reducer} from './reducers/index';
import DefaultState from './DefaultState';

// Debugging for Redux-devtools-extension for Chrome
// https://github.com/zalmoxisus/redux-devtools-extension#usage

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

/* eslint-disable no-underscore-dangle */
const AppStore = createStore(
  reducer,
  DefaultState,
  composeEnhancers(applyMiddleware(thunk))); //, logger
  //applyMiddleware(thunk, logger),
  //window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
/* eslint-enable */


export default AppStore;