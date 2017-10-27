/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var lambda=require('../bin/lambda.js')
var response=require('../lib/response')
var path=require('path')
var api_params=require('./params/api.json')

var run=function(params,test){
    return lambda(params)
        .tap(msg=>console.log(JSON.stringify(msg)))
        .tap(test.ok)
        .error(test.ifError)
        .catch(test.ifError)
        .finally(test.done)
}

var runResponse=function(params, msg, type, test, successmatch, position, successmsgmatch){
  const origType = process.env.TYPE
  process.env.TYPE=type
  try {
    let resp = response.success(msg, params)
    process.env.TYPE = origType
    if (origType) {
      test.equal(process.env.TYPE, origType, 'Could not reset process TYPE parameter, expected ' + origType + ' found ' + process.env.TYPE)
    }
    if (successmatch) {
      test.deepEqual(resp.dialogAction.responseCard.genericAttachments[position], successmatch, 'link not parsed correctly')
    }
    if (successmsgmatch) {
      test.deepEqual(resp.dialogAction.message, successmsgmatch, 'link not parsed correctly')
    }
  } catch (ex) {
    test.ifError()
  } finally {
    test.done()
  }
}

module.exports={
    bot_status:function(test){
        var params={
            Command:"BOT_STATUS"
        }
        run(params,test)
    },
    bot_info:function(test){
        var params={
            Command:"BOT_INFO",
            botname:"bot",
            lambdaArn:"arn"
        }
        run(params,test)
    },
    export:function(test){
        var params={
            Command:"EXPORT"
        }
        run(params,test)
    },
    list:function(test){
        var params={
            Command:"LIST",
            From:0,
            Perpage:2
        }
        run(params,test)
    },
    listFilter:function(test){
        var params={
            Command:"LIST",
            From:0,
            Filter:'te.*',
            Perpage:2
        }
        run(params,test)
    },
    check:function(test){
        var params={
            Command:"CHECK",
            Id:"someting"
        }
        run(params,test)
    },
    lex:function(test){
        var params=require('./params/lex.json') 
        run(params,test)
    },
    alexa:{
        intent:function(test){
            var params=require('./params/alexa-intent.json') 
            run(params,test)
        },
        start:function(test){
            var params=require('./params/alexa-start.json') 
            run(params,test)
        },
        end:function(test){
            var params=require('./params/alexa-end.json') 
            run(params,test)
        }
    },
    search:function(test){
        var params={
            Command:"SEARCH",
            Query:"who"
        }
        run(params,test)
    },
    update:function(test){
        var params={
            Command:"UPDATE",
            Body:{
                q:["add","who","someother"],
                qid:"test",
                a:"yes",
                r:{
                    title:"something",
                    imageUrl:"somethingelse"
                }
            }
        }
        run(params,test)
    },
    add:function(test){
        var params={
            Command:"ADD",
            Body:[{
                q:["add","who","someother"],
                qid:"test",
                a:"yes",
                r:{
                    title:"something",
                    imageUrl:"somethingelse"
                }
            }]
        }
        run(params,test)
    },
    save:function(test){
        var params={
            Command:"SAVE"
        }
        run(params,test)
    },
    rm:function(test){
        var params={
            Command:"DELETE",
            Id:"test"
        }
        run(params,test)
    },
    
    ping:function(test){
        var params={
            Command:"PING"
        }
        run(params,test)
    },

  /* http in markdown */
    linkParsing1:function(test){
        var params={
            Session: {}
        }
        var msg={
            msg: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products. [Find a Course](http://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp) this is a test',
            question: 'how do i find a course',
            r: {
              title: 'Your source for training',
              imageUrl: 'https://s3.amazonaws.com/aha-sprint-artifacts/banner_kit.jpg'
            }
        }
        var matchObj={
          title: 'Find a Course',
          attachmentLinkUrl: 'http://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp'
        }
        var matchMessage={
            contentType: "PlainText",
            content: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.   this is a test'
        }

      runResponse(params, msg, 'LEX', test, matchObj, 1, matchMessage)
    },

  /* https in markdown */
    linkParsing2:function(test){
    var params={
      Session: {}
    }
    var msg={
      msg: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products. [Find a Course](https://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp) this is a test',
      question: 'how do i find a course',
      r: {
        title: 'Your source for training',
        imageUrl: 'https://s3.amazonaws.com/aha-sprint-artifacts/banner_kit.jpg'
      }
    }
    var matchObj={
      title: 'Find a Course',
      attachmentLinkUrl: 'https://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp'
    }
    var matchMessage={
        contentType: "PlainText",
        content: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.   this is a test'
    }
    runResponse(params, msg, 'LEX', test, matchObj, 1, matchMessage)
    },

  /* ftp in markdown */
  linkParsing3:function(test){
    var params={
      Session: {}
    }
    var msg={
      msg: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products. [Find a Course](ftp://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp) this is a test',
      question: 'how do i find a course',
      r: {
        title: 'Your source for training',
        imageUrl: 'https://s3.amazonaws.com/aha-sprint-artifacts/banner_kit.jpg'
      }
    }
    var matchObj={
      title: 'Find a Course',
      attachmentLinkUrl: 'ftp://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp'
    }
    var matchMessage={
      contentType: "PlainText",
      content: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.   this is a test'
    }

    runResponse(params, msg, 'LEX', test, matchObj, 1, matchMessage)
  },

  /* no image reference which changes position of attachmentLinkUrl */
  linkParsing4:function(test){
    var params={
      Session: {}
    }
    var msg={
      msg: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products. [Find a Course](http://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp) this is a test',
      question: 'how do i find a course',
    }
    var matchObj={
      title: 'Find a Course',
      attachmentLinkUrl: 'http://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp'
    }
    var matchMessage={
      contentType: "PlainText",
      content: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.   this is a test'
    }
    runResponse(params, msg, 'LEX', test, matchObj, 0, matchMessage)
  },

  /* not using markdown syntax*/
  linkParsing5:function(test){
    var params={
      Session: {}
    }
    var msg={
      msg: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products. http://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp this is a test',
      question: 'how do i find a course',
    }
    var matchObj={
      title: 'Additional Information',
      attachmentLinkUrl: 'http://cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp'
    }
    var matchMessage={
      contentType: "PlainText",
      content: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.   this is a test'
    }
    runResponse(params, msg, 'LEX', test, matchObj, 0, matchMessage)
  },

  /* no links in message */
  linkParsing6:function(test){
    var params={
      Session: {}
    }
    var msg={
      msg: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.',
      question: 'how do i find a course',
    }
    var matchObj=undefined
    var matchMessage={
      contentType: "PlainText",
      content: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.'
    }
    runResponse(params, msg, 'LEX', test, matchObj, 0, matchMessage)
  },

  /* title and url exceed 80 characters */
  linkParsing7:function(test){
    var params={
      Session: {}
    }
    var msg={
      msg: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products. [012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789](http://7890123456789012345678901234567890123456789012345678901234567890123456789cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp) this is a test',
      question: 'how do i find a course',
    }
    var matchObj={
      title:    '01234567890123456789012345678901234567890123456789012345678901234567890123456789',
      attachmentLinkUrl: 'http://7890123456789012345678901234567890123456789012345678901234567890123456789cpr.heart.org/AHAECC/CPRAndECC/FindACourse/UCM_473162_Find-A-Course.jsp'
    }
    var matchMessage={
      contentType: "PlainText",
      content: 'If the Training Center or Instructor has listed its skill sessions in our system, you will be able to search and reserve that class online. You may also have to call the Training Center or visit the Training Center\'s website to inquire about costs and availability, and to register and pay for the class. This is because AHA Training Centers are independent businesses that have entered into an agreement with the AHA to provide CPR and first aid training using our current curricula and products.   this is a test'
    }
    runResponse(params, msg, 'LEX', test, matchObj, 0, matchMessage)
  },

}


