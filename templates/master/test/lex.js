/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const config = require('../../../config.json')
process.env.AWS_PROFILE = config.profile
process.env.AWS_DEFAULT_REGION = config.region
const query = require('query-string').stringify
const _ = require('lodash')
const zlib = require('zlib')
const Url = require('url')
const sign = require('aws4').sign
const fs = require('fs')
const aws = require('aws-sdk')
aws.config.region = config.region
const outputs = require('../../../bin/exports')
const exists = require('./util').exists
const run = require('./util').run
const api = require('./util').api


module.exports = {

    setUp: function(cb) {
        const self = this
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
            const response = await this.lex.postText({
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
            .then(x => { 
                test.equal(x.dialogState, "ElicitIntent");
                console.log(x);
            })
            .finally(test.done)
    },
    empty: function(test) {
        this.lex.postText({
                inputText: "help"
            }).promise()
            .then(x => {
                test.equal(x.dialogState, "Fulfilled");
                console.log(x);
            })
            .finally(test.done)
    },
    card: function(test) {
        const self = this
        const id = "unit-test.1"
        const id2 = "unit-test.2"
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
            .then(x => { 
                test.ok(x.responseCard)
                console.log(x)
            })
            .then(() => self.lex.postText({
                inputText: "who are you"
            }).promise())
            .then(x => { 
                test.ok(!x.responseCard)
                console.log(x)
            })
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
        const self = this
        const id1 = "unit-test.1"
        const id2 = "unit-test.2"
        return Promise.all([
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
             ])
            .then(() => {
                const result = self.lex.postText({
                    inputText: "what do zombies eat",
                    sessionAttributes: {}
                }).promise();
                console.log(result);
                return result;
            })
            .then(res => test.equal(res.sessionAttributes.topic, "zombies"))
            .then(() => {
                const result  = self.lex.postText({
                inputText: "what do they eat",
                sessionAttributes: {
                    topic: "zombies"
                }
                }).promise()
                console.log(result);
                return result;
            })
            .then(res => test.equal(res.sessionAttributes.topic, "zombies"))
            .then(() => {
                const result = self.lex.postText({
                    inputText: "what do humans eat",
                    sessionAttributes: {}
                }).promise()
                console.log(result)
                return result;
            })
            .then(res => test.equal(res.sessionAttributes.topic, "humans"))
            .finally(() => test.done())
    },
    hook: function(test) {
        const self = this
        const id1 = 'unit-test.1'
        const id2 = "unit-test.2"
        const lambda = new aws.Lambda({
            region: config.region
        })
        const func = outputs('dev/lambda').then(function(output) {
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
            .then(() => {
                const result = self.lex.postText({
                    inputText: "what do zombies eat",
                    sessionAttributes: {}
                }).promise()
                console.log(result)
            })
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
            const args = await outputs('dev/master')
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
            let sessionAttributes = {}
            let response = await this.lex.postText({
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
            const args = await outputs('dev/master')
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
            let sessionAttributes = {}
            let response
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
            const args = await outputs('dev/master')
            const lambda = new aws.Lambda({
                region: config.region
            })
            const output = await outputs('dev/lambda');
            await lambda.updateFunctionCode({
                FunctionName: output.lambda,
                Publish: true,
                ZipFile: fs.readFileSync(__dirname + '/hook.zip')
            })
            const func = output;
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
            let sessionAttributes = {}
            let response
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
            const args = await outputs('dev/master')
            const defaultResp = "unable to leave feedback"
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

            let sessionAttributes = {}
            let response
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
