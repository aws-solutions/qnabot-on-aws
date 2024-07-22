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

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const util = require('./util');

module.exports = async function hook(req, res) {
    // handle list of lambda hooks, from possible qid merge after conditional chaining
    let lambdahooks = _.get(res.result, 'lambdahooks', []);
    // no lambdahooks array (no previous chaining), so initialise array from 'l' and 'args' fields
    if (lambdahooks.length == 0) {
        lambdahooks = [
            {
                l: _.get(res.result, 'l'),
                args: _.get(res.result, 'args', []),
            },
        ];
    }
    _.set(req, '_fulfillment.step', 'lambdahook');

    let event = { req, res };
    let i = 0;
    while (i < lambdahooks.length) {
        if (lambdahooks[i].l) {
            event.res.result.l = lambdahooks[i].l;
            event.res.result.args = lambdahooks[i].args;
            qnabot.log('Lambda Hook ', i, ': ', lambdahooks[i].l, ' => Args: ', lambdahooks[i].args);
            const arn = util.getLambdaArn(lambdahooks[i].l);
            if (arn) {
                try {
                    event = await util.invokeLambda({
                        FunctionName: arn,
                        req: event.req,
                        res: event.res,
                    });
                } catch (e) {
                    qnabot.log(`Error invoking lambda hook: ${arn}`);
                    qnabot.log(JSON.stringify(e));
                }
            }
        }
        i += 1;
    }
    req = event.req;
    res = event.res;

    const posthook = _.get(req, '_settings.LAMBDA_POSTPROCESS_HOOK', undefined);
    _.set(req, '_fulfillment.step', 'postprocess');
    if (posthook) {
        const arn = util.getLambdaArn(posthook);

        try {
            event = await util.invokeLambda({
                FunctionName: arn,
                req,
                res,
            });
        } catch (e) {
            qnabot.log(`Error invoking post-processing lambda: ${arn}`);
            qnabot.log(JSON.stringify(e));
        }
    }

    _.set(req, '_fulfillment.step', '');

    return event;
};
