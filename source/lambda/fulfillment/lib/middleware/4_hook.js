/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const util = require('./util');
const { applyGuardrail } = require('/opt/lib/bedrock/applyGuardrail.js');

async function runPostProcessGuardrail(req, res) {
    const POSTPROCESS_GUARDRAIL_IDENTIFIER = _.get(req, '_settings.POSTPROCESS_GUARDRAIL_IDENTIFIER');
    const POSTPROCESS_GUARDRAIL_VERSION = _.get(req, '_settings.POSTPROCESS_GUARDRAIL_VERSION');
    const errorMessage = _.get(req, '_settings.ERRORMESSAGE');
    const postprocessGuardrailId = POSTPROCESS_GUARDRAIL_IDENTIFIER.trim();
    const postprocessGuardrailVersion = POSTPROCESS_GUARDRAIL_VERSION.toString();

    if (!postprocessGuardrailId || !postprocessGuardrailVersion) {
        return { req, res };
    }
    const { text, guardrailAction, piiEntityAction } = await applyGuardrail(postprocessGuardrailId, postprocessGuardrailVersion, 'OUTPUT', res.message, errorMessage);

    if (guardrailAction === 'GUARDRAIL_INTERVENED' || guardrailAction === 'ERROR') {
        qnabot.log(`Bedrock Post-process Guardrail Response: ${text}`);

        _.set(res, 'message', text);
        _.set(res, 'session.appContext.altMessages.markdown', text);
        _.set(res, 'session.appContext.altMessages.ssml', text);
        _.set(res, 'appContext.altMessages.markdown', text);
        _.set(res, 'appContext.altMessages.ssml', text);
        _.set(res, 'result.alt.markdown', text);
        _.set(res, 'result.alt.ssml', text);
        _.set(res, 'plainMessage', text);
        _.set(res, 'answerSource', 'POSTPROCESS GUARDRAIL');

        if (piiEntityAction !== 'ANONYMIZED') {
            _.set(res, 'got_hits', 0);
        }
    }
    return { req, res };
}

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

    const result = await runPostProcessGuardrail(event.req, event.res);
    event.req = result.req;
    event.res = result.res;


    return event;
};
