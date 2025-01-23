/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const awsMock = require('aws-sdk-client-mock');
const settings = require('../qnabot/settings');
const settingsFixture = require('./settings.fixtures');
const { SSMClient, GetParameterCommand, PatchSourceFilterSensitiveLog } = require('@aws-sdk/client-ssm');
const ssmMock = awsMock.mockClient(SSMClient);
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const dynamoMock = awsMock.mockClient(DynamoDBClient);

describe('when calling set_environment_variables', () => {
    afterEach(() => {
        ssmMock.restore();
        delete process.env.QNAREDACT;
        delete process.env.REDACTING_REGEX;
        delete process.env.DISABLECLOUDWATCHLOGGING;
        delete process.env.ENABLE_REDACTING_WITH_COMPREHEND;
        delete process.env.ENABLE_DEBUG_LOGGING;
    });

    it('should correctly set the environment variables if enabled in settings', async () => {
        let testSettings = {
            ENABLE_REDACTING: true,
            REDACTING_REGEX: 'test-redact',
            DISABLE_CLOUDWATCH_LOGGING: true,
            ENABLE_REDACTING_WITH_COMPREHEND: true,
            ENABLE_DEBUG_LOGGING: true
        };

        settings.set_environment_variables(testSettings);

        expect(process.env).toHaveProperty('QNAREDACT', 'true');
        expect(process.env).toHaveProperty('REDACTING_REGEX', testSettings.REDACTING_REGEX);
        expect(process.env).toHaveProperty('DISABLECLOUDWATCHLOGGING', 'true');
        expect(process.env).toHaveProperty('ENABLE_REDACTING_WITH_COMPREHEND', 'true');
        expect(process.env).toHaveProperty('ENABLE_DEBUG_LOGGING', 'true');
    });

    it('should correctly set the environment variables if disabled in settings', async () => {
        let testSettings = {
            ENABLE_REDACTING: false,
            DISABLE_CLOUDWATCH_LOGGING: false,
            ENABLE_REDACTING_WITH_COMPREHEND: false
        };

        settings.set_environment_variables(testSettings);

        expect(process.env).toHaveProperty('QNAREDACT', 'false');
        expect(process.env).toHaveProperty('REDACTING_REGEX', '');
        expect(process.env).toHaveProperty('DISABLECLOUDWATCHLOGGING', 'false');
        expect(process.env).toHaveProperty('ENABLE_REDACTING_WITH_COMPREHEND', 'false');
        expect(process.env).not.toHaveProperty('ENABLE_DEBUG_LOGGING');
    });
});

describe('when calling getSettings function', () => {
    beforeAll(() => {
        dynamoMock.reset();
        dynamoMock.on(ScanCommand).callsFake(() => {
            return {Items: [{SettingName: {"S": "Test_Setting"}, SettingValue:{"S": "Test_Value"}, DefaultValue:{"S":"Test_Not_Chosen"}},{SettingName: {"S": "Test_Default_Setting"}, SettingValue:{"S": ""}, DefaultValue:{"S":"Test_Chosen"}}]};
        });
    });

    it('should return a properly merged settings object', async () => {
        process.env.SETTINGS_TABLE = 'mock_settings_table'

        let result = await settings.getSettings();

        expect(result).toEqual({"Test_Setting":"Test_Value", "Test_Default_Setting":"Test_Chosen"});
    });

    afterAll(() => {
        ssmMock.restore();
    });
});

describe('when calling get_parameter function', () => {
    beforeEach(() => {
        ssmMock.reset();
    });
    it('should return the raw settings when setting non JSON, simple string', async () => {
        ssmMock.on(GetParameterCommand).callsFake((params) => {
            return { Parameter: { Value: 'simple string value' } };
        });
        let result = await settings.get_parameter('mock');
        expect(result).toEqual('simple string value');
        ssmMock.restore();
    });
});
