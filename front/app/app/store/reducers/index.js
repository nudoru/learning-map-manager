import {combineReducers} from 'redux';
import {config} from './config';
import {hierarchy} from './hierarchy';
import {currentuser} from './currentuser';
import {allegoLRS} from './allegoLRS';
import {audiencemembers} from './audiencemembers'

export const reducer = combineReducers({config, hierarchy, currentuser, allegoLRS, audiencemembers});