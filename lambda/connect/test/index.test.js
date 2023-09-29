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

const lambda = require('../index');
const fs = require("fs");
const contactflowFixture = require('./contactflow.fixtures')

describe('when calling connect handler in normal operation', () => {
    afterEach(() => {
        delete process.env.region
        delete process.env.accountId
        delete process.env.LexV2BotId
        delete process.env.LexV2BotName
        delete process.env.LexV2BotAlias
        delete process.env.LexV2BotAliasId
    });

    it("should correctly return the generated contact flow object", async () => {
        process.env.region = 'ca-central-1'
        process.env.accountId = 'account-id'
        process.env.LexV2BotId = 'bot-id'
        process.env.LexV2BotName = 'QnABot-Test-Name'
        process.env.LexV2BotAlias = 'live'
        process.env.LexV2BotAliasId = 'alias-id'

        let result = await lambda.handler()
        let mockResult = {
            CallFlow: contactflowFixture.mockCallFlow,
            FileName: "contactflowLexV2.json",
            QnaFile: "ConnectWizardQnA.json"
        }
        expect(result).toStrictEqual(mockResult)
	});
});

describe('when additional files are added to flowsv2', () => {
    beforeAll(() => {
        fs.openSync(`${__dirname}/../flowsv2/dummyFile.test`, 'w');
    });

    it("should throw an error as multiple flows are not supported", async () => {
        let result = await lambda.handler()
        expect(result).toStrictEqual({
            statusCode: 500,
            message: Error('message: Exactly one contact flow is currently supported')
        })
	});

    afterAll(() => {
        fs.unlinkSync(`${__dirname}/../flowsv2/dummyFile.test`);
    });
});