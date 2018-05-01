var config = require('../../../config')
process.env.AWS_PROFILE = config.profile
process.env.AWS_DEFAULT_REGION = config.region
var query = require('query-string').stringify
var _ = require('lodash')
var zlib = require('zlib')
var Promise = require('bluebird')
var axios = require('axios')
var Url = require('url')
var sign = require('aws4').sign
var fs = require('fs')
var aws = require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region = config.region
var outputs = require('../../../bin/exports')
var exists = require('./util').exists
var run = require('./util').run
var api = require('./util').api

module.exports = {
    setUp: function(cb) {
        var self = this
        outputs('dev/master').then(function(output) {
                self.lex = new aws.LexRuntime({
                    region: config.region,
                    params: {
                        botAlias: "$LATEST",
                        botName: output.BotName,
                        userId: "test"
                    }
                })
            })
            .then(cb)
    },
    quiz: async function(test) {
         try {
             var args = await outputs('dev/master')
             await api({
                 path: "questions/quizbot.1",
                 method: "PUT",
                 body: {
                     "qid": "EnterSampleQuiz",
                     "a": "Starting the sample quiz.  Good luck!",
                     "r": {},
                     "l": args.QuizLambda,
                     "args": [
                         "sampleQuiz.1"
                     ],
                     "type": "qna",
                     "q": [
                         "I want to take the sample quiz.",
                         "Take the sample quiz.",
                         "Take the White House quiz."
                     ]
                 }
             })
             await api({
                 path: "questions/quizbot.2",
                 method: "PUT",
                 body: {
                     "qid": "sampleQuiz.1",
                     "question": "What has been exhibited in the China Room since 1917?",
                     "correctAnswers": [
                         "Ceramics, glass, and silver."
                     ],
                     "incorrectAnswers": [
                         "Artifacts from the War of 1812.",
                         "Furniture used during the Lincoln administration.",
                         "Engraved frames."
                     ],
                     "next": [
                         "sampleQuiz.2"
                     ],
                     "r": {
                         "title": "China Room",
                         "imageUrl": "https:upload.wikimedia.org/wikipedia/commons/b/b2/WHchinaRoom.jpg",
                         "text": "",
                         "url": ""
                     },
                     "quiz": "sampleQuiz",
                     "type": "quiz",
                     "q": [],
                     "t": ""
                 }
             })
             await api({
                 path: "questions/quizbot.3",
                 method: "PUT",
                 body: {
                     "qid": "sampleQuiz.2",
                     "question": "Who designated a specific room to be the White House library?",
                     "incorrectAnswers": [
                         "Millard Fillmore.",
                         "James Madison.",
                         "James K. Polk"
                     ],
                     "correctAnswers": [
                         "Franklin D. Roosevelt"
                     ],
                     "next": [
                         "sampleQuiz.3"
                     ],
                     "quiz": "sampleQuiz",
                     "type": "quiz"
                 }
             })
             await api({
                 path: "questions/quizbot.4",
                 method: "PUT",
                 body: {
                     "qid": "sampleQuiz.3",
                     "question": "Who bequeathed the Vermeil Room's silver to the White House?",
                     "correctAnswers": [
                         "Margaret Thompson Biddle."
                     ],
                     "incorrectAnswers": [
                         "Queen Elizabeth II.",
                         "Benjamin Franklin.",
                         "James K. Polk."
                     ],
                     "next": [],
                     "r": {
                         "title": "",
                         "imageUrl": "",
                         "text": "",
                         "url": ""
                     },
                     "quiz": "sampleQuiz",
                     "type": "quiz",
                     "q": [],
                     "t": ""
                 }
             });
            await api({
                 path: "questions/quizbot.4",
                 method: "PUT",
                 body: {
                     "qid": "sampleQuiz.3",
                     "question": "Who bequeathed the Vermeil Room's silver to the White House?",
                     "correctAnswers": [
                         "Margaret Thompson Biddle."
                     ],
                     "incorrectAnswers": [
                         "Queen Elizabeth II.",
                         "Benjamin Franklin.",
                         "James K. Polk."
                     ],
                     "next": [],
                     "r": {
                         "title": "",
                         "imageUrl": "",
                         "text": "",
                         "url": ""
                     },
                     "quiz": "sampleQuiz",
                     "type": "quiz",
                     "q": [],
                     "t": ""
                 }
             })
             var response = await this.lex.postText({
                 inputText: "Take the White House quiz."
             }).promise();
             console.log(response);
             var splitArray = response.message.split(/ (?=[A-Z]\.)/);

             test.equal(splitArray[0], "Starting the sample quiz. Good luck! What has been exhibited in the China Room since 1917?");

             var expectedAnswerArray = [
                 "Ceramics, glass, and silver.",
                 "Artifacts from the War of 1812.",
                 "Furniture used during the Lincoln administration.",
                 "Engraved frames."
             ];
            
             var matchIndex;
             for (var i = 1; i < splitArray.length; i++) {
                 if (matchIndex === -1) {
                     test.fail('Did not find following string in expected answers: ' + splitArray[i].substring(3));
                     break;
                 }
             }

         }
         catch (e) {
             test.ifError(e)
         }
         finally {
             await api({
                     path: "questions/quizbot.1",
                     method: "DELETE"
                 }),
                 api({
                     path: "questions/quizbot.2",
                     method: "DELETE"
                 }),
                 api({
                     path: "questions/quizbot.3",
                     method: "DELETE"
                 }),
                 api({
                     path: "questions/quizbot.4",
                     method: "DELETE"
                 }),
                 test.done()
         }
     }

}
