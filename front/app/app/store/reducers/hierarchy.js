import DefaultState from '../DefaultState';
import * as Actions from '../actions/ActionTypes';

export const hierarchy = (state = DefaultState.hierarchy, action) => {
  switch (action.type) {
    case Actions.SET_HIERARCHY:
      return {...action.hierarchy};
    case Actions.SET_HIERARCHY_TREE:
      state.tree = action.tree;
      return state;
    default:
      return state;
  }
};