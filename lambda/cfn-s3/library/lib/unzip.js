/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var cfnLambda=require('cfn-lambda')
var Promise=require('bluebird')
var aws=require('./aws')
var s3=new aws.S3()
var mime = require('mime-types')

var JSZip=require('jszip')
JSZip.external.Promise = Promise;
var jszip=new JSZip()

module.exports=class unzip {
    Create(params,reply){
        s3.getObject({
            Bucket:params.SrcBucket,
            Key:params.SrcKey
        }).promise()
        .tap(console.log)
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
        })
        .tap(console.log)
        .map(function(file){
            var type=mime.lookup(file)
            console.log(file+':'+type)
            
            return jszip.file(file).async('nodebuffer')
            .then(function(content){
                var param={
                    Bucket:params.DstBucket,
                    Key:params.DstPrefix+file,
                    Body:content,
                    ContentType:type ? type : null
                }
                console.log(param)
                return s3.putObject(param).promise()
            })
        })
        .map(console.log)
        .then(()=>reply(null,params.SrcBucket+'/'+params.SrcKey) )
        .error(err=>reply(err,params.SrcBucket+'/'+params.SrcKey) )
        .tapCatch(err=>reply(err,params.SrcBucket+'/'+params.SrcKey) )
    }

    Update(ID,params,oldparams,reply){
        reply(null,ID) 
    }
    
    Delete(ID,params,reply){
        reply(null,ID) 
    }
}

