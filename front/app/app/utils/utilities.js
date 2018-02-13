import moment from 'moment';
import {compose, curry, both, contains, sequence} from 'ramda';
import {removeTagsStr, removeEntityStr, removeWhiteSpace} from './Toolbox';

export const noOp = () => {};

// -1 past, 0 current, 1 future
// Start and End should be moment instances
export const getTimePeriod = (startM, endM) => {
  if(!startM || !endM) {
    return 2;
  }

  let nowM   = moment();

  // isSame compares down to the millisecond, so convert it to a date string for the compare
  if(moment(nowM.format("L"), 'MM/DD/YYYY').isSame(moment(startM.format("L"), 'MM/DD/YYYY')) || moment(nowM.format("L"), 'MM/DD/YYYY').isSame(moment(endM.format("L"), 'MM/DD/YYYY'))) {
    return 0;
  } else if (moment(startM).isAfter(nowM)) {
    return 1;
  } else if (nowM.isAfter(endM)) {
    return -1;
  }

  return 0;
};

export const contentTitleToLink = (title) => 'https://www.redhat.com/en#'+removeWhiteSpace(title);

//------------------------------------------------------------------------------
// Composabile f()s
// Refer to functional.js for more
//------------------------------------------------------------------------------

// Characters we shouldn't allow in user ID input
export const badInputChars = ['#', '@', '!', ';', '[', ']', '(', ')', '{', '}', '"', '\'', '%', '&', '$', '|', ' '];
// Number, String => true | false
export const stringLengthIsLessThan = curry((maxLen, str) => (str.length && str.length <= maxLen ));
// String => true | false
export const containsNoBadChars = (str) => badInputChars.some(char => contains(char, str));
// Array => true | false
export const hasLength = a => a.length ? true : false;
// String, Object => true : false
export const idMatchObjId = curry((id, obj) => id === obj.id);
// Object<Object<Boolean>> => Number
export const isCompletedToNum = c => c.status.completed ? 2 : 1;

//------------------------------------------------------------------------------
// Utils
//------------------------------------------------------------------------------

// Chain an array of Tasks in to one task
export const chainTasks = (taskArry) => sequence(Task.of, taskArry);

// Validate user name input, length must be >0 and <30 and have no bad chars
// String => true | false
export const validateInputStr = (str) => both(stringLengthIsLessThan(30), containsNoBadChars)(str);

// String -> String
export const stripHTML = (str) => compose(removeTagsStr, removeEntityStr)(str);

// For debugging in a compose
export const trace = x => {
  console.log('>>> ', x);
  return x;
};

// 1 Just getting an array w/ unique values using a object/keys then getting the keys
const keys = obj => Object.keys(obj);
// 2
const createObjectKeyMap = curry((key, arry) => arry.reduce((acc, el) => {
  acc[el[key]] = 1;
  return acc;
}, {}));
// 3
export const getUniqueKeys = (key, arry) => compose(keys, createObjectKeyMap(key))(arry);

/*
 Turn an object of {key1:value1, key2:value2, ...} into paramname=value[&...] for a
 */
// acc += (idx > 0 ? '&' : '') + key + '=' + encodeURIComponent(objArry[key]);
export const parameterize = objArry =>
  Object
    .keys(objArry)
    .reduce((acc, key) => {
      acc.push(key + '=' + encodeURIComponent(objArry[key]));
      return acc;
    }, ['?'])
    .join('&');