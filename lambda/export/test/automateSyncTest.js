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

async function test_trigger_export() {
  const triggerExport = require('../ExportJSON.js');
  const KendraSyncExport = triggerExport.KendraSyncExport();


    var data={
        "bucket":params.bucket,
        "index":params.index,
        "id":params.id,
        "config":"status/"+params.id,
        "tmp":"tmp/"+params.id,
        "key":"data/"+params.id,
        "filter":"",
        "status":"Started"
    };

  var params = {
    "bucket":"explore-kendra-solar",
    "index":"",     // what index is this?
    "faq_index":"e1c23860-e5c8-4409-ae26-b05bd6ced00a",
    "id":"",
    "config":"kendra-status/"+params.id,
    "tmp":"tmp/"+params.id,
    "key":"data/"+params.id,
    "filter":"",
    "status":"Started"
  };
  
  const trigger_export = KendraSyncExport.Export(params);
  // const read = KendraSyncExport.Read(params);
  // const convert = KendraSyncExport.Convert(params);
  // const create = KendraSyncExport.Create(params);
}


describe('#test automate-sync()', () => {
    it('test_json_parser', async function() {
        let resp = await test_parser();
        assert(resp, "CSV file does not exist!");
    });
    
    it('test_create_faq', async function() {
        let resp = await test_create_faq();
        assert(resp, undefined);  // TODO: fill in later
    });
    
    // it('test_trigger_export', async function() {
    //   let resp = await test_trigger_export();
    //   console.log(resp);
    // })
});

