var assert = require('assert');

// json parsing test
async function test_parser() {
    const parseJSON = require('../parseJSON.js');
    const fs = require('fs') 
    let content;
    
    fs.readFile('./qna-kendra-faq.txt', (err, data) => {
        if (err) throw err;
        content = data;
        console.log(`data is ${data.toString()}`);
    })
    // var content = `{"qna":[${qna.toString().replace(/\n/g,',\n')}]}`
    // content = JSON.parse(content);
    
    var parseJSONparams = {
        json_name:'qna_FAQ.json',
        content:content,
        output_path:'./test/qna_FAQ.json',
    }
    const resp = await parseJSON.handler(parseJSONparams);

    try {
      if (fs.existsSync(parseJSONparams.output_path)) {
        return true;
      } else {
        return false;
      }
    } catch(err) {
      console.error(err)
      return false;
    }
    // ALERT: does not check rows of JSON, so must manually validate content and format
}


// create FAQ test
async function test_create_faq() {
    const create = require('../createFAQ.js');
    var content = require('./qna_FAQ.json');
    var parseJSONparams = {
        json_name:'qna_FAQ.json',
        content:content,
        output_path:'./test/qna_FAQ.json',
    }
    var createFAQparams = {
        faq_name:'qna-facts',
        faq_index_id:'e1c23860-e5c8-4409-ae26-b05bd6ced00a',
        json_path:parseJSONparams.output_path,
        json_name:parseJSONparams.csv_name,
        s3_bucket:'qna-dev-dev-dev-master-5-exportbucket-yj1v0yw9u094',
        s3_key:"kendra-data" + "/" + parseJSONparams.json_name,
        kendra_s3_access_role:'arn:aws:iam::111122223333:role/QNA-dev-dev-dev-master-5-ExportStack-KendraS3Role-7966TLAABU2N',
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
    process.env.OUTPUT_S3_BUCKET = 'qna-dev-dev-dev-master-5-exportbucket-yj1v0yw9u094'
    process.env.KENDRA_INDEX = 'e1c23860-e5c8-4409-ae26-b05bd6ced00a';
    process.env.KENDRA_ROLE = 'arn:aws:iam::111122223333:role/QNA-dev-dev-dev-master-5-ExportStack-KendraS3Role-7966TLAABU2N'
    return kendraSync.performSync(event, context, cb);
}

describe('#test automate-sync()', () => {
    // it('test_json_parser', async function() {
    //     let resp = await test_parser();
    //     assert.equal(resp, true);
    // });
    
    it('test_create_faq', async function() {
        let resp = await test_create_faq();
        assert(resp, 'Failed to create FAQ');
    });

    // it('test_perform_sync', async function() {
    //     let resp = await test_performSync();
    //     assert(resp, 'Synced'); 
    // });
});

