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
const lambda = require('./setup.js');
const setupenv = require('./setupenv.js');
const _ = require('lodash');
const qnabot = require('qnabot/logging');

const Ajv = require('ajv');
const ajv = new Ajv();
const lexSchema = ajv.compile(require('./lex/schema'));
const alexaSchema = ajv.compile(require('./alexa/schema'));
process.env.EMPTYMESSAGE = 'empty';

function promisify(func) { 
    return function(params) {
        return new Promise((res, rej) => {
            func(params, (err,data) => {
                if(err) rej(err)
                else res(data)
            })
        })
    }
}

const run = function (params, schema, test) {
    return lambda(params)
        .then((msg) => { 
            qnabot.log(JSON.stringify(msg));
            const v = schema(x);
            test.ok(v, JSON.stringify(schema.errors, null, 2));
            return msg
        })
        .catch(e => {
            qnabot.log(JSON.stringify(e));
            test.ifError(e);
        })
        .finally(test.done);
};
const Router = new require('../lib/router');

module.exports = {
    middleware: {
        setUp: function (done) {
            setupenv().then((msg) => {
                done();
            });
        },
        parse: (test) => {
            const event = require('./lex');
            const middleware = require('../lib/middleware/1_parse.js');
            const req = { _event: event };
            const res = {};
            middleware(req, res).then((msg) => {
                test.equal(typeof res.message, 'string');
                test.done();
            });
        },
        preprocess: (test) => test.done(),
        querySend: (test) => test.done(),
        queryPost: (test) => test.done(),
        hookSend: (test) => test.done(),
        hookPost: (test) => test.done(),
        assemble: (test) => test.done()
    },
    router: {
        setUp: function (done) {
            this.run = function (router, test) {
                return promisify(router.start.bind(router))(_.cloneDeep(require('./lex')))
                    .then(test.ok)
                    .catch(test.ifError);
            };
            done();
        },
        empty: function (test) {
            const router = new Router();
            router.add((res, req) => {
                return { res, req: { out: true } };
            });
            this.run(router, test).finally(test.done);
        },
        handle: function (test) {
            const router = new Router();
            this.run(router, test).finally(test.done);
        }
    },
    lex: function (test) {
        run(require('./lex'), lexSchema, test);
    },
    alexa: {
        start: function (test) {
            run(require('./alexa/start'), alexaSchema, test);
        },
        // TODO: Fix the alexa intent test
        //intent:function(test){
        //    run(require('./alexa/intent'),alexaSchema,test)
        //},
        cancel: function (test) {
            run(require('./alexa/cancel'), alexaSchema, test);
        },
        end: async function (test) {
            const msg = await lambda(require('./alexa/end'));
            test.ok(!msg);
            test.done();
        }
    }
};
