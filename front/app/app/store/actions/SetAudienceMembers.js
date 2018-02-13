import * as Actions from './ActionTypes';

const SetAudienceMembers = (audiencemembers)  => {
  return {
    type: Actions.SET_AUDIENCEMEMBERS,
    audiencemembers
  };
};

export default SetAudienceMembers;

