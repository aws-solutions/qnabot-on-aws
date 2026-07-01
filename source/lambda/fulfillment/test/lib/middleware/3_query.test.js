/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const query = require('../../../lib/middleware/3_query');
const queryFixtures = require('./3_query.fixtures')
const specialtyBotRouter = require('../../../lib/middleware/specialtyBotRouter');
const lexRouter = require('../../../lib/middleware/lexRouter');
const util = require('../../../lib/middleware/util');
jest.mock('../../../lib/middleware/specialtyBotRouter');
jest.mock('../../../lib/middleware/lexRouter');
jest.mock('../../../lib/middleware/util');

describe('when calling query function', () => {
    beforeEach(() => {
        util.isSameAccountArn.mockReturnValue(true);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('it should call the specialtyBotRouter if request contains speciality bot', async () => {
        let mockSpecialityBotResponse = queryFixtures.createMockRoutingResponse("specialtyBot");
        specialtyBotRouter.routeRequest.mockReturnValue(mockSpecialityBotResponse);

        let response = await query(queryFixtures.createRequestObject("What is QnABot", "specialtyBot"), queryFixtures.createResponseObject());
        expect(specialtyBotRouter.routeRequest).toHaveBeenCalled();
        expect(response).toEqual(mockSpecialityBotResponse);

        mockSpecialityBotResponse = queryFixtures.createMockRoutingResponse("specialtyBot");
        mockSpecialityBotResponse.res.session.qnabotcontext.specialtyBot = "mockBot";
        specialtyBotRouter.routeRequest.mockReturnValue(mockSpecialityBotResponse);
        response = await query(queryFixtures.createRequestObject("What is QnABot", "specialtyBot"),
            queryFixtures.createResponseObject());
        expect(specialtyBotRouter.routeRequest).toHaveBeenCalled();
        expect(response).toEqual(mockSpecialityBotResponse);
    });

    test('should return response from ES query function when specialtyBotChainingConfig is set', async () => {
        specialtyBotRouter.routeRequest.mockReturnValue(queryFixtures.createMockRoutingResponse("specialtyBot"));
        const mockRequest = queryFixtures.createRequestObject("What is QnABot", "specialtyBot");
        mockRequest.session.qnabotcontext.sBChainingConfig = "mockChainingConfig"
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(specialtyBotRouter.routeRequest).toHaveBeenCalled();
        expect(response.res.session.qnabotcontext.elicitResponse.progress).not.toBeDefined();
        expect(response.res.session.qnabotcontext.elicitResponse.chainingConfig).not.toBeDefined();
    });

    test('verify handling of elicitResponse', async () => {
        let mockElicitResponse = queryFixtures.createMockRoutingResponse("elicitResponse", "");
        lexRouter.elicitResponse.mockReturnValue(mockElicitResponse);
        let response = await query(queryFixtures.createRequestObject("What is QnABot", "elicitResponse"), queryFixtures.createResponseObject());
        expect(lexRouter.elicitResponse).toHaveBeenCalled();
        expect(response).toEqual(mockElicitResponse);

        mockElicitResponse = queryFixtures.createMockRoutingResponse("elicitResponse", "Fulfilled");
        lexRouter.elicitResponse.mockReturnValue(mockElicitResponse);
        response = await query(queryFixtures.createRequestObject("What is QnABot", "elicitResponse"), queryFixtures.createResponseObject());
        expect(lexRouter.elicitResponse).toHaveBeenCalled();
        expect(response).toEqual(mockElicitResponse);
    });

    test('verify response when having elicitResponse with chainingConfig ', async () => {
        lexRouter.elicitResponse.mockReturnValue(queryFixtures.createMockRoutingResponse("elicitResponse", "Fulfilled"));
        const mockRequest = queryFixtures.createRequestObject("What is QnABot", "elicitResponse");
        mockRequest.session.qnabotcontext.elicitResponse.progress = "Fulfilled";
        mockRequest.session.qnabotcontext.elicitResponse.chainingConfig = "mockChainingConfig";
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(lexRouter.elicitResponse).toHaveBeenCalled();
        expect(response).toEqual(queryFixtures.createMockEsQueryResponse());
    });

    test('verify response when calling queryLambda', async () => {
        let mockReturnResponse = queryFixtures.createMockRoutingResponse("elicitResponse", "");
        util.invokeLambda.mockReturnValue(mockReturnResponse);

        let response = await query(queryFixtures.createRequestObject("What is QnABot", "queryLambda"), queryFixtures.createResponseObject());
        expect(util.invokeLambda).toHaveBeenCalled();
        const expectedResponse = queryFixtures.createMockRoutingResponse("elicitResponse", "");
        expectedResponse.res.session.qnabotcontext.elicitResponse.responsebot = "mock_responsebot_hook";
        expectedResponse.res.session.qnabotcontext.elicitResponse.namespace = "mock_namespace";
        expectedResponse.res.session.mock_namespace = {};
        expect(response).toEqual(expectedResponse);

        //with elicitResponse loopcount
        mockReturnResponse = queryFixtures.createMockRoutingResponse("elicitResponse", "");
        mockReturnResponse.res.session.qnabotcontext.elicitResponse.loopCount = 1;
        expectedResponse.res.session.qnabotcontext.elicitResponse.loopCount = 0;
        util.invokeLambda.mockReturnValue(mockReturnResponse);

        response = await query(queryFixtures.createRequestObject("What is QnABot", "queryLambda"), queryFixtures.createResponseObject());
        expect(util.invokeLambda).toHaveBeenCalled();
        expect(response).toEqual(expectedResponse);
    });

    test('verify cross-account queryLambda is blocked and falls through to esquery', async () => {
        util.isSameAccountArn.mockReturnValue(false);
        const mockRequest = queryFixtures.createRequestObject("What is QnABot", "queryLambda");
        mockRequest.session.queryLambda = "arn:aws:lambda:us-east-1:444455556666:function:qna-exfil";
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(util.invokeLambda).not.toHaveBeenCalled();
        expect(response).toEqual(queryFixtures.createMockEsQueryResponse());
    });

    test('verify same-account queryLambda ARN is allowed', async () => {
        const mockRequest = queryFixtures.createRequestObject("What is QnABot", "queryLambda");
        mockRequest.session.queryLambda = "arn:aws:lambda:us-east-1:111122223333:function:qna-quiz";
        util.invokeLambda.mockReturnValue(queryFixtures.createMockRoutingResponse("elicitResponse", ""));
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(util.invokeLambda).toHaveBeenCalledWith(expect.objectContaining({ FunctionName: "arn:aws:lambda:us-east-1:111122223333:function:qna-quiz" }));
    });

    test('verify bare function name queryLambda (no ARN prefix) is allowed', async () => {
        const mockRequest = queryFixtures.createRequestObject("What is QnABot", "queryLambda");
        mockRequest.session.queryLambda = "qna-quiz-function";
        util.invokeLambda.mockReturnValue(queryFixtures.createMockRoutingResponse("elicitResponse", ""));
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(util.invokeLambda).toHaveBeenCalledWith(expect.objectContaining({ FunctionName: "qna-quiz-function" }));
    });

    test('verify malformed ARN (starts with arn: but invalid format) is blocked', async () => {
        util.isSameAccountArn.mockReturnValue(false);
        const mockRequest = queryFixtures.createRequestObject("What is QnABot", "queryLambda");
        mockRequest.session.queryLambda = "arn:malformed-not-a-real-arn";
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(util.invokeLambda).not.toHaveBeenCalled();
        expect(response).toEqual(queryFixtures.createMockEsQueryResponse());
    });

    test('verify response when default esquery method is used', async () => {
        const response = await query(queryFixtures.createRequestObject("What is QnABot"), queryFixtures.createResponseObject());
        expect(response).toEqual(queryFixtures.createMockEsQueryResponse());
    });

    test('verify specialtybot routing sets session context when botRouting result present', async () => {
        specialtyBotRouter.routeRequest.mockReturnValue(queryFixtures.createMockRoutingResponse('specialtyBot'));
        const mockRequest = queryFixtures.createRequestObject('What is QnABot');
        mockRequest.session._mockBotRouting = {
            specialty_bot: 'mock_lambda::arn:aws:lambda:us-east-1:111122223333:function:mock-bot',
            specialty_bot_name: 'mock_bot_name',
        };
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(response?.res?.session?.qnabotcontext?.specialtyBot).toBeDefined();
    });

    test('verify specialtybot start_up_text sets req.question to utterance when ${utterance}', async () => {
        specialtyBotRouter.routeRequest.mockReturnValue(queryFixtures.createMockRoutingResponse('specialtyBot'));
        const mockRequest = queryFixtures.createRequestObject('What is QnABot');
        mockRequest.session._mockBotRouting = {
            specialty_bot: 'mock_lambda::arn:aws:lambda:us-east-1:111122223333:function:mock-bot',
            specialty_bot_name: 'mock_bot_name',
            specialty_bot_start_up_text: '${utterance}',
        };
        await query(mockRequest, queryFixtures.createResponseObject());
        expect(specialtyBotRouter.routeRequest).toHaveBeenCalled();
        expect(specialtyBotRouter.routeRequest.mock.calls[0][0]).toEqual(
            expect.objectContaining({ question: 'What is QnABot' })
        );
    });

    test('verify specialtybot start_up_text sets req.question to literal text', async () => {
        specialtyBotRouter.routeRequest.mockReturnValue(queryFixtures.createMockRoutingResponse('specialtyBot'));
        const mockRequest = queryFixtures.createRequestObject('What is QnABot');
        mockRequest.session._mockBotRouting = {
            specialty_bot: 'mock_lambda::arn:aws:lambda:us-east-1:111122223333:function:mock-bot',
            specialty_bot_name: 'mock_bot_name',
            specialty_bot_start_up_text: 'Welcome to the bot!',
        };
        await query(mockRequest, queryFixtures.createResponseObject());
        expect(specialtyBotRouter.routeRequest).toHaveBeenCalled();
        expect(specialtyBotRouter.routeRequest.mock.calls[0][0]).toEqual(
            expect.objectContaining({ question: 'Welcome to the bot!' })
        );
    });
});
