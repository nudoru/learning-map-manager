import * as Actions from './ActionTypes';

const SetHierarchyTree = (tree)  => {
  return {
    type: Actions.SET_HIERARCHY_TREE,
    tree
  };
};

export default SetHierarchyTree;

