import * as Actions from './ActionTypes';

const SetAllegoLRS = (allegoLRS)  => {
  return {
    type: Actions.SET_ALLEGOLRS,
    allegoLRS
  };
};

export default SetAllegoLRS;

