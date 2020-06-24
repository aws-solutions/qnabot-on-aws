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
        "*Answer from Amazon Kendra FAQ.* \n \n\nEight **planets** **orbit** the **sun**. Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Sorry I'm required to leave out my favorite, Pluto");
    })
    it('test_top_answer', async function() {
        let resp = await test_top_ans();
        assert.equal(resp.res.session.appContext.altMessages.markdown,
        "*Answer from Amazon Kendra.* \n \n\n**Sun** ");
        assert.equal(resp.res.session.appContext.altMessages.ssml,
        "<speak> Answer from Amazon Kendra.    Sun </speak>");
        // TODO: add test to check that document excerpts are highlighted when top answer Not found
    });

    
});