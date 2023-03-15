// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const aws=require('./util/aws')
const lambda=new aws.Lambda()

module.exports=class LambdaVersion extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){

        lambda.publishVersion({
            FunctionName: params.FunctionName
        }).promise()
        .tap(console.log)
        .then(result=>reply(null, result.Version, {"Version": result.Version}))
        .catch(reply)
    }

    Update(ID,params,oldparams,reply){
        this.Create(params,reply)
    }
}