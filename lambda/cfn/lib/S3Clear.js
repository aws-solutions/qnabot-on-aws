var aws=require('./util/aws')
var Promise=require('bluebird')
var s3=new aws.S3()

module.exports=class S3Clear extends require('./base') {
    constructor(){
        super()
    }
    Delete(ID,params,reply){
        new Promise(function(res,rej){
            function next(){
                s3.listObjectVersions({
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
                        .then(()=>next())
                        .catch(rej)
                    }else{
                        res()
                    }
                })
            }
            next()
        })
        .then(()=>reply(null,ID))
        .catch(reply)
    }   
}
