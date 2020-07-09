var assert = require('assert');

// json parsing test
async function test_parser() {
    const parseJSON = require('../parseJSON.js');
    var content = require('./qna_export.json');
    var parseJSONparams = {
        csv_name:'qna_FAQ.csv',
        content:content,
        output_path:'/tmp/qna_FAQ.csv',
    }
    const csv_path = await parseJSON.handler(parseJSONparams);
    
    const fs = require('fs')

    try {
      if (fs.existsSync(csv_path)) {
        //file exists
        return 'exists';
      } else {
        return false;
      }
    } catch(err) {
      console.error(err)
      return false;
    }

    // TODO: CHECK CONTENTS OF CSV ROWS TO VALIDATE FORMAT
}


// create FAQ test
async function test_create_faq() {
    const create = require('../createFAQ.js');
    var content = require('./qna_export.json');
    var parseJSONparams = {
        csv_name:'qna_FAQ.csv',
        content:content,
        output_path:'/tmp/qna_FAQ.csv',
    }
    var createFAQparams = {
        faq_name:'qna-facts',
        faq_index_id:'e1c23860-e5c8-4409-ae26-b05bd6ced00a',
        csv_path:parseJSONparams.output_path,
        csv_name:parseJSONparams.csv_name,
        s3_bucket:'qna-dev-dev-dev-master-2-exportbucket-nwlyflasajwe',
        s3_key:"kendra_csv" + "/" + parseJSONparams.csv_name,
        kendra_s3_access_role:'arn:aws:iam::425742325899:role/QNA-dev-dev-dev-master-2-ExportStac-KendraSyncRole-1G3IEI1JF7L3S',
        region:'us-east-1'
    }
    return create.handler(createFAQparams);
}

//performSync test
async function test_performSync() {
    const kendraSync = require('../kendraSync.js');
    const event = require('./syncEvent.json');
    var context = undefined;
    var cb = undefined;
    process.env.OUTPUT_S3_BUCKET = 'qna-dev-dev-dev-master-3-exportbucket-1nvhu6nwzea5j'
    process.env.KENDRA_INDEX = 'e1c23860-e5c8-4409-ae26-b05bd6ced00a';
    process.env.KENDRA_ROLE = 'arn:aws:iam::425742325899:role/QNA-dev-dev-dev-master-3-ExportStac-KendraSyncRole-1RN4NKGMDFRNH'
    return kendraSync.performSync(event, context, cb);
}

describe('#test automate-sync()', () => {
    // it('test_json_parser', async function() {
    //     let resp = await test_parser();
    //     assert(resp, "CSV file does not exist!");
    // });
    
    // it('test_create_faq', async function() {
    //     let resp = await test_create_faq();
    //     assert(resp, 'Failed to create FAQ');
    // });

    it('test_perform_sync', async function() {
        let resp = await test_performSync();
        assert(resp, 'Synced'); 
    });
});

