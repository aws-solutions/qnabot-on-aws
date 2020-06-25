var assert = require('assert');

// kendra fallback test
const kendraFallback = require('../KendraFallback.js');

async function test_markdown() {
    const event = require('./event_FAQ_md.json');
    const context = require('./context_FAQ_md.json');
    event.test = true;
    const actual_resp = await kendraFallback.handler(event, context);
    return actual_resp;
}

async function test_top_ans() {
    const event = require('./event_top_ans.json');
    const context = require('./context_top_ans.json');
    event.test2 = true;
    const actual_resp = await kendraFallback.handler(event, context);
    return actual_resp;
}

async function test_doc_query() {
    const event = require('./event_doc_query.json');
    const context = require('./context_doc_query.json');
    event.test3 = true;
    const actual_resp = await kendraFallback.handler(event, context);
    return actual_resp;
}

describe('#test_kendra_highlights()', () => {
    it('test_markdown', async function() {
        let resp = await test_markdown();
        
        // tests that in markdown format, highlights are boldened
        assert.equal(resp.res.session.appContext.altMessages.markdown, 
        "*Answer from Amazon Kendra FAQ.* \n \n\nEight **planets** **orbit** the **sun**. Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Sorry I'm required to leave out my favorite, Pluto");
    });
    it('test_top_answer', async function() {
        let resp = await test_top_ans();
        
        // tests that in markdown format, only the top answer phrase is returned with the link from where it is extracted
        assert.equal(resp.res.session.appContext.altMessages.markdown,
        "*Answer from Amazon Kendra.* \n \n\n**Sun** \n\n #### Possible Links\n\n [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf)");
        
        // tests that in SSML format, only the top answer phrase is returned
        assert.equal(resp.res.session.appContext.altMessages.ssml,
        "<speak> Answer from Amazon Kendra.    Sun </speak>");
    });
    it('test_doc_query', async function() {
       let resp = await test_doc_query();
       
       // tests that when querying an unstructured document, highlights are boldened in the excerpts when no top answer is found
       assert.equal(resp.res.session.appContext.altMessages.markdown,
       undefined);
    });

    
});