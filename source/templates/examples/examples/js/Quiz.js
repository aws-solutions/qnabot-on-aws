/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { KMSClient, DecryptCommand, EncryptCommand } = require('@aws-sdk/client-kms');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const customSdkConfig = require('sdk-config/customSdkConfig');

const region = process.env.AWS_REGION;
const lambda = new LambdaClient(customSdkConfig('C018', { region }));
const kms = new KMSClient(customSdkConfig('C018', { region }));
const handlebars = require('handlebars');
const fs = require('fs');

handlebars.registerHelper('arrayPlural', (array, singular, plural) => {
    if (array.length === 1) {
        return singular;
    }
    return plural;
});

const markdown = handlebars.compile(
    fs.readFileSync(`${__dirname}/templates/quiz-response.md`, 'utf-8'),
);
const text = handlebars.compile(
    fs.readFileSync(`${__dirname}/templates/quiz-response.hbs`, 'utf-8'),
);

exports.handler = async function (event, context) {
    console.log(JSON.stringify(event, null, 2));
    let prevDocument; let nextDocument; let
        quizBot;
    try {
        if (event.res.session.quizBot) {
            const params = {
                CiphertextBlob: Buffer.from(event.res.session.quizBot, 'base64'),
                EncryptionContext: {
                    userId: event.req._event.userId,
                },
            };
            const decryptCmd = new DecryptCommand(params);
            const decrypt = await kms.send(decryptCmd);
            const decryptPlaintext = Buffer.from(decrypt.Plaintext).toString();
            quizBot = JSON.parse(decryptPlaintext);
        } else {
            quizBot = {
                questionCount: 0,
                correctAnswerCount: 0,
                next: event.res.result.args[0],
                originalDocumentQid: _.get(event, 'res.session.qnabotcontext.previous.qid', ''),
            };
        }
        console.log(JSON.stringify(quizBot, null, 2));
        const templateParams = {
            first: quizBot.questionCount === 0,
            message: _.get(event, 'res.result.a'),
        };
        if (quizBot.prev) {
            prevDocument = await getPrevDoc(event, quizBot);

            templateParams.correctAnswers = quizBot.correctAnswers;
            if (isCorrect(
                event.req.question,
                quizBot.correctAnswers,
                quizBot.incorrectAnswers,
            )) {
                templateParams.correct = true;
                templateParams.message = _.get(prevDocument, 'responses.correct');
                quizBot.correctAnswerCount++;
            } else {
                templateParams.incorrect = true;
                templateParams.message = _.get(prevDocument, 'responses.incorrect');
            }
        }

        if (quizBot.next) {
            nextDocument = await getNextDoc(event, quizBot);

            templateParams.question = nextDocument.question;
            templateParams.answers = _.shuffle(
                nextDocument.incorrectAnswers.map((answer) => [answer, false])
                    .concat(
                        nextDocument.correctAnswers.map((answer) => [answer, true]),
                    ),
            )
                .map((val, index) => {
                    val[2] = String.fromCharCode(65 + index);
                    return val;
                });

            quizBot.correctAnswers = templateParams.answers
                .filter((x) => x[1]).map((x) => x[2]);
            quizBot.incorrectAnswers = templateParams.answers
                .filter((x) => !x[1]).map((x) => x[2]);

            event.res.session.queryLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;
            quizBot.questionCount++;
            quizBot.prev = quizBot.next;
            quizBot.next = _.get(nextDocument, 'next[0]', false);

            const params = {
                KeyId: process.env.QUIZ_KMS_KEY,
                Plaintext: Buffer.from(JSON.stringify(quizBot)),
                EncryptionContext: {
                    userId: event.req._event.userId,
                },
            };
            const encryptCmd = new EncryptCommand(params);
            const encrypt = await kms.send(encryptCmd);
            console.log(encrypt);

            event.res.session.quizBot = Buffer.from(encrypt.CiphertextBlob).toString('base64');
            if (_.get(nextDocument, 'r.imageUrl')) {
                event.res.card = nextDocument.r;
                event.res.card.send = true;
            }
        } else {
            templateParams.finished = true;
            templateParams.totalCorrect = quizBot.correctAnswerCount;
            templateParams.totalQuestions = quizBot.questionCount;
            templateParams.message = _.get(prevDocument, 'responses.incorrect');
            templateParams.endmessage = _.get(prevDocument, 'responses.end', 'Thank you for taking the quiz!');
            const score = quizBot.correctAnswerCount / quizBot.questionCount * 100;
            templateParams.score = Math.round(score);
            templateParams.success = templateParams.score > 50;
            clear(event);
        }
        render(event, templateParams);
    } catch (e) {
        let params;
        switch (e.message) {
        case 'exit':
            params = {
                exit: true,
            };
            clear(event);
            render(event, params);
            break;
        case 'InvalidAnswer':
            params = {
                invalid: true,
                answers: quizBot.correctAnswers.concat(quizBot.incorrectAnswers).sort(),
            };
            render(event, params);
            break;
        default:
            console.log('Failed', e);
            clear(event);
            event.message = 'Sorry, Failed to process quiz';
        }
    } finally {
        console.log(JSON.stringify(event, null, 2));
    }
    return event;
};
async function getPrevDoc(event, quizBot) {
    const params = {
        FunctionName: event.req._info.es.service.qid,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ qid: quizBot.prev }),
    };
    const invokeCmd = new InvokeCommand(params);
    const prev = await lambda.send(invokeCmd);
    const payload = Buffer.from(prev.Payload).toString();
    const prevDocument = JSON.parse(payload);
    console.log(JSON.stringify(prevDocument, null, 2));
    if (!prevDocument) throw new Error(`Next Document not Found:${quizBot.prev}`);
    return prevDocument;
}

async function getNextDoc(event, quizBot) {
    const params = {
        FunctionName: event.req._info.es.service.qid,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ qid: quizBot.next }),
    };
    const invokeCmd = new InvokeCommand(params);
    const result = await lambda.send(invokeCmd);
    const payload = Buffer.from(result.Payload).toString();
    const nextDocument = JSON.parse(payload);
    console.log(JSON.stringify(nextDocument, null, 2));
    if (!nextDocument) throw new Error(`Next Document not Found:${quizBot.next}`);
    return nextDocument;
}

function render(event, params) {
    event.res.message = text(params)
        .replace(/\r?\n|\r/g, ' ').replace(/ +(?= )/g, '');
    _.set(
        event,
        'res.session.appContext.altMessages.markdown',
        markdown(params),
    );
}

function clear(event) {
    delete event.res.session.quizBot;
    delete event.res.session.queryLambda;
}

function isCorrect(response, correct, incorrect) {
    const response_standard = standardize(response);
    if (['QUIT', 'EXIT'].includes(response_standard)) {
        throw new Error('exit');
    } else {
        if (correct.includes(response_standard)) {
            return true;
        }
        if (incorrect.includes(response_standard)) {
            return false;
        }
        throw new Error('InvalidAnswer');
    }
}

function standardize(str) {
    return str.toUpperCase().trim().replace(/[^\w\s]|_/g, '');
}
