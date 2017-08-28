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

var watch=require('chokidar').watch
var Promise=require('bluebird')
var express = require('express')
var morgan=require('morgan')
var path=require('path')
var exports=require('../../bin/exports')
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer();
var faker=require('faker')

var cat=faker.lorem.word()
var create=function(id){
    return { 
        score:[faker.random.number(10),faker.random.number(100)].join('.'),
        body: { 
            qid:[cat,id].join('.'), 
            q: [faker.lorem.sentence()+"?"], 
            a: faker.lorem.sentences(8),
            r: {
                title: [cat,id].join('.'),
                imageUrl:faker.image.imageUrl()
            }
        } 
    }
}

var db=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].map(create)
module.exports=function(app){
    app.use(morgan(':method :url :status'))
    app.use(bodyParser.json()); 
    app.use(bodyParser.urlencoded({ extended: true }));    
    
    var respond=function(res,message){
        console.log(message)
        setTimeout(()=>res.send(JSON.stringify(message)),1000)
    }
    
    app.get('/api', function (req, res) {
        if(req.query.from==="all"){
            respond(res,{qa:db,total:db.length})
        }else if(req.query.from<(Math.ceil(db.length/10))){
            if(req.query.filter){
                if(req.query.filter==='empty'){
                    respond(res,{qa:[],total:0})
                }else{
                    respond(res,{qa:db.slice(0,2),total:3})
                }
            }else{
                var perpage=req.query.perpage
                var from=parseInt(req.query.from)
                respond(res,{
                    qa:db.slice(from*perpage,(from+1)*perpage)
                    ,total:db.length})
            }
        }else{
            respond(res,{qa:[],total:db.length})
        }
    })
    app.put('/api', upload.array(),function (req, res) {
        console.log(req.body)
        respond(res,{ id: 'test2', version: 15, created: true })
    })
    app.post('/api', function (req, res) {
        console.log(req.body)
        respond(res,true)
    })
    app.post('/api/bot', function (req, res) {
        console.log(req.body)
        respond(res,true)
    })
    app.get('/api/bot/status', function (req, res) {
        console.log(req.body)
        respond(res,"READY")
    })
    app.get('/api/search', function (req, res) {
        console.log(req.query)
        respond(res,{qa:db.slice(0,3),total:4})
    })
    app.get('/api/health', function (req, res) {
        respond(res,true)
    })
    app.get('/api/info', function (req, res) {
        exports()
        .then(function(exp){
            return {
                region:'us-east-1',
                BotName:exp["QNA-DEV-HANDLER-BOT"],
                BotAlias:exp["QNA-DEV-HANDLER-ALIAS"],
                PoolId:exp["QNA-DEV-HANDLER-IDPOOL"],
                ClientId:exp["QNA-DEV-HANDLER-CLIENT"],
                UserPool:exp["QNA-DEV-HANDLER-USERPOOL"],
                ApiUrl:"http://localhost:8000/api",
                Id:"QnA-bot-Id"
            }
        })
        .then(msg=>respond(res,msg))
    })
    app.get('/api/client', function (req, res) {
        exports()
        .then(function(exp){
            return {
              "iframeOrigin": "",
              "aws": {
                "cognitoPoolId": exp["QNA-DEV-HANDLER-IDPOOL"],
                "region": "us-east-1"
              },
              "iframeConfig": {
                "lex": {
                  "sessionAttributes": {},
                  "botName":exp["QNA-DEV-HANDLER-BOT"],
                  "pageTitle": "QnA Bot",
                  "toolbarTitle": "QnA Bot"
                },
                "recorder": {
                  "preset": "speech_recognition"
                }
              }
            }
        })
        .then(msg=>respond(res,msg))
    })
    app.get('/api/bot', function (req, res) {
        respond(res,{
            utterances:["ut1","ut2"],
            botname:"botname",
            lambdaArn:"arn:aws:lambda:us-east-1:613341023709:function:QNA-master-35-master-1E5674BX5SKUG-Handler-lambda-1DHH1QYYVZWJ5"
        })
    })
    
    app.head('/api/heartattack.1', function (req, res) {
        console.log(req.body)
        respond(res,false)
    })
    app.head('/api/:id', function (req, res) {
        console.log(req.body)
        res.status(404)
        respond(res,true)
    })

    app.put('/api/:id', function (req, res) {
        console.log(req.body)
        respond(res,{ id: 'test', version: 16, created: false })
    })

    app.put('/api/:id', function (req, res) {
        console.log(req.body)
        respond(res,{ id: 'test', version: 16, created: false })
    })
    app.delete('/api/:id', function (req, res) {
        respond(res,"success")
    })
}
if(!module.parent){
    var app = express()
    module.exports(app)
    app.use('/',express.static(require('path').join(__dirname,'../build')))
    app.listen(8000, function () {
        console.log('Mock App listening on port 8000!')
    })
}

