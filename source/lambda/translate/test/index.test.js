/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const lambda = require('../index');
const translateFixture = require('./translate.fixtures');
const awsMock = require('aws-sdk-client-mock');
const { TranslateClient, ListTerminologiesCommand, ImportTerminologyCommand } = require('@aws-sdk/client-translate');
const translateMock = awsMock.mockClient(TranslateClient);

describe('when invoking lambda with an invalid event', () => {
    it("should return a 200 code but provide an error message in the response body", async () => {
        let result = await lambda.handler({});
        let resultBody = JSON.parse(result.body)

        expect(result.statusCode).toBe(200);
        expect(resultBody.Status).toBe("Failed");
        expect(resultBody).toHaveProperty("Error");
	});
});

describe('when invoking lambda with an invalid path', () => {
    it("should return a 404 code", async () => {
        let event  = translateFixture.createEvent({path: "/test/some/invalid/endpoint"})

        let result = await lambda.handler(event)

        expect(result.statusCode).toBe(404);
	});
});

describe('when invoking lambda to list terminologies', () => {
    beforeAll(() => {
        translateMock.reset();
        translateMock.on(ListTerminologiesCommand).callsFake((params) => {
            return translateFixture.listData.listTerminologiesResponseMock;
        });

    });

    it("should return a 200 code with the listed terminologies in the response body", async () => {
        let event  = translateFixture.createEvent({path: "/test/translate/list"})

        let result = await lambda.handler(event)
        let resultBody = JSON.parse(result.body)

        expect(result.statusCode).toBe(200);
        expect(resultBody).toEqual(translateFixture.listData.listApiOutput);
	});

    afterAll(() => {
        translateMock.restore();
    });
});

describe('when invoking lambda to import terminologies', () => {
    beforeAll(() => {
        translateMock.reset();
        translateMock.on(ImportTerminologyCommand).callsFake((params) => {
            return translateFixture.importData.importTerminologiesResponseMock;
        });
    });

    it("should return a 200 code with a success response body", async () => {
        let event  = translateFixture.createEvent({path: "/test/translate/import"})
        event.body = translateFixture.importData.importApiInput

        let result = await lambda.handler(event)
        let resultBody = JSON.parse(result.body)

        expect(result.statusCode).toBe(200);
        expect(resultBody.Status).toBe("Success");
        expect(resultBody.Error).toBe("");
        expect(resultBody.Response).toEqual(translateFixture.importData.importTerminologiesResponseMock);
	});

    afterAll(() => {
        translateMock.restore();
    });
});