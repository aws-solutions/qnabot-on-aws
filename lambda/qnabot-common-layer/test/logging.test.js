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

const AWS = require('aws-sdk-mock');
const logger = require('../qnabot/logging');
const loggingFixture = require('./logging.fixtures')

describe('when calling basic log functions', () => {
    beforeEach(() => {
        delete process.env.ENABLE_DEBUG_LOGGING
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("log is called correctly", async () => {
        const consoleMock = jest.spyOn(console, "log")
        logger.log("Test message")
        expect(consoleMock).toHaveBeenCalled()
	});

    test("warn is called correctly", async () => {
        const consoleMock = jest.spyOn(console, "warn")
        logger.warn("Test message")
        expect(consoleMock).toHaveBeenCalled()
	});

    test("debug is called correctly", async () => {
        const consoleMock = jest.spyOn(console, "debug")
        logger.debug("Test message")
        expect(consoleMock).not.toHaveBeenCalled()

        process.env.ENABLE_DEBUG_LOGGING = "true"
        logger.debug("Test message")
        expect(consoleMock).toHaveBeenCalled()
	});
});

describe('when calling redact_text function', () => {
    it("should immediately return with message if cloudwatch logging is disabled", async () => {
        process.env.DISABLECLOUDWATCHLOGGING = "true"
        let result = logger.redact_text("irrelevant text to redact")
        expect(result).toEqual("cloudwatch logging disabled");
        delete process.env.DISABLECLOUDWATCHLOGGING
	});

    it("should return with empty string if provided text is undefined", async () => {
        let result = logger.redact_text(undefined)
        expect(result).toEqual("");
	});

    it("should redact any jwt tokens", async () => {
        process.env.QNAREDACT = "true"
        process.env.REDACTING_REGEX = "bad"

        let result = logger.redact_text(loggingFixture.objectToRedact)
        expect(result).toEqual(JSON.stringify(loggingFixture.redactedObject));

        delete process.env.QNAREDACT
        delete process.env.REDACTING_REGEX
	});

    it("simple numbers should just be returned as string", async () => {
        let result = logger.redact_text(2022)
        expect(result).toEqual("2022");
	});
});

describe('when calling filter_comprehend_pii function', () => {
    beforeEach(() => {
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = "true"
        process.env.found_comprehend_pii = JSON.stringify(loggingFixture.mockComprehendDetectPII)
    });

    it("should return back with input text if comprehend redactiong is disabled", async () => {
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = "false"
        let testText = "irrelevant text to redact"
        let result = logger.filter_comprehend_pii(testText)
        expect(result).toEqual(testText);
	});
    it("should return back with input text if found_comprehend_pii is empty/undefined", async () => {
        process.env.found_comprehend_pii = "" //test empty string

        let testText = "irrelevant text to redact"
        let result = logger.filter_comprehend_pii(testText)
        expect(result).toEqual(testText);

        delete process.env.found_comprehend_pii //test undefined
        result = logger.filter_comprehend_pii(testText)
        expect(result).toEqual(testText);
	});
});

describe('when calling setPIIRedactionEnvironmentVars function', () => {
    beforeEach(() => {
        delete process.env.DISABLECLOUDWATCHLOGGING
        delete process.env.comprehendResult
        delete process.env.found_comprehend_pii
        delete process.env.ENABLE_REDACTING_WITH_COMPREHEND
    });

    it("should disable cloud watch logging if an error is thrown by Comprehend", async () => {
        AWS.mock('Comprehend', 'detectPiiEntities', function (params, callback){
            callback(new Error("should disable cloudwatch"), null)
        });

        await logger.setPIIRedactionEnvironmentVars(
            loggingFixture.comprehendDetectPIITestObject.Text,
            true,
            null,
            null
        );
        expect(process.env.DISABLECLOUDWATCHLOGGING).toEqual("true");

        AWS.restore('Comprehend', 'detectPiiEntities')
	});

    test("when PII found in Comprehend results", async () => {
        AWS.mock('Comprehend', 'detectPiiEntities', function (params, callback){
            callback(null, loggingFixture.mockComprehendDetectPIIResponse)
        });

        await logger.setPIIRedactionEnvironmentVars(
            loggingFixture.comprehendDetectPIITestObject.Text,
            true,
            "XXXXXX",
            "ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER"
        );

        //test to see if the environment variables were set correctly
        expect(process.env.comprehendResult).toEqual(JSON.stringify(loggingFixture.mockComprehendDetectPIIResponse))
        expect(process.env.found_comprehend_pii).toEqual(loggingFixture.mockFoundPII.toString())
        expect(process.env.DISABLECLOUDWATCHLOGGING).not.toEqual("true");

        //test to see if filter_comprehend_pii can actually redact with the environment variables just set
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = "true"
        let redactedResult = logger.filter_comprehend_pii(loggingFixture.comprehendDetectPIITestObject.Text)
        expect(redactedResult).toEqual(loggingFixture.comprehendDetectPIIRedactedTestObject.Text)

        AWS.restore('Comprehend', 'detectPiiEntities')
	});

    test("when PII is not found in Comprehend result", async () => {
        AWS.mock('Comprehend', 'detectPiiEntities', function (params, callback){
            callback(null, loggingFixture.mockComprehendDetectPIIEmptyResponse)
        });

        await logger.setPIIRedactionEnvironmentVars(
            loggingFixture.comprehendDetectPIITestObject.Text,
            true,
            null,
            null
        );

        expect(process.env.comprehendResult).toEqual(JSON.stringify(loggingFixture.mockComprehendDetectPIIEmptyResponse))
        expect(process.env.found_comprehend_pii).toEqual("")
        expect(process.env.DISABLECLOUDWATCHLOGGING).not.toEqual("true");

        //no need to test if filter_comprehend_pii correctly returns the text as is
        //as we already have a test case above for when found_comprehend_pii is empty string

        AWS.restore('Comprehend', 'detectPiiEntities')
	});
});

describe('when calling isPIIDetected function', () => {
    beforeEach(() => {
        delete process.env.comprehendResult
    });

    it("should return false if an error is thrown by Comprehend", async () => {
        AWS.mock('Comprehend', 'detectPiiEntities', function (params, callback){
            callback(new Error("should disable cloudwatch"), null)
        });

        let result = await logger.isPIIDetected(
            loggingFixture.comprehendDetectPIITestObject.Text,
            true,
            null,
            null
        );
        expect(result).toEqual(false);
        expect(process.env).not.toHaveProperty("comprehendResult")

        AWS.restore('Comprehend', 'detectPiiEntities')
	});

    test("when PII found in Comprehend results", async () => {
        let spyComprehend = jest.fn(() => loggingFixture.mockComprehendDetectPIIResponse);
        AWS.mock('Comprehend', 'detectPiiEntities', function (params, callback){
            callback(null, spyComprehend())
        });

        let result = await logger.isPIIDetected(
            loggingFixture.comprehendDetectPIITestObject.Text,
            true,
            null,
            "ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER"
        );

        expect(result).toEqual(true);
        expect(process.env.comprehendResult).toEqual(JSON.stringify(loggingFixture.mockComprehendDetectPIIResponse))

        //run PII again to ensure Comprehend API is only being called once
        result = await logger.isPIIDetected(
            loggingFixture.comprehendDetectPIITestObject.Text,
            true,
            null,
            "ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER"
        );

        expect(spyComprehend).toHaveBeenCalledTimes(1)
        expect(result).toEqual(true);
        expect(process.env.comprehendResult).toEqual(JSON.stringify(loggingFixture.mockComprehendDetectPIIResponse))

        AWS.restore('Comprehend', 'detectPiiEntities')
	});

    test("when PII is not found in Comprehend result", async () => {
        AWS.mock('Comprehend', 'detectPiiEntities', function (params, callback){
            callback(null, loggingFixture.mockComprehendDetectPIIEmptyResponse)
        });

        let result = await logger.isPIIDetected(
            loggingFixture.comprehendDetectPIITestObject.Text,
            true,
            null,
            null
        );

        expect(result).toEqual(false);
        expect(process.env.comprehendResult).toEqual(JSON.stringify(loggingFixture.mockComprehendDetectPIIEmptyResponse))

        AWS.restore('Comprehend', 'detectPiiEntities')
	});
});