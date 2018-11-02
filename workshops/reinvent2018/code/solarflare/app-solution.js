const debug = require('debug')('solarflare');
const axios = require('axios');
const moment = require('moment');
const baseurl = 'https://api.nasa.gov/DONKI/FLR';


async function handleQuery(event) {
  let axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  try {
    debug("Calling via axios");
    const finalUrl = baseurl + '?startDate=2017-01-01' + '&api_key=' + process.env.api_key;
    let res = await axios(finalUrl, axiosConfig);
    debug("RESPONSE RECEIVED: ", JSON.stringify(res.data, null, 2));

    // if lambdahook argument requests last solar flares, walk the returned flares up to
    // count provided adding to output using markdown
    let recentCount = 0;
    if (event.res.result.args &&
      event.res.result.args.length > 0 &&
      event.res.result.args[0] &&
      event.res.result.args[0].length > 0) {
      recentCount = parseInt(event.res.result.args[0]);
    }

    if (recentCount > 0) {
      //walk the return data and provide dates for the requested number of solar flares
      let cnt = 0;
      if (res.data.length > 0) {
        let messageMarkDown = '';
        let plainMessage = '';
        let ssmlMessage = '';
        for (let i = res.data.length - 1; i >= 0 && cnt < recentCount; i--) {
          const t = moment(res.data[i].beginTime);
          messageMarkDown += "\n* " + t.format('MM-DD-YYYY');
          plainMessage += "\n" + t.format('MM-DD-YYYY');
          if (cnt+1 === recentCount || i === 1) {
            ssmlMessage +=', and '+ t.format('MM-DD-YYYY');
          } else {
            ssmlMessage +=', '+ t.format('MM-DD-YYYY');
          }
          cnt++;
        }

        // for markdown using lex-web-ui specific attribute
        event.res.session.appContext.altMessages.markdown= messageMarkDown;
        
        // for Alex and lex-web-ui set message and tyhpe to SSML
        ssmlMessage = '<speak>' + ssmlMessage + '</speak>';
        event.res.message = ssmlMessage;
        event.res.type = 'SSML';
        
        // always include a plainMessage for fallback / Alexa Show
        event.res.plainMessage = plainMessage;
      }

    } else {
      // check dates for recent solar flares.
      let recentFlares = false;
      let recentFlaresEventTime = '';

      let oneMonthAgo = moment().subtract(30, 'days');
      debug('computed month ago: ' + oneMonthAgo);
      res.data.forEach((o) => {
        debug(`reported event time: ${o.beginTime}`);
        let beginTime = moment(o.beginTime);
        debug('parsed beginTime: ' + beginTime);
        if (beginTime > oneMonthAgo) {
          recentFlares = true;
          recentFlaresEventTime = o.beginTime;
        }
      });
      if (recentFlares) {
        debug('recent flares detected');
        event.res.message += ' Alert. Recent Solar Flare has been reported on ' + recentFlaresEventTime;
      } else {
        debug('recent flares not reported in the last 30 days');
      }
    }
    debug("RETURNING: " + JSON.stringify(event, null, 2));
    return event;
  } catch (err) {
    debug("ERROR: " + err);
    event.res.message += "Failed to determine solar flare information. " + err;
    debug("RETURNING: " + JSON.stringify(event, null, 2));
  }
}

exports.lambdaHandler = async (event, context) => {
  debug("Input event: " + JSON.stringify(event,null,2));
  debug("calling handleQuery");
  return await handleQuery(event);
};

