import * as Actions from './ActionTypes';

const SetHierarchy = (hierarchy)  => {
  return {
    type: Actions.SET_HIERARCHY,
    hierarchy
  };
};

export default SetHierarchy;

