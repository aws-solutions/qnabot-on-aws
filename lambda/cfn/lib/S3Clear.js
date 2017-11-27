var aws=require('./util/aws')
var s3=new aws.S3()

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }
    Delete(ID,params,reply){
        s3.listObjects({
            Bucket:params.Bucket,
            Prefix:params.Prefix
        }).promise()
        .log("Files")
        .get("Contents")
        .then(function(files){
            return files.map(file=>{return {Key:file.Key}  })
        })
        .log("going to delete")
        .then(function(keys){
            if(keys.length>0){ 
                return s3.deleteObjects({
                    Bucket:params.Bucket,
                    Delete:{
                        Objects:keys
                    }
                }).promise()
                .then(()=>reply(null,ID))
                .error(err=>reply(err,ID))
            }else{
                reply(null,ID) 
            }
        })
    }   
}
