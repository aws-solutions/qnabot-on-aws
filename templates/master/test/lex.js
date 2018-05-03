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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
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
    ask: async function(test) {
        try {
            await api({
                path: "questions/test.1",
                method: "PUT",
                body: {
                    qid: "test.1",
                    q: ["hello"],
                    a: "i am the unit"
                }
            })
            var response = await this.lex.postText({
                inputText: "hello"
            }).promise()
            console.log(response)
            test.ok(response.sessionAttributes.previous)
        }
        catch (e) {
            test.ifError(e)
            console.log(e)
        }
        finally {
            await api({
                path: "questions/test.1",
                method: "DELETE"
            })
            test.done()
        }
    },
    miss: function(test) {
        this.lex.postText({
                inputText: "zzzzzzzzzzzzzzzzzzz"
            }).promise()
            .tap(x => test.equal(x.dialogState, "ElicitIntent"))
            .then(console.log)
            .finally(test.done)
    },
    empty: function(test) {
        this.lex.postText({
                inputText: "help"
            }).promise()
            .tap(x => test.equal(x.dialogState, "Fulfilled"))
            .then(console.log)
            .finally(test.done)
    },
    card: function(test) {
        var self = this
        var id = "unit-test.1"
        var id2 = "unit-test.2"
        api({
                path: "questions/" + id,
                method: "PUT",
                body: {
                    qid: id,
                    q: ["who am i"],
                    a: "i am the unit",
                    r: {
                        title: "test",
                        imageUrl: "https://dummyimage.com/600x400/000/fff.png&text=hello"
                    }
                }
            })
            .then(() => api({
                path: "questions/" + id2,
                method: "PUT",
                body: {
                    qid: id2,
                    q: ["who are you"],
                    a: "you are the test"
                }
            }))
            .then(() => self.lex.postText({
                inputText: "who am i"
            }).promise())
            .tap(x => test.ok(x.responseCard))
            .then(console.log)
            .then(() => self.lex.postText({
                inputText: "who are you"
            }).promise())
            .tap(x => test.ok(!x.responseCard))
            .then(console.log)
            .then(() => api({
                path: "questions/unit-test.1",
                method: "DELETE"
            }))
            .then(() => api({
                path: "questions/unit-test.2",
                method: "DELETE"
            }))
            .catch(test.ifError)
            .finally(() => test.done())
    },
    topic: function(test) {
        var self = this
        var id1 = "unit-test.1"
        var id2 = "unit-test.2"
        return Promise.join(
                api({
                    path: `questions/${id1}`,
                    method: "PUT",
                    body: {
                        qid: id1,
                        q: ["what do zombies eat", "what do they eat"],
                        a: "zombies eat brains",
                        t: "zombies"
                    }
                }),
                api({
                    path: `questions/${id2}`,
                    method: "PUT",
                    body: {
                        qid: id2,
                        q: ["what do humans eat", "what do they eat"],
                        a: "humans eat food",
                        t: "humans"
                    }
                })
            )
            .then(() => self.lex.postText({
                inputText: "what do zombies eat",
                sessionAttributes: {}
            }).promise().tap(console.log))
            .then(res => test.equal(res.sessionAttributes.topic, "zombies"))
            .then(() => self.lex.postText({
                inputText: "what do they eat",
                sessionAttributes: {
                    topic: "zombies"
                }
            }).promise().tap(console.log))
            .then(res => test.equal(res.sessionAttributes.topic, "zombies"))
            .then(() => self.lex.postText({
                inputText: "what do humans eat",
                sessionAttributes: {}
            }).promise().tap(console.log))
            .then(res => test.equal(res.sessionAttributes.topic, "humans"))
            .finally(() => test.done())
    },
    hook: function(test) {
        var self = this
        var id1 = 'unit-test.1'
        var lambda = new aws.Lambda({
            region: config.region
        })
        var func = outputs('dev/lambda').tap(function(output) {
                return lambda.updateFunctionCode({
                    FunctionName: output.lambda,
                    Publish: true,
                    ZipFile: fs.readFileSync(__dirname + '/hook.zip')
                }).promise()
            })
            .then(output => api({
                path: `questions/${id1}`,
                method: "PUT",
                body: {
                    qid: id1,
                    q: ["what do zombies eat", "what do they eat"],
                    a: "zombies eat brains",
                    l: output.lambda
                }
            }))
            .then(() => self.lex.postText({
                inputText: "what do zombies eat",
                sessionAttributes: {}
            }).promise().tap(console.log))
            .then(res => test.equal(res.message, "hook"))
            .then(() => api({
                path: "questions/" + id1,
                method: "DELETE"
            }))
            .finally(() => test.done())
    },
    // Guided Navigation tests
    navigation1: async function(test) {
        try {
            var args = await outputs('dev/master')
            
            await api({
                    path: "questions/navigation.1",
                    method: "PUT",
                    body: {
                        qid: "navigation.1",
                        type: "qna",
                        q: ["next"],
                        a: "no next room",
                        l: args.NextLambda
                    }
                })
            await  api({
                    path: "questions/navigation.2",
                    method: "PUT",
                    body: {
                        qid: "navigation.2",
                        type: "qna",
                        q: ["previous"],
                        a: "no previous room",
                        l: args.PreviousLambda
                    }
                })
            var sessionAttributes = {}
            var response = await this.lex.postText({
                sessionAttributes: sessionAttributes,
                inputText: "next"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "no next room")
            response = await this.lex.postText({
                sessionAttributes: sessionAttributes,
                inputText: "previous"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "no previous room")
        }
        catch (e) {
            test.ifError(e)
        }
        finally {
            await api({
                    path: "questions/navigation.1",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigation.2",
                    method: "DELETE"
                })
            test.done()
        }
    },
    navigation2: async function(test) {
        try {
            var args = await outputs('dev/master')

                await api({
                        path: "questions/navigation.7",
                        method: "PUT",
                        body: {
                            qid: "navigation.7",
                            type: "qna",
                            q: ["Next"],
                            a: "no next room",
                            l: args.NextLambda
                        }
                    })
                await  api({
                        path: "questions/navigation.8",
                        method: "PUT",
                        body: {
                            qid: "navigation.8",
                            type: "qna",
                            q: ["Previous"],
                            a: "no previous room",
                            l: args.PreviousLambda
                        }
                    })
               await api({
                        path: "questions/navigation.3",
                        method: "PUT",
                        body: {
                            qid: "navigation.3",
                            type: "qna",
                            q: ["One"],
                            a: "One",
                            next: "questions/navigation.4"
                        }
                    })
                
               await api({
                    path: "questions/navigation.4",
                    method: "PUT",
                    body: {
                        qid: "navigation.4",
                        type: "qna",
                        q: ["Two"],
                        a: "Two",
                        next: "questions/navigation.5"
                    }
                })
                await api({
                    path: "questions/navigation.5",
                    method: "PUT",
                    body: {
                        qid: "navigation.5",
                        type: "qna",
                        q: ["Three"],
                        a: "Three",
                        next: "questions/navigation.6"
                    }
                })
                await api({
                    path: "questions/navigation.6",
                    method: "PUT",
                    body: {
                        qid: "navigation.6",
                        type: "qna",
                        q: ["End"],
                        a: "End",
                    }
                })
            var sessionAttributes = {}
            var response
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "One"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "One")
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "Two"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Two")
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "next"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Three")
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "previous"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Two")
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "End"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "End")
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "next"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Three")
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "previous"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Two")
            await sleep(100)
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "previous"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "One")
        }
        catch (e) {
            test.ifError(e)
        }
        finally {
            await api({
                    path: "questions/navigation.7",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigation.8",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigation.3",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigation.4",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigation.5",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigation.6",
                    method: "DELETE"
                })
            test.done()
        }
    }
    // // TriviaRefactored tests
    // ask: async function(test) {
    //     try {
    //         var args = await outputs('dev/master')
    //         await
    //         api({
    //                 path: "questions/quizbot.1",
    //                 method: "PUT",
    //                 body: {
    //                     "qid": "EnterSampleQuiz",
    //                     "a": "Starting the sample quiz.  Good luck!",
    //                     "r": {},
    //                     "l": args.TriviaRefactoredLambda,
    //                     "args": [
    //                         "sampleQuiz.1"
    //                     ],
    //                     "type": "qna",
    //                     "q": [
    //                         "I want to take the sample quiz.",
    //                         "Take the sample quiz.",
    //                         "Take the White House quiz."
    //                     ]
    //                 }
    //             }),
    //             api({
    //                 path: "questions/quizbot.2",
    //                 method: "PUT",
    //                 body: {
    //                     "qid": "sampleQuiz.1",
    //                     "question": "What has been exhibited in the China Room since 1917?",
    //                     "correctAnswers": [
    //                         "Ceramics, glass, and silver."
    //                     ],
    //                     "incorrectAnswers": [
    //                         "Artifacts from the War of 1812.",
    //                         "Furniture used during the Lincoln administration.",
    //                         "Engraved frames."
    //                     ],
    //                     "next": [
    //                         "sampleQuiz.2"
    //                     ],
    //                     "r": {
    //                         "title": "China Room",
    //                         "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/b/b2/WHchinaRoom.jpg",
    //                         "text": "",
    //                         "url": ""
    //                     },
    //                     "quiz": "sampleQuiz",
    //                     "type": "quiz",
    //                     "q": [],
    //                     "t": ""
    //                 }
    //             }),
    //             api({
    //                 path: "questions/quizbot.3",
    //                 method: "PUT",
    //                 body: {
    //                     "qid": "sampleQuiz.2",
    //                     "question": "Who designated a specific room to be the White House library?",
    //                     "incorrectAnswers": [
    //                         "Millard Fillmore.",
    //                         "James Madison.",
    //                         "James K. Polk"
    //                     ],
    //                     "correctAnswers": [
    //                         "Franklin D. Roosevelt"
    //                     ],
    //                     "next": [
    //                         "sampleQuiz.3"
    //                     ],
    //                     "quiz": "sampleQuiz",
    //                     "type": "quiz"
    //                 }
    //             }),
    //             api({
    //                 path: "questions/quizbot.4",
    //                 method: "PUT",
    //                 body: {
    //                     "qid": "sampleQuiz.3",
    //                     "question": "Who bequeathed the Vermeil Room's silver to the White House?",
    //                     "correctAnswers": [
    //                         "Margaret Thompson Biddle."
    //                     ],
    //                     "incorrectAnswers": [
    //                         "Queen Elizabeth II.",
    //                         "Benjamin Franklin.",
    //                         "James K. Polk."
    //                     ],
    //                     "next": [],
    //                     "r": {
    //                         "title": "",
    //                         "imageUrl": "",
    //                         "text": "",
    //                         "url": ""
    //                     },
    //                     "quiz": "sampleQuiz",
    //                     "type": "quiz",
    //                     "q": [],
    //                     "t": ""
    //                 }
    //             });
    //         var response = await this.lex.postText({
    //             inputText: "Take the White House quiz."
    //         }).promise();
    //         console.log(response);
    //         // we need to implement some extra logic here to handle the random ordering of possible answers
    //         // note that i'm hard-coding info from the test documents above here, not pulling dynamically
    //         // if you change the documents then you will also need to change the tests

    //         // this regex split is meant to split at the start of each of the answers without discarding the answer letters
    //         // e.g. it will match " A." but will only discard the leading space
    //         var splitArray = response.message.split(/ (?=[A-Z]\.)/);

    //         test.equal(splitArray[0], "Starting the sample quiz. Good luck! What has been exhibited in the China Room since 1917?");

    //         // be sure to remember which of these is/are correct answers.  you need it for the next test.
    //         var expectedAnswerArray = [
    //             "Ceramics, glass, and silver.",
    //             "Artifacts from the War of 1812.",
    //             "Furniture used during the Lincoln administration.",
    //             "Engraved frames."
    //         ];
            
    //         var matchIndex;
    //         for (var i = 1; i < splitArray.length; i++) {
    //             // substring(3) because the first three characters will be e.g. "B. " and we can't know which letters will go with which answer options
    //             matchIndex = expectedAnswerArray.indexOf(splitArray[i].substring(3));
    //             if (matchIndex === -1) {
    //                 // we didn't find the actual reponse in the expected answer array, so that's a paddlin
    //                 test.fail('Did not find following string in expected answers: ' + splitArray[i].substring(3));
    //                 break;
    //             }
    //         }

    //     }
    //     catch (e) {
    //         test.ifError(e)
    //     }
    //     finally {
    //         await api({
    //                 path: "questions/quizbot.1",
    //                 method: "DELETE"
    //             }),
    //             api({
    //                 path: "questions/quizbot.2",
    //                 method: "DELETE"
    //             }),
    //             api({
    //                 path: "questions/quizbot.3",
    //                 method: "DELETE"
    //             }),
    //             api({
    //                 path: "questions/quizbot.4",
    //                 method: "DELETE"
    //             }),
    //             test.done()
    //     }
    // }

}
