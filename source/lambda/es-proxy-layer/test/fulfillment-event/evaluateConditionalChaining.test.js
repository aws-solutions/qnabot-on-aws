/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { evaluateConditionalChaining } = require('../../lib/fulfillment-event/evaluateConditionalChaining');
const { encryptor } = require('../../lib/fulfillment-event/encryptor');
const { invokeLambda } = require('../../lib/fulfillment-event/invokeLambda');
const _ = require('lodash');
const { getHit } = require('../../lib/fulfillment-event/getHit');

jest.mock('../../lib/fulfillment-event/encryptor');
jest.mock('../../lib/fulfillment-event/invokeLambda');
jest.mock('../../lib/fulfillment-event/getHit');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

describe('evaluateConditionalChaining', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });


  test('evaluates a chaining rule', async () => {
    const question = "What is the capital of Georgia?";
    const req = { 
        question,
        qid: 'Text.003' 
    };
    const res = { session: {} };
    const hit = { 
        a: 'test chaining',
        conditionalChaining: 'testConditionalChaining' 
    };
    encryptor.decrypt.mockReturnValue('testChain');
    const [updatedReq, updatedRes, updatedHit, errors] = await evaluateConditionalChaining(req, res, hit, hit.conditionalChaining);
    expect(updatedReq.question).toStrictEqual(question);
    expect(errors).toEqual([]);
    expect(invokeLambda).toHaveBeenCalledTimes(0)
    expect(getHit).toHaveBeenCalledTimes(0)
    expect(updatedReq.qid).toStrictEqual(undefined)
  });

  test('evaluates a Lambda-based chaining rule', async () => {
    const question = "What is the capital of Georgia?";
    const req = { question, qid: 'Text.003' };
    const res = { session: {} };
    const hit = { conditionalChaining: 'lambda::testLambdaFunction' };
    const nextQ = {"next_q": "What is the population of Atlanta?"};
    encryptor.decrypt.mockReturnValue('lambda::testLambdaFunction');
    invokeLambda.mockResolvedValue([req, res, JSON.stringify(nextQ)]);
    getHit.mockResolvedValue([req, res, { id: 'test-id', text: 'What is the population of Atlanta?' } ,[]])

    const [updatedReq, updatedRes, updatedHit, errors] = await evaluateConditionalChaining(req, res, hit, hit.conditionalChaining);
    expect(invokeLambda).toHaveBeenCalledWith('testLambdaFunction', req, res);
    expect(updatedReq.question).toStrictEqual(nextQ);
    expect(errors).toEqual([]);
    expect(invokeLambda).toHaveBeenCalledTimes(1)
    expect(getHit).toHaveBeenCalledTimes(1)
    expect(updatedReq.qid).toStrictEqual(undefined)
  });

});
