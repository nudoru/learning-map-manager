import Task from 'data.task';

export const fetchConfigData = (url) => {
  // console.log(`Fetching config file ${url}`);
  return new Task((reject, resolve) => {
    fetch(url)
      .then(res => res.json().then(json => {
        // console.log('Config loaded ',json);
        resolve(json);
      }))
      .catch((err) => {
      console.warn('Error loading config', err);
      reject(err);
    });
  });
};