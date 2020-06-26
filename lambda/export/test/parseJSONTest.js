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
      }
    } catch(err) {
    //   console.error(err)
      return 'false';
    }

    // TODO: CHECK CONTENTS OF CSV ROWS TO VALIDATE FORMAT
    // const csv = require('csv-parser');
    // const fs = require('fs');
    // const csv_text = [];
     
    // fs.createReadStream(csv_path)
    //   .pipe(csv())
    //   .on('data', (data) => csv_text.push(data))
    //   .on('end', () => {
    //     console.log('CSV processed');
    //     // [
    //     //   { NAME: 'Daffy Duck', AGE: '24' },
    //     //   { NAME: 'Bugs Bunny', AGE: '22' }
    //     // ]
    //   });
}


describe('#test automate-sync()', () => {
    it('test_parser', async function() {
        let resp = await test_parser();
        assert(resp, "CSV file does not exist!");
    })
});

