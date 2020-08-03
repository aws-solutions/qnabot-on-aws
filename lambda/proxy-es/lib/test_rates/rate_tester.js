var query = require('../query');
const sleep = require('util').promisify(setTimeout)

var NUM_USERS = 1;
var NUM_SECONDS_SPACE = 0;


// kendra faq no fallback
async function rate_tester(req, res) {
    var num_query = 0;
    var count_throttles = 0;
    
    while (num_query < 10) {
        try {
            await query.exports(req, res);
        } catch (error) {
            if (error.code=='ThrottlingException') {
                console.log(`Throttling exception: trying query again in ${NUM_SECONDS_SPACE} seconds`);
                count_throttles++;
                await sleep(NUM_SECONDS_SPACE * 1000);
                continue;
            } else {
                console.log(`ERROR: ${JSON.stringify(error,null,2)}`);
            }
        }
    }
    
    console.log(`${NUM_USERS} users: ${count_throttles} throttles for ${NUM_SECONDS_SPACE} seconds retry after hitting exception`);
}





describe('#test throttle rates()', () => {
    it('rate_tester', async function() {
        var req = require('kendrafaq_nofallback/req.json');
        var res = require('kendrafaq_nofallback/res.json')
        await rate_tester(req, res);
    });
});
