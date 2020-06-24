var assert = require('assert');

// kendra fallback test
const kendraFallback = require('../KendraFallback.js');

async function test_markdown() {
    const event = require('./event_FAQ_md.json');
    const context = require('./context_FAQ_md.json');
    event.test = true;
    const actual_resp = await kendraFallback.handler(event ,context);
    return actual_resp;
}

async function test_top_ans() {
    const event = require('./event_top_ans.json');
    const context = require('./context_top_ans.json');
    event.test2 = true;
    const actual_resp = await kendraFallback.handler(event ,context);
    return actual_resp;
}

describe('#test_kendra_highlights()', () => {
    it('test_markdown', async function() {
        let resp = await test_markdown();
        assert.equal(resp.res.session.appContext.altMessages.markdown, 
        "*Answer from Amazon Kendra FAQ.* \n \n\nEight *planets* *orbit* the *sun*. Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Sorry I'm required to leave out my favorite, Pluto");
    })
    it('test_top_answer', async function() {
        let resp = await test_top_ans();
        assert.equal(resp.res.session.appContext.altMessages.markdown,
        "*Answer from Amazon Kendra FAQ.* \n \n\n*Sun* \n\n #### Possible Links\n\n [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf)\n\n #### Discovered Text \n\n ...from as early as the 6th century BCE. Now we know, of course,  that all the planets orbit our lone *star* — the Sun.   The Sun is the *closest* *star* to *Earth*, at a mean distance from  our planet of 149.60 million kilometers (92.96 million miles...\n\n [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf)\n\n #### Discovered Text \n\n ...Solar Cycle   Solar Storms   *Earth*’s Magnetosphere   *Earth*’s Upper Atmosphere   Space Weather   Credits   2   4   6   8   10   14   16   18        Prologue and Introduction   Now in the early 21st century, we know that the Sun is a *star*, composed mostly of hydrogen, at the center of the Solar...\n\n [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/637244main_MysteriesOfTheSun_Book.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/637244main_MysteriesOfTheSun_Book.pdf)");
        assert.equal(resp.res.session.appContext.altMessages.ssml,
        "<speak> Answer from Amazon Kendra: Sun </speak>");
    });
    
});