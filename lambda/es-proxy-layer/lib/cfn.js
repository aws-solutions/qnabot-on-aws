var Url=require('url')
var Promise=require('bluebird')
var cfnLambda=require('cfn-lambda')
var request=require('./request')
const qnabot = require("qnabot/logging")


async function run_es_query(event) {
    qnabot.log('Received event:', JSON.stringify(event, null, 2));
    var res = await request({
            url:Url.resolve("https://"+event.endpoint,event.path),
            method:event.method,
            headers:event.headers,
            body:event.body 
        });
    qnabot.log("ElasticSearch Response",JSON.stringify(res,null,2));
    return res ;
};


var newname=function(alias){
    var now = new Date();
    // create formatted time
    var yyyy = now.getFullYear();
    var mm = now.getMonth() < 9 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1); // getMonth() is zero-based
    var dd  = now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
    var hh = now.getHours() < 10 ? "0" + now.getHours() : now.getHours();
    var mmm  = now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes();
    var ss  = now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds();
    // make new index name as alias with timestamp
    var name = alias+"_"+yyyy+mm+dd+"_"+hh+mm+ss;   
    return name;
}

exports.Create=async function(params){
    var create = params.create ;
    var res;
    if (create.replaceTokenInBody) {
        // replaceTokenInBody is array of objects like [{f:"find_pattern",r:"replace_pattern"},{...}]
        // used to replace tokenized index names in Kibana Dashboard JSON
        var str=JSON.stringify(create.body);
        create.replaceTokenInBody.forEach(item => str = str.replace(item.f,item.r));
        create.body=JSON.parse(str);
    }
    if (create.index){
        var index_alias=create.index; 
        var index_name=newname(index_alias);
        qnabot.log("Create new index:", index_name);
        create.method="PUT";
        create.path="/"+index_name;
        res = await run_es_query(create);
        qnabot.log(res) ;
        try {
            qnabot.log("Delete existing alias, if exists:", index_alias);
            create.method="DELETE";
            create.path="/*/_alias/"+index_alias;
            create.body="";
            res = await run_es_query(create);
            qnabot.log(res) ;  
        } catch(err) {
            qnabot.log("Delete returned: " + err.response.statusText+" ["+err.response.status+"]") ;
        }         
        qnabot.log("Create alias for new index:", index_alias);
        create.method="PUT";
        create.path="/"+index_name+"/_alias/"+index_alias;
        create.body="";
        res = await run_es_query(create);
        qnabot.log(res) ;
    } else {
        // use request params from CfN
        res = await run_es_query(create);
        qnabot.log(res) ;            
    }
    return{PhysicalResourceId:index_alias, FnGetAttrsDataObj:{index_name:index_name, index_alias:index_alias}};
};

exports.Update=async function(ID,params,oldparams){
    if(params.NoUpdate){
        return{PhysicalResourceId:ID, FnGetAttrsDataObj:{}};
    }else{
        var res;
        var update = params.create ;
        if (update.replaceTokenInBody) {
            // replaceTokenInBody is array of objects like [{f:"find_pattern",r:"replace_pattern"},{...}]
            // used to replace tokenized index names in Kibana Dashboard JSON
            var str=JSON.stringify(update.body);
            update.replaceTokenInBody.forEach(item => str = str.replace(item.f,item.r));
            update.body=JSON.parse(str);
        }
        if (update.index){
            var index_alias=update.index; 
            var index_name=newname(index_alias);
            qnabot.log("Update: create new index:", index_name);
            update.method="PUT";
            update.path="/"+index_name;
            res = await run_es_query(update);
            qnabot.log(res) ;
            try {
                qnabot.log("Update: reindex existing index to new index:", index_alias+" -> "+index_name);
            	var reindex={
            	  "source": {
            	    "index": index_alias
            	  },
            	  "dest": {
            	    "index": index_name
            	  }
            	};
                update.method="POST";
                update.path="/_reindex";
                update.body=reindex;
                res = await run_es_query(update);  
            } catch(err) {
                qnabot.log("Reindex request returned: " + err.response.statusText+" ["+err.response.status+"]") ;
            }
            qnabot.log(res) ;
            try {
                qnabot.log("Delete existing alias, if exists:", index_alias);
                update.method="DELETE";
                update.path="/*/_alias/"+index_alias;
                update.body="";
                res = await run_es_query(update);
                qnabot.log(res) ;  
            } catch(err) {
                qnabot.log("Delete alias returned: " + err.response.statusText+" ["+err.response.status+"]") ;
            }
            try {
                qnabot.log("Delete existing index, if exists from earlier release:", index_alias);
                update.method="DELETE";
                update.path="/"+index_alias;
                update.body="";
                res = await run_es_query(update);
                qnabot.log(res) ; 
            } catch(err) {
                qnabot.log("Delete index returned: " + err.response.statusText+" ["+err.response.status+"]") ;
            }
            qnabot.log("Update alias for new index:", index_alias);
            update.method="PUT";
            update.path="/"+index_name+"/_alias/"+index_alias;
            update.body="";
            res = await run_es_query(update);
            qnabot.log(res) ;
        } else {
            // use request params from CfN
            res = await run_es_query(update);
            qnabot.log(res) ;            
        }
        return{PhysicalResourceId:ID, FnGetAttrsDataObj:{index_name:index_name, index_alias:index_alias}};
    }
};

exports.Delete=async function(ID,params){
    if(params.delete){
        qnabot.log("Delete resource using ES params:", JSON.stringify(params.delete));
        var res = await run_es_query(params.delete);
        qnabot.log(res) ;
        return{PhysicalResourceId:ID, FnGetAttrsDataObj:{}};
    }else{
        return{PhysicalResourceId:ID, FnGetAttrsDataObj:{}};
    }
};


exports.resource=cfnLambda({
    AsyncCreate:exports.Create,
    AsyncUpdate:exports.Update,
    AsyncDelete:exports.Delete
})


