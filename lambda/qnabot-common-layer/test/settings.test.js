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

const awsMock = require('aws-sdk-client-mock');
const settings = require('../qnabot/settings');
const settingsFixture = require('./settings.fixtures')
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const ssmMock = awsMock.mockClient(SSMClient);
describe('when calling set_environment_variables', () => {
    afterEach(() => {
        ssmMock.restore()
        delete process.env.QNAREDACT
        delete process.env.REDACTING_REGEX
        delete process.env.DISABLECLOUDWATCHLOGGING
        delete process.env.ENABLE_REDACTING_WITH_COMPREHEND
        delete process.env.ENABLE_DEBUG_LOGGING
    });

    it("should correctly set the environment variables if enabled in settings", async () => {
        let testSettings = {
            ENABLE_REDACTING: true,
            REDACTING_REGEX: "test-redact",
            DISABLE_CLOUDWATCH_LOGGING: true,
            ENABLE_REDACTING_WITH_COMPREHEND: true,
            ENABLE_DEBUG_LOGGING: true
        }

        settings.set_environment_variables(testSettings)

        expect(process.env).toHaveProperty('QNAREDACT', "true")
        expect(process.env).toHaveProperty('REDACTING_REGEX', testSettings.REDACTING_REGEX)
        expect(process.env).toHaveProperty('DISABLECLOUDWATCHLOGGING', "true")
        expect(process.env).toHaveProperty('ENABLE_REDACTING_WITH_COMPREHEND', "true")
        expect(process.env).toHaveProperty('ENABLE_DEBUG_LOGGING', "true")
	});

    it("should correctly set the environment variables if disabled in settings", async () => {
        let testSettings = {
            ENABLE_REDACTING: false,
            DISABLE_CLOUDWATCH_LOGGING: false,
            ENABLE_REDACTING_WITH_COMPREHEND: false,
        }

        settings.set_environment_variables(testSettings)

        expect(process.env).toHaveProperty('QNAREDACT', "false")
        expect(process.env).toHaveProperty('REDACTING_REGEX', "")
        expect(process.env).toHaveProperty('DISABLECLOUDWATCHLOGGING', "false")
        expect(process.env).toHaveProperty('ENABLE_REDACTING_WITH_COMPREHEND', "false")
        expect(process.env).not.toHaveProperty('ENABLE_DEBUG_LOGGING')
	});
});



describe('when calling merge_default_and_custom_settings function', () => {
    beforeAll(() => {
        ssmMock.reset();
        ssmMock.on(GetParameterCommand).callsFake((params)=> {
            let result = settingsFixture.defaultSettingsMock
            if(params.Name === 'custom'){
                result = settingsFixture.customSettingsMock
            }
            return { Parameter: {Value: result} };
        });
    });

    it("should return a properly merged settings object", async () => {
        process.env.DEFAULT_SETTINGS_PARAM = "default"
        process.env.CUSTOM_SETTINGS_PARAM = "custom"

        let result = await settings.merge_default_and_custom_settings()

        expect(result).toEqual(settingsFixture.mergedSettings);
	});

    afterAll(() => {
        ssmMock.restore();
    });
});

describe('when calling get_parameter function', () => {
    beforeEach(() => {
        ssmMock.reset();
    });
    it("should return the raw settings when setting non JSON, simple string", async () => {
        ssmMock.on(GetParameterCommand).callsFake((params) =>{
            return { Parameter: {Value: "simple string value"} };
        });
        let result = await settings.get_parameter('mock')
        expect(result).toEqual("simple string value");
        ssmMock.restore();
	});
});