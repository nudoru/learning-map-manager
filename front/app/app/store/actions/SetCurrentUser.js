import * as Actions from './ActionTypes';

const SetCurrentUser = (currentuser)  => {
  return {
    type: Actions.SET_CURRENTUSER,
    currentuser
  };
};

export default SetCurrentUser;

