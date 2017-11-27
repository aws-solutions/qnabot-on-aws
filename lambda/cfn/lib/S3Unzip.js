var Promise=require('./util/promise')
var aws=require('./util/aws')
var s3=new aws.S3()
var mime = require('mime-types')

var JSZip=require('jszip')
JSZip.external.Promise = Promise;
var jszip=new JSZip()

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        console.log("params",params)

        getFiles(params)
        .map(function(file){
            var type=mime.lookup(file)
            console.log(file+':'+type)
            
            return jszip.file(file).async('nodebuffer')
            .then(function(content){
                var param={
                    Bucket:params.DstBucket,
                    Key:file,
                    Body:content,
                    ContentType:type ? type : null
                }
                console.log(param)
                return s3.putObject(param).promise()
            })
        })
        .map(console.log)
        .then(()=>reply(null,params.SrcBucket+'/'+params.Key) )
        .catch(err=>reply(err,params.SrcBucket+'/'+params.Key) )
    }

    Update(ID,params,oldparams,reply){
        this.Create(params,reply)
    }

    Delete(ID,params,reply){
        getFiles(params)
        .then(function(files){
            var param={
                Bucket:params.DstBucket,
                Delete:{
                    Objects:files.map(file=>{return{Key:file}})
                }
            }
            return s3.deleteObjects(param).promise()
        })
        .tap(console.log)
        .then(()=>reply(null,ID,null) )
        .catch(err=>reply(err,ID,null) )
    }
}

function getFiles(params){
    var param={
        Bucket:params.SrcBucket,
        Key:params.Key
    }
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


