// rate tester for kendra throttle

const sleep = require('util').promisify(setTimeout)
const AWS = require('aws-sdk');
AWS.config.update({
  maxRetries:  8, // default 3
  retryDelayOptions: {
    base: 600, // default 100
  },
});



async function query(kendraClient, kendra_params, params, resArray) {
    var j, count_throttles=0, count_sleeps=0, count_successes=0;
    var start = new Date().getTime();
    
    for (j=0; j<params.NUM_QUERIES; j++) {
        try {
            var data = await kendraClient.query(kendra_params).promise();
            count_successes++;
            resArray.push(data);
            sleep(params.NUM_SECONDS_SPACE*1000);
        } catch(error) {
            if (error==="Error from Kendra query request:ThrottlingException: null" || error.code==="ThrottlingException") {
                count_throttles++;
                sleep(params.NUM_SECONDS_SPACE*1000);
                count_sleeps++;
            } else {
                console.log(error);
            }
        }
    }
    var end = new Date().getTime();
    var metadata = {
        count_throttles:count_throttles,
        count_sleeps:count_sleeps,
        count_successes:count_successes,
        time:(end-start)/1000
    }
    return metadata
}


// kendra faq no fallback
function user(kendra_params,params,resArray) {
    return new Promise(async function(resolve, reject) {
        var kendraClient = new AWS.Kendra({apiVersion: '2019-02-03', region:'us-east-1'});
        var metadata = await query(kendraClient, kendra_params, params, resArray);
        console.log(JSON.stringify(metadata,null,2));
        resolve(metadata);
    })
}


async function rate_tester() {
    console.log('entering rate tester');
    var NUM_USERS = 1;
    var NUM_SECONDS_SPACE = 2;
    var NUM_QUERIES_PER_USER = 10;
    
    var u;
    var kendra_params = {
        // IndexId:'e1c23860-e5c8-4409-ae26-b05bd6ced00a', // developer edition
        IndexId:'4cb810f8-4326-43f2-ba22-aaccd447a1e2', // enterprise edition
        // QueryText:'How old is the sun?',    // KendraFallback
        QueryText:'What are the goals of an economy?',    // KendraFAQ
    }
    var user_params = {
        NUM_QUERIES:NUM_QUERIES_PER_USER,
        NUM_SECONDS_SPACE:NUM_SECONDS_SPACE
    }
    
    var promises=[], resArray=[];
    
    for (u=0; u<NUM_USERS; u++) {
        promises.push(user(kendra_params, user_params, resArray));
    }
    console.log('waiting for promises');
    await Promise.all(promises);
    console.log(`${NUM_USERS} users, ${NUM_SECONDS_SPACE} spaces, ${NUM_QUERIES_PER_USER} queries/user`);
}


// async function burst tester




describe('#test throttle rates()', () => {
    it('rate_tester', async function() {
        await rate_tester();
    });
    
});






