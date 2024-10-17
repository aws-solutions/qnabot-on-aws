/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const sentimemt = require('../../../lib/middleware/sentiment');
const awsMock = require('aws-sdk-client-mock');
const { ComprehendClient, DetectSentimentCommand } = require('@aws-sdk/client-comprehend');
const comprehendMock = awsMock.mockClient(ComprehendClient);

describe('test get sentiment function', () => {
    beforeEach(() => {
        comprehendMock.reset();
    });

    test("should be able to detect sentiment successfully", async () => {
        comprehendMock.on(DetectSentimentCommand).resolves({
            "SentimentScore": {
                "Mixed": 0.0033542951568961143,
                "Positive": 0.9869875907897949,
                "Neutral": 0.008563132025301456,
                "Negative": 0.0010949420975521207
            },
            "Sentiment": "POSITIVE",
        });
        const result = await sentimemt("This is a test");
        expect(result.Sentiment).toEqual("POSITIVE");
    });

    test("should throw an error if sentiment detection fails", async () => {
        comprehendMock.rejects('Mocked error');
        expect(sentimemt("This is a test")).
            rejects.toThrowError('Mocked error');
    });
});