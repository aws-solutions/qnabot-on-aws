// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const lambda = require('../index');
const fs = require("fs");
const callFlowFixture = `${__dirname}/callflow.fixtures.yaml`

describe('when calling genesys handler in normal operation', () => {
    afterEach(() => {
        delete process.env.region
        delete process.env.accountId
        delete process.env.LexV2BotId
        delete process.env.LexV2BotName
        delete process.env.LexV2BotAlias
        delete process.env.LexV2BotAliasId
    });

    it("should correctly return the generated callflow yaml", async () => {
        process.env.region = 'ca-central-1'
        process.env.accountId = 'account-id'
        process.env.LexV2BotId = 'bot-id'
        process.env.LexV2BotName = 'QnABot-Test-Name'
        process.env.LexV2BotAlias = 'live'
        process.env.LexV2BotAliasId = 'alias-id'

        let result = await lambda.handler()
        let mockResult = fs.readFileSync(callFlowFixture).toString();

        expect(result).toBe(mockResult)
	});
});

describe('when calling additional files are added to flowsv2', () => {
    beforeAll(() => {
        fs.openSync(`${__dirname}/../flowsv2/dummyFile.test`, 'w');
    });

    it("should throw an error as multiple flows are not supported", async () => {
        let result = await lambda.handler()
        expect(result).toStrictEqual({
            statusCode: 500,
            message: {
                message: "Exactly one call flow is currently supported"
            }
        })
	});

    afterAll(() => {
        fs.unlinkSync(`${__dirname}/../flowsv2/dummyFile.test`);
    });
});