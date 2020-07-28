var aws=require('./util/aws')
var Promise=require('bluebird')
var s3=new aws.S3()


async function copyData(s3exportparms,s3importparms) {
    console.log("Reading previously exported data");
    try {
        var res = await s3.getObject(s3exportparms).promise() ;
        var data_json=res.Body.toString()
        var count = data_json.length ;
        if (count > 0) {
            console.log("Copy data to import bucket: length: "+count);
            s3importparms.Body=data_json;
            res = await s3.putObject(s3importparms).promise() ;            
        } else {
            console.log("Export file has no data - skipping import");
        }
        return count;
    } catch(err) {
        console.log("No previously exported data:", err);
        return 0;
    }
}

async function waitForImport(s3params, timeout){
    console.log("Checking the status of import job");
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
        complete = (body.status == "Complete") ? true : false ;
        timedout = (Date.now() > stoptime) ? true : false ;
    } while( !complete && !timedout );
    if (!complete && timedout ) {
        console.log("Timed out.");
    }
    return complete;
}


async function run_import(params,reply) {
    const ID="PostUpgradeImport";
    var data={
        "bucket":params.importbucket,
        "index":params.index,
        "id":params.id,
        "config":"status/"+params.id,
        "tmp":"tmp/"+params.id,
        "key":"data/"+params.id,
        "filter":"",
        "status":"Started"
    };
    var s3exportparms = {
        Bucket: params.exportbucket, 
        Key: data.key,
    };
    var s3importparms = {
        Bucket: params.importbucket, 
        Key: data.key,
    };
    const exportfile=params.exportbucket+'/'+data.key ;
    const importfile=params.importbucket+'/'+data.key ;

    console.log("copy export file "+exportfile+" to import bucket "+importfile);
    var count=await copyData(s3exportparms,s3importparms);
    if (count > 0) {
        console.log("Running import process.");
        var s3params = {
            Bucket: params.importbucket, 
            Key: data.config,
        };
        console.log("Wait up to 60 seconds for status to be completed");
        delete s3params.Body;
        var complete = await waitForImport(s3params,60000);
        if (complete) {
            console.log("Import completed: ",exportfile);
            reply(null,ID) ;
        } else {
            console.log("Import did NOT complete: ",exportfile);
            reply(null,ID) ;
        }
    } else {
        console.log("No records to import in: ",exportfile);
        reply(null,ID) ;
    }
}

module.exports=class PostUpgradeImport extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        run_import(params,reply)
    }
    Update(ID,params,oldparams,reply){
        run_import(params,reply);
    }
};

/*
var r = function(){};
var p={
            importbucket:"qna-es74-dev-dev-master-25-importbucket-13y6u750e35oc",
            exportbucket:"qna303-filterprototype-dev-dev-maste-exportbucket-v6qwg9lnkr08",
            id:"blog-samples-final.json",
            index:"qnabot-qna",    
}
run_import(p,r);

*/