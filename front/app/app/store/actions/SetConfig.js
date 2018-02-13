import * as Actions from './ActionTypes';

const SetConfig = (config)  => {
  return {
    type: Actions.SET_CONFIG,
    config
  };
};

export default SetConfig;

