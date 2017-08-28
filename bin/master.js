#! /usr/bin/env node
/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var fs=Promise.promisifyAll(require('fs'))
var path=require('path')

var base=require('../templates/master-base.json')
var config=require('../config')

base.Parameters.BootstrapBucket.Default=config.publicBucket
base.Parameters.BootstrapPrefix.Default=config.publicPrefix
base.Resources.var.Properties.ErrorMessage=config.Lex.ErrorMessage
base.Resources.var.Properties.EmptyMessage=config.Lex.EmptyMessage
base.Resources.api.Properties.Parameters.Utterances['Fn::Join'][1].push(
    config.Lex.SlotUterances.join('\n')
)
return fs.writeFileAsync(
            path.join(__dirname,'../templates/master.json'),
            JSON.stringify(base,null,1)).return(base)
    .then(function(template){
        delete template.Outputs.AdminBucket
        delete template.Outputs.BotName
        delete template.Outputs.HandlerArn
        delete template.Outputs.HealthArn
        delete template.Outputs.FulfilmentArn
        delete template.Outputs.ApiURL
        delete template.Parameters.BootstrapBucket
        delete template.Parameters.BootstrapPrefix
        var out=JSON.stringify(template).replace(
            /{"Ref":"BootstrapBucket"}/g,
            '"'+config.publicBucket+'"')
        out=out.replace(
            /{"Ref":"BootstrapPrefix"}/g,
            '"'+config.publicPrefix+'"')
        return fs.writeFileAsync(
                    path.join(__dirname,'../templates/master-public.json'),
                    JSON.stringify(JSON.parse(out),null,1)).return(JSON.parse(out))
    })
        
