var assert = require('assert');

// json parsing test
async function test_parser() {
    const parseJSON = require('../parseJSON.js');
    const csv_path = await parseJSON.handler('./test/qna_export.json', './test/qna_FAQ.csv', true);
    const fs = require('fs')

    try {
      if (fs.existsSync(csv_path)) {
        //file exists
        return 'exists';
      } else {
        return false;
      }
    } catch(err) {
    //   console.error(err)
      return false;
    }

    // TODO: CHECK CONTENTS OF CSV ROWS TO VALIDATE FORMAT
}


// create FAQ test
async function test_create_faq() {
    const createFAQ = require('../createFAQ.js');
    return createFAQ.handler();

}


describe('#test automate-sync()', () => {
    it('test_json_parser', async function() {
        let resp = await test_parser();
        assert(resp, "CSV file does not exist!");
    });
    
    it('test_create_faq', async function() {
        let resp = await test_create_faq();
        assert(resp, undefined);
    });
});

