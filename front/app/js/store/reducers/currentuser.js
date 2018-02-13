import DefaultState from '../DefaultState';
import * as Actions from '../actions/ActionTypes';

export const currentuser = (state = DefaultState.currentuser, action) => {
  switch (action.type) {
    case Actions.SET_CURRENTUSER:
      return {...action.currentuser};
    default:
      return state;
  }
};