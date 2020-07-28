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
    const ID="PreUpgradeExport";
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
    var s3params = {
        Bucket: data.bucket, 
        Key: data.config,
        Body: JSON.stringify(data), 
    };
    const statusfile=data.bucket+'/'+data.config ;
    console.log("Running content export as backup before upgrade.");
    // Create object in export bucket to trigger export lambda
    var res = await s3.putObject(s3params).promise()
    console.log("Wait up to 60 seconds for status to be completed");
    delete s3params.Body;
    var complete = await waitForExport(s3params,60000);
    if (complete) {
        console.log("Export completed: ",statusfile);
        reply(null,ID) ;
    } else {
        console.log("Export did NOT complete - possibly this is a new install - delete status file so it doesn't show up in Exports list in console: ",statusfile);
        await s3.deleteObject(s3params).promise();
        reply(null,ID) ;
    }
}

module.exports=class PreUpgradeExport extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        run_export(params,reply)
    }
    Update(ID,params,oldparams,reply){
        run_export(params,reply);
    }
};

