import DefaultState from '../DefaultState';
import * as Actions from '../actions/ActionTypes';

export const allegoLRS = (state = DefaultState.allegoLRS, action) => {
  switch (action.type) {
    case Actions.SET_ALLEGOLRS:
      return [...action.allegoLRS];
    default:
      return state;
  }
};