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

var base=require('../templates/lex-base.json')
var config=require('../config')


base.Resources.QNASlot.Properties.enumerationValues=config.Lex.SlotUterances.map(ut=>{return {value:ut}})

base.Resources.Bot.Properties.clarificationPrompt.messages[0].content=config.Lex.Clarification
base.Resources.Bot.Properties.abortStatement.messages[0].content=config.Lex.Abort

fs.writeFileAsync(
    path.join(__dirname,'../templates/lex.json'),
    JSON.stringify(base,null,1)
)
