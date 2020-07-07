var aws=require('./util/aws')
var Promise=require('bluebird')
var s3=new aws.S3()


async function waitForExport(s3params, timeout){
    console.log("Checking the status of export")
    var now = Date.now();
    var stoptime = now + timeout ;
    var complete = false;
    var timedout = false ;
    var body;
    do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        var res = await s3.getObject(s3params).promise() ;
        body = JSON.parse(res.Body.toString()); 
        console.log(body.status);
        complete = (body.status == "Completed") ? true : false ;
        timedout = (Date.now() > stoptime) ? true : false ;
    } while( !complete && !timedout );
    if (!complete && timedout ) {
        console.log("Timed out.");
    }
    return complete;
}


async function run_export(params,reply) {
    const ID="kendraSyncExport";
    var data={
        "bucket":params.bucket,
        "index":params.index,
        "faq_index_id":params.faq_index_id,
        "id":params.id,
        "config":"kendra-status/"+params.id,
        "tmp":"kendra-tmp/"+params.id,
        "key":"kendra-data/"+params.id,
        "filter":"",
        "status":"Started"
    };
    var s3params = {
        Bucket: data.bucket,
        Key: data.config,
        Body: JSON.stringify(data), 
    };
    const statusfile=data.bucket+'/'+data.config ;
    console.log("Running content export to sync to Kendra FAQ.");
    
    // TODO: what happens if bucket is not yet created?
    // Create object in export bucket to trigger export lambda
    var res = await s3.putObject(s3params).promise()
    console.log("Wait up to 60 seconds for status to be completed");
    delete s3params.Body;
    var complete = await waitForExport(s3params,60000);
    if (complete) {
        console.log("Export completed: ",statusfile);
        reply(null,ID) ;
    } else {
        console.log("Export did NOT complete: ",statusfile);
        reply(null,ID) ;
    }
}

module.exports=class KendraSyncExport {
    constructor(){
    }
    
    // converts JSON to CSV to Kendra FAQ
    Convert(params) {
        const statusfile = params.bucket+"/kendra-status/"+params.id;
        
        console.log("Beginning parsing of JSON into CSV", statusfile);
        params.input_path = params.bucket+'/'+params.key;   // s3 bucket location...TODO: read from s3 bucket
        params.csv_name = 'qna_FAQ.csv';
        params.output = './test/' + params.csv_name;        // TODO: put into the s3 bucket!
        require('../parseJSON.js').handler(params);
        console.log("Completed parsing of JSON into CSV", statusfile);
        
        
        console.log("Beginning conversion of CSV into Kendra FAQ", statusfile);
        params.faq_name = 'qna-facts';
        params.faq_index_id = 'e1c23860-e5c8-4409-ae26-b05bd6ced00a';
        params.csv_path = params.output;
        params.s3_bucket = 'explore-kendra-solar';
        params.kendra_s3_access_role = 'arn:aws:iam::425742325899:role/service-role/AmazonKendra-question-bucketer';
        params.region = 'us-east-1';
        require('../createFAQ.js').handler(params);
        console.log("Completed", statusfile);
    }

    Export(params,reply){
        run_export(params,reply)
        const statusfile = params.bucket+"/kendra-status/"+params.id;
        console.log("JSON export completed, now parsing into CSV", statusfile);
        // the lambda will have to find the status file and add trigger to CloudFormation
            // if I know the ID it is at the ending part of this key, tack on kendra-status
            // will know the bucket/key for the source JSON file
        
        // TODO: this should trigger parseJSON
        this.Convert(params);
    
        // TODO: confirm that the UI is polling the status file for completion
            // important to write the status file at the end of all the phases signaling completion
            // challenge: finding status file and updating status... given that we will pass the job file
    
    }
    
    
};

