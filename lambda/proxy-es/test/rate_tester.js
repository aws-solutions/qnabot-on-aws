var query = require('../lib/query');
const sleep = require('util').promisify(setTimeout)



var NUM_USERS = 2;
var NUM_SECONDS_SPACE = 1;
var NUM_QUERIES_PER_USER = 10;


// kendra faq no fallback
async function rate_tester(req, res) {
    var num_query = 0;
    var count_throttles = 0;
    
    while (num_query < NUM_QUERIES_PER_USER) {
        try {
            var i;
            for (i=0; i<NUM_USERS; i++) {
                await query(req, res);
            }
            await sleep(NUM_SECONDS_SPACE * 1000);
        } catch (error) {
            if (error==="Error from Kendra query request:ThrottlingException: null" || error.code==='ThrottlingException') {
                count_throttles++;
                await sleep(NUM_SECONDS_SPACE * 1000);
                continue;
            } else {
                // console.log(error);
                continue;
            }
        }
        // console.log(`${count_throttles} throttles`);
        num_query++;
    }
    
    console.log(`${NUM_USERS} users: ${count_throttles}/${NUM_QUERIES_PER_USER*NUM_USERS} throttles, ${NUM_SECONDS_SPACE} seconds before retry`);
}





describe('#test throttle rates()', () => {
    it('rate_tester', async function() {
        var req = require('./kendrafaq_nofallback/req.json');
        var res = require('./kendrafaq_nofallback/res.json')
        await rate_tester(req, res);
    });
});
