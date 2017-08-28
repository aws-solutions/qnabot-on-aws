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

module.exports=class clear {

    Create(params,reply){
        reply(null,"clear-"+params.Bucket) 
    }

    Update(ID,params,oldparams,reply){
        reply(null,ID) 
    }
    
    Delete(ID,params,reply){
        var Promise=require('bluebird')
        var aws=require('aws-sdk')
        aws.config.setPromisesDependency(Promise);
        var s3=new aws.S3({region:process.env.REGION})

        var sources=s3.listObjects({
            Bucket:params.Bucket,
            Prefix:params.prefix
        }).promise()
        .get("Contents")
        .then(function(files){
            return files.map(file=>{return {Key:file.Key}  })
        })
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

