var Promise=require('./util/promise')
var aws=require('./util/aws')
var s3=new aws.S3()
var mime = require('mime-types')
var _=require('lodash')
var JSZip=require('jszip')
JSZip.external.Promise = Promise;
var jszip=new JSZip()

module.exports=class S3Version extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        s3.headObject({
            Bucket:params.Bucket,
            Key:params.Key
        }).promise()
        .tap(console.log)
        .then(result=>reply(null,_.get(result,'VersionId',"1")))
        .catch(reply)
    }

    Update(ID,params,oldparams,reply){
        this.Create(params,reply)
    }
}

function getFiles(params){
    var param=
    console.log("get param",param)
    return s3.getObject(param).promise()
    .get("Body")
    .then(function(buff){
        return jszip.loadAsync(buff)
        .get('files')
        .then(function(files){
            return Object.keys(files)
                .map(key=>files[key])
                .filter(file=>!file.dir)
                .map(file=>file.name)
        })
        .tap(console.log)
    })
}


