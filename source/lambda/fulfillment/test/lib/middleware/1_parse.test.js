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

const _ = require('lodash');
const parse = require('../../../lib/middleware/1_parse');
const settings = require('qnabot/settings');
const parseFixtures = require('./1_parse.fixtures');
const awsMock = require('aws-sdk-client-mock');
const {
    ComprehendClient,
    DetectDominantLanguageCommand,
    DetectSentimentCommand
} = require('@aws-sdk/client-comprehend');
const comprehendMock = awsMock.mockClient(ComprehendClient);
const originalEnv = process.env;
jest.mock('qnabot/settings');

describe('parse function with Lex event', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
            DEFAULT_USER_POOL_JWKS_PARAM: 'mocked_user_pool_jwks_param',
            CUSTOM_SETTINGS_PARAM: 'mock_custom_settings_param',
            DEFAULT_SETTINGS_PARAM: 'mock_default_settings_param',
            PRIVATE_SETTINGS_PARAM: 'mock_private_settings_param',
        };
        comprehendMock.reset();
        settings.get_parameter.mockReturnValue('https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl');
    });

    test('when parsing request with sentiment & multilang support disabled', async () => {
        settings.getSettings.mockReturnValue(parseFixtures.defaultSettings);
        const res = {};
        const parseResponse = await parse(
            parseFixtures.createRequestObject('What is QnABot?', 'Text', null, null),
            res
        );
        console.log(`Parsed request: ${JSON.stringify(parseResponse.req)}`);
        expect(parseResponse.req).toBeDefined();
        expect(parseResponse.req._type).toBe('LEX');
        expect(parseResponse.req.sentiment).toBe('NOT_ENABLED');
    });

    test('should be able to return client_type based on request', async () => {
        settings.getSettings.mockReturnValue(parseFixtures.defaultSettings);
        const req = parseFixtures.createRequestObject('What is QnABot?', 'Text', null, null);
        _.set(req, '_event.requestAttributes.x-amz-lex:channel-type', 'Slack');
        var parseResponse = await parse(req, {});
        expect(parseResponse.req._clientType).toBe('LEX.Slack.Text');
        _.set(req, '_event.requestAttributes.x-amz-lex:channel-type', 'Twilio-SMS');
        parseResponse = await parse(req, {});
        expect(parseResponse.req._clientType).toBe('LEX.TwilioSMS.Text');
        _.set(req, '_event.requestAttributes.x-amz-lex:channel-type', 'Twilio');
        parseResponse = await parse(req, {});
        expect(parseResponse.req._clientType).toBe('LEX.Text');
        _.set(req, '_event.requestAttributes.x-amz-lex:channels:platform', 'Genesys Cloud');
        parseResponse = await parse(req, {});
        expect(parseResponse.req._clientType).toBe('LEX.GenesysCloud.Text');
        _.set(req, '_event.requestAttributes.x-amz-lex:accept-content-types', 'SSML');
        parseResponse = await parse(req, {});
        expect(parseResponse.req._clientType).toBe('LEX.AmazonConnect.Voice');
    });

    test('should be able to return _preferredResponseType based on request outputDialogMode', async () => {
        settings.getSettings.mockReturnValue(parseFixtures.defaultSettings);
        const req = parseFixtures.createRequestObject('What is QnABot?', 'Voice', null, null);
        var parseResponse = await parse(req, {});
        expect(parseResponse.req._preferredResponseType).toBe('SSML');

        _.set(req, '_event.requestAttributes.x-amz-lex:accept-content-types', 'SSML');
        _.set(req, '_event.outputDialogMode', 'Text');
        parseResponse = await parse(req, {});
        expect(parseResponse.req._preferredResponseType).toBe('SSML');

        _.set(req, '_event.outputDialogMode', 'invalid');
        parseResponse = await parse(req, {});
        expect(parseResponse.req._preferredResponseType).toBe('PlainText');
    });

    test('when parsing request with sentimemt & multilang support disabled', async () => {
        settings.getSettings.mockReturnValue(parseFixtures.defaultSettings);
        const req = parseFixtures.createRequestObject('What is QnABot?', 'Text', null, null);
        var parseResponse = await parse(req, {});
        expect(parseResponse.req).toBeDefined();
        expect(parseResponse.req._type).toBe('LEX');
        expect(parseResponse.req.sentiment).toBe('NOT_ENABLED');
    });

    test('when parsing request with multilang support enabled', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves({
            Languages: [
                {
                    'LanguageCode': 'en',
                    'Score': 1
                }
            ]
        });
        settings.getSettings.mockReturnValue(parseFixtures.defaultSettingsMultiLang);
        const parseResponse = await parse(parseFixtures.createRequestObject('What is QnABot?', 'Text', null, null), {});
        expect(parseResponse.req._type).toBe('LEX');
        expect(parseResponse.req._settings.ENABLE_MULTI_LANGUAGE_SUPPORT).toBe(true);
        expect(parseResponse.req.sentiment).toBe('NOT_ENABLED');
        expect(parseResponse.req.session.qnabotcontext.userLocale).toBe('en');
    });

    test('when parsing request with sentiment support enabled', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves({
            Languages: [
                {
                    'LanguageCode': 'en',
                    'Score': 1
                }
            ]
        });
        comprehendMock.on(DetectSentimentCommand).resolves({
            'SentimentScore': {
                'Mixed': 0.0033542951568961143,
                'Positive': 0.9869875907897949,
                'Neutral': 0.008563132025301456,
                'Negative': 0.0010949420975521207
            },
            'Sentiment': 'POSITIVE'
        });
        settings.get_parameter.mockReturnValue('https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl');
        settings.getSettings.mockReturnValue(parseFixtures.defaultSettingsSentiment);

        process.env.DEFAULT_SETTINGS_PARAM = 'mock_default_settings_param_sentiment';
        const parseResponse = await parse(parseFixtures.createRequestObject('What is QnABot?', 'Text', null, null), {});
        expect(parseResponse.req._type).toBe('LEX');
        expect(parseResponse.req.sentiment).toBe('POSITIVE');
        expect(parseResponse.req.session.qnabotcontext.userLocale).toBe('en');
    });
});

describe('parse function with Alexa event', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
            DEFAULT_USER_POOL_JWKS_PARAM: 'mocked_user_pool_jwks_param',
            DEFAULT_SETTINGS_PARAM: 'mock_default_settings_param',
            CUSTOM_SETTINGS_PARAM: 'mock_custom_settings_param',
            PRIVATE_SETTINGS_PARAM: 'mock_private_settings_param',
        };
        settings.get_parameter.mockReturnValue('https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl');
    });

    test('should be able to call parse function', async () => {
        settings.getSettings.mockReturnValue(parseFixtures.defaultSettings);
        const parseResponse = await parse(
            parseFixtures.createRequestObject('What is QnABot?', 'Text', 'version', { 'locale': 'en-US' }),
            {}
        );
        expect(parseResponse.req).toBeDefined();
        expect(parseResponse.req._type).toBe('ALEXA');
        expect(parseResponse.req._clientType).toBe('ALEXA');
        expect(parseResponse.req._settings.DEFAULT_USER_POOL_JWKS_URL).toEqual(
            'https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl'
        );
    });
});
