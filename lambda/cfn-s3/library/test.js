/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

process.env.REGION='us-east-1'
 
var s3=require('./index.js')
var clear_param=require('./params/clear.json')

var unzip_param={
    "SrcBucket":"aws-bigdata-blog",
    "SrcKey":"artifacts/aws-ai-qna-bot/website.zip",
    "DstBucket":process.env.DSTBUCKET,
    "DstPrefix":"/"
}

var run=function(name,param){
    return function(test){
        var util=new s3[name]()
        util.Create(param,function(err,id){
            console.log(id)
            util.Delete(id,param,test.done)
        })
    }
}

module.exports={
    clear:function(test){
        var aws=require('aws-sdk')
        aws.config.region=process.env.REGION
        var s3=new aws.S3()
        
        clear_param.Bucket=process.env.DSTBUCKET
        
        s3.putObject({
            Bucket:process.env.DSTBUCKET,
            Key:clear_param.prefix+'/clear',
            Body:"hello"
        }).promise()
        .return(test)
        .then(run("clear",clear_param))
    },
    unzip:function(test){
        var aws=require('aws-sdk')
        aws.config.region=process.env.REGION
        var s3=new aws.S3()
        var JSZip = require("jszip");
        var zip=new JSZip()

       
        run("unzip",unzip_param)(test)
    }

}
