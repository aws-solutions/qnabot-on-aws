const AWS = require('aws-sdk');
const debug = require('debug')('solarflare');
const axios = require('axios');
const moment = require('moment');
const awsRegion = process.env.Region ? process.env.Region : 'us-east-1';
const baseurl = 'https://api.nasa.gov/DONKI/FLR';


async function handleQuery(event) {
  let axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  try {

    /* TODO - call the DONKI solar flare ExtensionScriptApis and await its response.
     *   const finalUrl = baseurl + '?startDate=2017-01-01' + '&api_key=' + process.env.api_key;
     *   let res = await axios(finalUrl, axiosConfig);
     */


    /* TODO - check if an argument was passed to the function that indicates how many recent
     * solar flare incidents should e returned to the caller. Look in
     * event.res.result.args
     */


    /* TODO - if a count was passed to the function in the first argument,
     * return a custom payload that contains markdown data with the last several solar flares.
     */

    /* TODO - else if no arguments passed to the function, then check to see if any solar flares have
     * occurred in the last 30 days and augment the response message with a message that indicates
     * recent solar flares have occurred.
     */

    debug("returning: " + JSON.stringify(event, null, 2));
    return event;

  } catch (err) {
    debug("ERROR: " + err);
    event.res.message += "Failed to determine solar flare information. " + err;
    debug("returning: " + JSON.stringify(event, null, 2));
  }
}

exports.lambdaHandler = async (event, context) => {
  debug('input event: ' + JSON.stringify(event, null, 2));
  return await handleQuery(event);
};

