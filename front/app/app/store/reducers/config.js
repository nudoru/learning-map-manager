import DefaultState from '../DefaultState';
import * as Actions from '../actions/ActionTypes';

export const config = (state = DefaultState.config, action) => {
  switch (action.type) {
    case Actions.SET_CONFIG:
      return {...action.config};
    default:
      return state;
  }
};