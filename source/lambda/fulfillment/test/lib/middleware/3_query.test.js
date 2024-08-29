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

const query = require('../../../lib/middleware/3_query');
const queryFixtures = require('./3_query.fixtures')
const specialtyBotRouter = require('../../../lib/middleware/specialtyBotRouter');
const lexRouter = require('../../../lib/middleware/lexRouter');
const util = require('../../../lib/middleware/util');
jest.mock('../../../lib/middleware/specialtyBotRouter');
jest.mock('../../../lib/middleware/lexRouter');
jest.mock('../../../lib/middleware/util');

describe('when calling query function', () => {
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

    test('verify response when calling specialtyLambda & switchToNewBot evaluates to true ', async () => {
        lexRouter.elicitResponse.mockReturnValue(queryFixtures.createMockRoutingResponse("elicitResponse"));
        const mockRequest = queryFixtures.createRequestObject("What is QnABot", "specialtyLambda");
        mockRequest.session.specialtyLambda = "mock_query_lambda_arn_switch_bot_test";
        const response = await query(mockRequest, queryFixtures.createResponseObject());
        expect(response.res.session.botName).not.toBeDefined();
        const expectedResponse = queryFixtures.createMockEsQueryResponse();
        expectedResponse.res.result.qid = "specialty.001";
        delete expectedResponse.res.session.botName;
        expect(response).toEqual(expectedResponse);
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

    test('verify response when calling specialtyLambda', async () => {
        util.invokeLambda.mockReturnValue(queryFixtures.createMockRoutingResponse("specialtyBot", ""));
        const response = await query(queryFixtures.createRequestObject("What is QnABot", "specialtyLambda"), queryFixtures.createResponseObject());
        const expectedResponse = queryFixtures.createMockRoutingResponse("specialtyBot", "");
        expectedResponse.res.session.qnabotcontext.specialtyBot = "mock_specialty_bot";
        expectedResponse.res.session.qnabotcontext.specialtyBotName = "mock_specialty_bot_name";
        expect(util.invokeLambda).toHaveBeenCalled();
        expect(response).toEqual(expectedResponse);
    });

    test('verify response when calling query response contains specialty_bot_start_up_text', async () => {
        let mockReturnResponse = queryFixtures.createMockRoutingResponse("specialtyBot", "");
        const specialityBotResponse = queryFixtures.createMockRoutingResponse("specialtyBot");
        specialtyBotRouter.routeRequest.mockReturnValue(specialityBotResponse);
        mockReturnResponse.res.result.botRouting.specialty_bot_start_up_text = "mock_specialty_bot_start_up_text";
        util.invokeLambda.mockReturnValue(mockReturnResponse);
        let response = await query(queryFixtures.createRequestObject("What is QnABot", "specialtyLambda"), queryFixtures.createResponseObject());
        expect(response).toEqual(specialityBotResponse);
        expect(util.invokeLambda).toHaveBeenCalled();
        expect(specialtyBotRouter.routeRequest).toHaveBeenCalled();

        mockReturnResponse = queryFixtures.createMockRoutingResponse("specialtyBot", "");
        mockReturnResponse.res.result.botRouting.specialty_bot_start_up_text = "${utterance}";
        util.invokeLambda.mockReturnValue(mockReturnResponse);
        response = await query(queryFixtures.createRequestObject("What is QnABot", "specialtyLambda"), queryFixtures.createResponseObject());
        expect(response).toEqual(specialityBotResponse);
        expect(util.invokeLambda).toHaveBeenCalled();
        expect(specialtyBotRouter.routeRequest).toHaveBeenCalled();
    });

    test('verify response when default esquery method is used', async () => {
        const response = await query(queryFixtures.createRequestObject("What is QnABot"), queryFixtures.createResponseObject());
        expect(response).toEqual(queryFixtures.createMockEsQueryResponse());
    });
});
