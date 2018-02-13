import DefaultState from '../DefaultState';
import * as Actions from '../actions/ActionTypes';

export const audiencemembers = (state = DefaultState.audiencemembers, action) => {
  switch (action.type) {
    case Actions.SET_AUDIENCEMEMBERS:
      return [...action.audiencemembers];
    default:
      return state;
  }
};