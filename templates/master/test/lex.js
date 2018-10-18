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
                        botAlias: output.BotAlias,
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
                    type:"qna",
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
                    type:"qna",
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
                    type:"qna",
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
                        type:"qna",
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
                        type:"qna",
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
        var id2 = "unit-test.2"
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
                    type:"qna",
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
            .then(() => api({
                path: "questions/" + id2,
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
                        a: "Unable to go to the next room...",
                        l: "QNA:ExamplePYTHONLambdaNext"
                    }
                })
            await  api({
                    path: "questions/navigation.2",
                    method: "PUT",
                    body: {
                        qid: "navigation.2",
                        type: "qna",
                        q: ["previous"],
                        a: "Unable to go to the previous room...",
                        l: "QNA:ExamplePYTHONLambdaPrevious"
                    }
                })
            var sessionAttributes = {}
            var response = await this.lex.postText({
                sessionAttributes: sessionAttributes,
                inputText: "next"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Unable to go to the next room...")
            
            response = await this.lex.postText({
                sessionAttributes: sessionAttributes,
                inputText: "previous"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Unable to go to the previous room...")
            
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
                            l: "QNA:ExamplePYTHONLambdaNext"
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
                            l: "QNA:ExamplePYTHONLambdaPrevious"
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
                            next: "navigation.4"
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
                        next: "navigation.5"
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
                        next: "navigation.6"
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
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "One"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "One")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "Two"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Two")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "next"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Three")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "previous"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Two")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "Two"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Two")
            
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
    },
    navigation3: async function(test) {
        try {
            var args = await outputs('dev/master')
            var lambda = new aws.Lambda({
                region: config.region
            })
            var func = await outputs('dev/lambda').tap(function(output) {
                    return lambda.updateFunctionCode({
                        FunctionName: output.lambda,
                        Publish: true,
                        ZipFile: fs.readFileSync(__dirname + '/hook.zip')
                    })
                })

                await api({
                        path: "questions/navigationlambda.1",
                        method: "PUT",
                        body: {
                            qid: "navigationlambda.1",
                            type: "qna",
                            q: ["Next"],
                            a: "no next room",
                            l: "QNA:ExamplePYTHONLambdaNext"
                        }
                    })
                await  api({
                        path: "questions/navigationlambda.2",
                        method: "PUT",
                        body: {
                            qid: "navigationlambda.2",
                            type: "qna",
                            q: ["Previous"],
                            a: "no previous room",
                            l: "QNA:ExamplePYTHONLambdaPrevious"
                        }
                    })
              await api({
                        path: "questions/navigationlambda.3",
                        method: "PUT",
                        body: {
                            qid: "navigationlambda.3",
                            type: "qna",
                            q: ["One"],
                            a: "One",
                            next: "navigationlambda.4"
                        }
                    })
              await api({
                    path: "questions/navigationlambda.4",
                    method: "PUT",
                    body: {
                        qid: "navigationlambda.4",
                        type: "qna",
                        q: ["Two"],
                        a: "Two",
                        l: func.lambda,
                        next: "navigationlambda.5"
                    }
                })
                await api({
                    path: "questions/navigationlambda.5",
                    method: "PUT",
                    body: {
                        qid: "navigationlambda.5",
                        type: "qna",
                        q: ["Three"],
                        a: "Three",
                        next: "navigationlambda.6"
                    }
                })
                await api({
                    path: "questions/navigationlambda.6",
                    method: "PUT",
                    body: {
                        qid: "navigationlambda.6",
                        type: "qna",
                        q: ["End"],
                        a: "End",
                    }
                })
            var sessionAttributes = {}
            var response
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "One"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "One")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "next"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "hook")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "next"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "Three")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "previous"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "hook")
            
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
                    path: "questions/navigationlambda.1",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigationlambda.2",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigationlambda.3",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigationlambda.4",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigationlambda.5",
                    method: "DELETE"
                })
            await api({
                    path: "questions/navigationlambda.6",
                    method: "DELETE"
                })
            test.done()
        }
    },
    //feedback tests
    feedback1: async function(test) {
        try {
            var args = await outputs('dev/master')
            var defaultResp = "unable to leave feedback"
                await api({
                        path: "questions/feedback.1",
                        method: "PUT",
                        body: {
                            qid: "feedback.1",
                            type: "qna",
                            q: ["feedback"],
                            a: defaultResp,
                            l: "QNA:ExamplePYTHONLambdaFeedback"
                        }
                    })
                await  api({
                        path: "questions/feedback.2",
                        method: "PUT",
                        body: {
                            qid: "feedback.2",
                            type: "qna",
                            q: ["One"],
                            a: "One"
                        }
                    })
              
            var sessionAttributes = {}
            var response
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "feedback"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "There is no question to leave feedback on, please ask a question before attempting to leave feedback")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "One"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.equal(response.message, "One")
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "feedback"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.ok(response.message.includes("\"One\""))
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "goodbye"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.ok(response.message.includes("\"One\""))
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "a"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.ok(response.message.includes("Thank you for leaving the feedback"))
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "feedback"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.ok(response.message.includes("\"One\""))
            
            response = await this.lex.postText({
                sessionAttributes:sessionAttributes,
                inputText: "C"
            }).promise()
            console.log(response)
            sessionAttributes = response.sessionAttributes
            test.ok(response.message.includes("Canceled Feedback"))
            
        }
        catch (e) {
            test.ifError(e)
        }
        finally {
            await api({
                    path: "questions/feedback.1",
                    method: "DELETE"
                })
            await api({
                    path: "questions/feedback.2",
                    method: "DELETE"
                })

            test.done()
        }
    }

}
