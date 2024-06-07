/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const { mockClient } = require('aws-sdk-client-mock');
const { KMSClient, DecryptCommand, EncryptCommand } = require('@aws-sdk/client-kms');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { event, data, encrypt, decrypt } = require('./Quiz.fixtures');
const { handler } = require('../Quiz');

const kmsMock = mockClient(KMSClient);
const lambdaMock = mockClient(LambdaClient);

describe('Quiz handler', () => {
    beforeEach(() => {
        kmsMock.reset();
        lambdaMock.reset();
    });

    test('generates a question from qid', async () => {
        
        lambdaMock.on(InvokeCommand).resolves(data);

        kmsMock.on(DecryptCommand).resolves(decrypt);
        kmsMock.on(EncryptCommand).resolves(encrypt);

        await handler(event, {}, () => {});
        expect(event.res.message).toContain('The first question is: Which celestial object is a planet?');
        expect(event.res.message).toContain('Mars');
        expect(event.res.message).toContain('Earth');
        expect(event.res.message).toContain('Pluto');
        expect(event.res.message).toContain('Moon');
    });

    test('evaluates correct answer', async () => {
        const cloneEvent = JSON.parse(JSON.stringify(event));
        cloneEvent.res.session.quizBot = ['not empty'];

        lambdaMock.on(InvokeCommand).resolves(data);
        kmsMock.on(DecryptCommand).resolves(decrypt);
        kmsMock.on(EncryptCommand).resolves(encrypt);

        const callback = (error, result) => {
            expect(result.res.message).toContain('Correct answer!');
        };

        await handler(cloneEvent, {}, callback);
    });

    test('evaluates incorrect answer', async () => {
        const cloneEvent = JSON.parse(JSON.stringify(event));
        cloneEvent.res.session.quizBot = ['not empty'];
        cloneEvent.req.question = 'moon';

        lambdaMock.on(InvokeCommand).resolves(data);
        kmsMock.on(DecryptCommand).resolves(decrypt);
        kmsMock.on(EncryptCommand).resolves(encrypt);

        const callback = (error, result) => {
            expect(result.res.message).toContain('Sorry, that was incorrect. The correct answers are ');
        };

        await handler(cloneEvent, {}, callback);
    });

    test('returns an error if answer not in list', async () => {
        const cloneEvent = JSON.parse(JSON.stringify(event));
        cloneEvent.res.session.quizBot = ['not empty'];
        cloneEvent.req.question = 'tomato';

        lambdaMock.on(InvokeCommand).resolves(data);
        kmsMock.on(DecryptCommand).resolves(decrypt);
        kmsMock.on(EncryptCommand).resolves(encrypt);

        const callback = (error, result) => {
            expect(result.res.message).toContain('Sorry that was an invalid response, the valid responses are ');
        };

        await handler(cloneEvent, {}, callback);
    });

    test('clears history on user requested exit', async () => {
        const cloneEvent = JSON.parse(JSON.stringify(event));
        cloneEvent.res.session.quizBot = ['not empty'];
        cloneEvent.req.question = 'exit';

        lambdaMock.on(InvokeCommand).resolves(data);
        kmsMock.on(DecryptCommand).resolves(decrypt);
        kmsMock.on(EncryptCommand).resolves(encrypt);

        const callback = (error, result) => {
            expect(result.res.session.quizBot).toEqual(undefined);
            expect(result.res.session.queryLambda).toEqual(undefined);
            expect(result.res.message).toContain('You have now exited the quiz. Ask for help for next steps.');
        };

        await handler(cloneEvent, {}, callback);
    });

    test('clears history and returns error on lambda invocation error', async () => {
        lambdaMock.rejects('mocked rejection');

        const callback = (error, result) => {
            expect(result.res.session.quizBot).toEqual(undefined);
            expect(result.res.session.queryLambda).toEqual(undefined);
            expect(result.message).toContain('Sorry, Failed to process quiz');
        };

        await handler(event, {}, callback);
    });

    test('moves to next question if previous question given', async () => {
        const cloneEvent = JSON.parse(JSON.stringify(event));
        cloneEvent.res.session.quizBot = ['not empty'];

        lambdaMock.on(InvokeCommand).resolves(data);
        kmsMock.on(DecryptCommand).resolves(decrypt);
        kmsMock.on(EncryptCommand).resolves(encrypt);

        const callback = (error, result) => {
            expect(result.res.message).toContain('The next question is: ');
        };

        await handler(cloneEvent, {}, callback);
    });

    test('finishes quiz if no next question', async () => {
        const cloneEvent = JSON.parse(JSON.stringify(event));
        cloneEvent.res.session.quizBot = ['not empty'];

        const noNextDecrypt = {
            Plaintext: JSON.stringify({
                prev: 'Quiz.001',
                qid: 'Quiz.002',
                correctAnswers: ['EARTH', 'MARS'],
                incorrectAnswers: ['PLUTO', 'MOON'],
                correctAnswerCount: 6,
                incorrectAnswerCount: 3,
                questionCount: 10,
            }),
        }

        lambdaMock.on(InvokeCommand).resolves(data);
        kmsMock.on(DecryptCommand).resolves(noNextDecrypt);
        kmsMock.on(EncryptCommand).resolves(encrypt);

        const callback = (error, result) => {
            expect(result.res.message).toContain('Correct answer! You got 7 questions correct out of 10 with a score of 70.');
        };

        await handler(cloneEvent, {}, callback);
    });
});
