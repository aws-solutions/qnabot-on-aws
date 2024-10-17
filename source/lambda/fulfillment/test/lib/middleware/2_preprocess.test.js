/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const preprocess = require('../../../lib/middleware/2_preprocess');
const preprocessFixtures = require('./2_preprocess.fixtures')
const awsMock = require('aws-sdk-client-mock');
const util = require('../../../lib/middleware/util');
const logging = require('qnabot/logging')
const jwt = require('../../../lib/middleware/jwt');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const dynamoDbMock = awsMock.mockClient(DynamoDBDocumentClient);
const originalEnv = process.env;
jest.mock('../../../lib/middleware/util');
jest.mock('../../../lib/middleware/jwt');
jest.mock('qnabot/logging');


describe('when calling preprocess function', () => {
    beforeEach(() => {
        dynamoDbMock.reset();
        process.env = {
            ...originalEnv,
            ES_ADDRESS: 'mock_es_address',
            ES_INDEX: 'mock_es_index',
            ES_TYPE: 'qna',
            ES_SERVICE_QID: 'mock_es_qid',
            ES_SERVICE_PROXY: 'mock_es_proxy',
            DYNAMODB_USERSTABLE: 'mock_user_table'
        };
    });

    test('should preprocess request and return it', async () => {
        jwt.decode.mockReturnValue(preprocessFixtures.jwtDecodeResponse)
        jwt.verify.mockReturnValue("https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json")
        dynamoDbMock.on(GetCommand).resolves(preprocessFixtures.ddbGetUserResponse);

        const preProcessResponse = await preprocess(preprocessFixtures.createRequestObject("Test Question"),
            preprocessFixtures.createResponseObject("Test Answer"));

        expect(preProcessResponse.req._userInfo).toBeDefined();
        expect(preProcessResponse.req._info.es.address).toEqual(process.env.ES_ADDRESS);;
        expect(preProcessResponse.req._info.es.index).toEqual(process.env.ES_INDEX);
        expect(preProcessResponse.req._info.es.service.qid).toEqual(process.env.ES_SERVICE_QID);
        expect(preProcessResponse.req._info.es.service.proxy).toEqual(process.env.ES_SERVICE_PROXY);
        

        expect(preProcessResponse.res._userInfo).toBeDefined();
    });

    test('when getting user info from DDB fails, should return request with userInfo from token', async () => {
        jwt.decode.mockReturnValue(preprocessFixtures.jwtDecodeResponse)
        jwt.verify.mockReturnValue("https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json")
        dynamoDbMock.on(GetCommand).rejects('mocked DBB error');

        const preProcessResponse = await preprocess(preprocessFixtures.createRequestObject("Test Question"),
            preprocessFixtures.createResponseObject("Test Answer"));

        expect(preProcessResponse.req._userInfo).toBeDefined();
        expect(preProcessResponse.req._info.es.address).toEqual(process.env.ES_ADDRESS);;
        expect(preProcessResponse.req._info.es.index).toEqual(process.env.ES_INDEX);
        expect(preProcessResponse.req._info.es.service.qid).toEqual(process.env.ES_SERVICE_QID);
        expect(preProcessResponse.req._info.es.service.proxy).toEqual(process.env.ES_SERVICE_PROXY);

        expect(preProcessResponse.res._userInfo).toBeDefined();
    });

    test('should set additional user parameters if returned by token decode response', async () => {
        jwt.decode.mockReturnValue(preprocessFixtures.jwtDecodeResponseEnhanced)
        jwt.verify.mockReturnValue("https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json")
        dynamoDbMock.on(GetCommand).resolves(preprocessFixtures.ddbGetUserResponse);

        const preProcessResponse = await preprocess(preprocessFixtures.createRequestObject("Test Question"),
            preprocessFixtures.createResponseObject("Test Answer"));

        expect(preProcessResponse.req._userInfo.preferred_username).toEqual('mock_preferred_username');
        expect(preProcessResponse.req._userInfo.GivenName).toEqual('mock_given_name');
        expect(preProcessResponse.req._userInfo.Profile).toEqual('mock_profile');
        expect(preProcessResponse.req._userInfo).toBeDefined();
        expect(preProcessResponse.req._info.es.address).toEqual(process.env.ES_ADDRESS);;

        expect(preProcessResponse.res._userInfo).toBeDefined();
    });

    test('when request contains invalid jwt or jwt decode fails', async () => {
        jwt.decode.mockReturnValue(null);
        dynamoDbMock.on(GetCommand).resolves({});
        const request = preprocessFixtures.createRequestObject("Test Question");
        request._settings.ENFORCE_VERIFIED_IDENTITY = true;
        const preProcessResponse = await preprocess(request,
            preprocessFixtures.createResponseObject("Test Answer"));

        expect(preProcessResponse.req.question).toEqual('no_verified_identity');
        expect(preProcessResponse.req._userInfo.UserId).not.toBeDefined();
    });

    test('should remove id tokens from session if REMOVE_ID_TOKENS_FROM_SESSION is set', async () => {
        jwt.decode.mockReturnValue(preprocessFixtures.jwtDecodeResponse)
        jwt.verify.mockReturnValue("https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json")
        dynamoDbMock.on(GetCommand).resolves(preprocessFixtures.ddbGetUserResponse);

        let preProcessResponse = await preprocess(preprocessFixtures.createRequestObject("Test Question", true, 'LEX'),
            preprocessFixtures.createResponseObject("Test Answer"));

        console.log(`processedRequest: ${JSON.stringify(preProcessResponse.req)}`);
        expect(preProcessResponse.req._userInfo).toBeDefined();
        expect(preProcessResponse.req._info.es.address).toEqual(process.env.ES_ADDRESS);;
        expect(preProcessResponse.req._info.es.index).toEqual(process.env.ES_INDEX);
        expect(preProcessResponse.req._info.es.service.qid).toEqual(process.env.ES_SERVICE_QID);
        expect(preProcessResponse.req._info.es.service.proxy).toEqual(process.env.ES_SERVICE_PROXY);
        expect(preProcessResponse.req.session.idtokenjwt).not.toBeDefined();
        expect(preProcessResponse.req._event.sessionAttributes.idtokenjwt).not.toBeDefined();
        expect(preProcessResponse.res._userInfo).toBeDefined();

        preProcessResponse = await preprocess(preprocessFixtures.createRequestObject("Test Question", true, 'ALEXA'),
            preprocessFixtures.createResponseObject("Test Answer"));
        expect(preProcessResponse.req._userInfo).toBeDefined();
        expect(preProcessResponse.req._info.es.address).toEqual(process.env.ES_ADDRESS);;
        expect(preProcessResponse.req.session.idtokenjwt).not.toBeDefined();
        expect(preProcessResponse.req._event.session.attributes.idtokenjwt).not.toBeDefined();
        expect(preProcessResponse.res._userInfo).toBeDefined();
    });

    test('should run preprocess lambda if it is defined', async () => {
        jwt.decode.mockReturnValue(preprocessFixtures.jwtDecodeResponse)
        jwt.verify.mockReturnValue("https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json")
        util.getLambdaArn.mockReturnValue('mock_lambda_arn');

        dynamoDbMock.on(GetCommand).resolves(preprocessFixtures.ddbGetUserResponse);

        let request = preprocessFixtures.createRequestObject("Test Question");
        let response = preprocessFixtures.createResponseObject("Test Answer");

        console.log(`request: ${JSON.stringify(request)}`);
        util.invokeLambda.mockReturnValue({ "req": request, "res": response });

        request._settings.LAMBDA_PREPROCESS_HOOK = 'qna-preprocess-lambda';
        preProcessResponse = await preprocess(request,
            response);

        expect(preProcessResponse.req._userInfo).toBeDefined();
        expect(util.getLambdaArn).toHaveBeenCalled();
        expect(util.invokeLambda).toHaveBeenCalled();
    });

    test('should catch pre-processing lambda invocation errors and continue execution', async () => {
        jwt.decode.mockReturnValue(preprocessFixtures.jwtDecodeResponse)
        jwt.verify.mockReturnValue("https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json")
        util.getLambdaArn.mockReturnValue('mock_lambda_arn');

        dynamoDbMock.on(GetCommand).resolves(preprocessFixtures.ddbGetUserResponse);

        let request = preprocessFixtures.createRequestObject("Test Question");
        let response = preprocessFixtures.createResponseObject("Test Answer");

        console.log(`request: ${JSON.stringify(request)}`);
        util.invokeLambda.mockRejectedValue('mock_error');

        request._settings.LAMBDA_PREPROCESS_HOOK = 'qna-preprocess-lambda';
        preProcessResponse = await preprocess(request,
            response);
        const req = request;
        const res = response;

        expect(preProcessResponse.req._userInfo).toBeDefined();
        expect(util.getLambdaArn).toHaveBeenCalled();
        expect(util.invokeLambda).toHaveBeenCalled();
        expect(preProcessResponse).toEqual({req, res});
    });

    test('should replace question if PII_REJECTION_ENABLED is set', async () => {
        jwt.decode.mockReturnValue(preprocessFixtures.jwtDecodeResponseEnhanced)
        jwt.verify.mockReturnValue("https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json")
        dynamoDbMock.on(GetCommand).resolves(preprocessFixtures.ddbGetUserResponse);

        logging.isPIIDetected.mockReturnValue(true);
        let request = preprocessFixtures.createRequestObject("Test PII Question");
        request._settings.PII_REJECTION_ENABLED = true;
        let preProcessResponse = await preprocess(request,
            preprocessFixtures.createResponseObject("Test Answer"));

        expect(preProcessResponse.req.question).toEqual('pii_rejection_question');

        logging.isPIIDetected.mockReturnValue(false);
        request = preprocessFixtures.createRequestObject("Test Question");
        request._settings.PII_REJECTION_ENABLED = true;
        preProcessResponse = await preprocess(request,
            preprocessFixtures.createResponseObject("Test Answer"));
        expect(preProcessResponse.req.question).toEqual('Test Question');
    });

});

