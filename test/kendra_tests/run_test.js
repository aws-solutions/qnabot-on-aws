var assert = require('assert');

// kendra fallback test
const kendraFallback = require('../KendraFallback.js');

async function test_markdown() {
    const event = require('./event_FAQ_md.json');
    const context = require('./context_FAQ_md.json');
    event.test = 1;
    const actual_resp = await kendraFallback.handler(event, context);
    return actual_resp;
}

async function test_top_ans() {
    const event = require('./event_top_ans.json');
    const context = require('./context_top_ans.json');
    event.test = 2;
    const actual_resp = await kendraFallback.handler(event, context);
    return actual_resp;
}

async function test_doc_query() {
    const event = require('./event_doc_query.json');
    const context = require('./context_doc_query.json');
    event.test = 3;
    const actual_resp = await kendraFallback.handler(event, context);
    return actual_resp;
}


describe('#test_kendra_highlights()', () => {
    it('test_markdown', async function() {
        let resp = await test_markdown();
        
        // tests that in markdown format, highlights are boldened
        assert.equal(resp.res.session.appContext.altMessages.markdown, 
        "*Answer from Amazon Kendra FAQ.* \n \n\nEight **planets** **orbit** the **sun**. Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Sorry I'm required to leave out my favorite, Pluto.");
    });
    it('test_top_answer', async function() {
        let resp = await test_top_ans();
        
        // tests that in markdown format, only the top answer phrase is returned with the link from where it is extracted
        assert.equal(resp.res.session.appContext.altMessages.markdown,
        "*Amazon Kendra suggested answer.* \n \n\n**Sun** \n\n Source Link: [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf)");
        
        // tests that in SSML format, only the top answer phrase is returned
        assert.equal(resp.res.session.appContext.altMessages.ssml,
        "<speak> Amazon Kendra suggested answer.    Sun </speak>");
    });
    it('test_doc_query', async function() {
      let resp = await test_doc_query();
       
      // tests that when querying an unstructured document, highlights are boldened in the excerpts when no top answer is found
      assert.equal(resp.res.session.appContext.altMessages.markdown,
      "*While I did not find an exact answer, these search results from Amazon Kendra might be helpful.* \n \n\nAnatomy of the Sun Mysteries of the Sun   **The Sun is an incandescent mass of hydrogen, helium, and other heavier elements**. While it appears constant and unchanging from  our vantage point on Earth, it actually has a dynamic and variable system of twisting magnetic fields that cause solar events of almost  unimaginable power.   The Convection Zone Energy continues to move toward the surface  through convection currents of heated and  cooled gas in the convection zone.       The Radiative Zone Energy moves slowly outward—taking  more than 170,000 years to radiate through  the layer of the **Sun** known as the radiative  zone.\n\n Source Link: [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/637244main_MysteriesOfTheSun_Book.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/637244main_MysteriesOfTheSun_Book.pdf)\n\n***\n\n <br>\n\n  ...Mass 1.989 × 1030 kg  Density 1.409 g/cm3  **Composition** 92.1% hydrogen, 7.8% helium,    0.1% other elements  Surface Temperature (Photosphere) 5,500 deg C      (10,000 deg F)  Luminosity*  3.83 × 1033 ergs/sec   *The total energy radiated by the **Sun** (or any star) per second at all wavelengths...\n\n  Source Link: [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/Sun_Lithograph.pdf)\n\n***\n\n <br>\n\n  ...gases may  contribute to a change in tempera- ture or water **composition** in   the atmosphere.        Stratosphere 10–31 Miles   The ozone layer lies within the   stratosphere and absorbs ultraviolet  radiation from the **Sun**.   Troposphere 0–10 Miles   The troposphere is the layer of the...\n\n  Source Link: [https://s3.us-east-1.amazonaws.com/explore-kendra-solar/637244main_MysteriesOfTheSun_Book.pdf](https://s3.us-east-1.amazonaws.com/explore-kendra-solar/637244main_MysteriesOfTheSun_Book.pdf)");

      // tests that when querying an unstructured document, the SSML response returns the longest highlight from the response when no top answer is found
      assert.equal(resp.res.session.appContext.altMessages.ssml,
      "<speak> Anatomy of the Sun Mysteries of the Sun   The Sun is an incandescent mass of hydrogen, helium, and other heavier elements. While it appears constant and unchanging from  our vantage point on Earth, it actually has a dynamic and variable system of twisting magnetic fields that cause solar events of almost  unimaginable power </speak>");
    });
});


