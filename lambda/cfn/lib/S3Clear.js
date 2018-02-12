var aws=require('./util/aws')
var Promise=require('bluebird')
var s3=new aws.S3()

module.exports=class S3Clear extends require('./base') {
    constructor(){
        super()
        this.LongRunning={
            PingInSeconds: 1,
            MaxPings: 1000,
            LambdaApi:new aws.Lambda(),
            Methods:{
                Delete:function(createReponse, ID,params, reply, notDone){
                    del(params)
                    .then(status=> status ? notDone() : reply(null,ID))
                    .catch(reply)
                }
            }
        }
    }
    Delete(ID,params,reply){
        del(params)
        .then(()=>reply(null,ID))
        .catch(reply)
    }   
}

function del(params){
    return s3.listObjectVersions({
        Bucket:params.Bucket,
        Prefix:params.Prefix
    }).promise().tap(console.log)
    .then(x=>x.Versions.concat(x.DeleteMarkers))
    .tap(x=>console.log("Files",x))
    .then(function(files){
        return files.map(file=>{return {
            Key:file.Key,
            VersionId:file.VersionId
        }  })
    })
    .tap(x=>console.log("going to delete",x))
    .then(function(keys){
        if(keys.length>0){ 
            return s3.deleteObjects({
                Bucket:params.Bucket,
                Delete:{
                    Objects:keys
                }
            }).promise()
            .return(true)
        }else{
            return false
        }
    })
}

