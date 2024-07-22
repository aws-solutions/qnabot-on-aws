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
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('./logging');
const region = process.env.AWS_REGION;

const ssm = new SSMClient(customSdkConfig('C022', { region }));

function str2bool(settings) {
    const new_settings = _.mapValues(settings, (x) => {
        if (_.isString(x)) {
            x = x.replace(/^"(.+)"$/, '$1'); // remove wrapping quotes
            if (x.toLowerCase() === 'true') {
                return true;
            }
            if (x.toLowerCase() === 'false') {
                return false;
            }
        }
        return x;
    });
    return new_settings;
}

function str2int(settings) {
    const new_settings = _.mapValues(settings, (x) => {
        if (_.isString(x)) {
            // replace with number if string contains only numbers
            const regex = /^-?[0-9]\d*(\.\d+)?$/; // NOSONAR regex has to be precise, contains /d syntax class too
            const isNumber = regex.test(x);

            if (isNumber) {
                const converted = Number(x, 10);
                if (!Number.isNaN(converted)) {
                    return converted;
                }
            }
        }
        return x;
    });
    return new_settings;
}

async function get_parameter(param_name) {
    const params = {
        Name: param_name,
        WithDecryption: true
    };

    const getParamCmd = new GetParameterCommand(params);
    const response = await ssm.send(getParamCmd);
    let settings = response.Parameter.Value;
    try {
        settings = JSON.parse(response.Parameter.Value);
        settings = str2bool(settings);
        settings = str2int(settings);
        return settings;
    } catch (e) {
        return settings;
    }
}

async function getSettings() {
    const default_settings_param = process.env.DEFAULT_SETTINGS_PARAM;
    const private_settings_param = process.env.PRIVATE_SETTINGS_PARAM;
    const custom_settings_param = process.env.CUSTOM_SETTINGS_PARAM;

    qnabot.log('Getting Default QnABot settings from SSM Parameter Store: ', default_settings_param);
    const default_settings = await get_parameter(default_settings_param);

    qnabot.log('Getting Private QnABot settings from SSM Parameter Store: ', private_settings_param);
    const private_settings = await get_parameter(private_settings_param);

    qnabot.log('Getting Custom QnABot settings from SSM Parameter Store: ', custom_settings_param);
    const custom_settings = await get_parameter(custom_settings_param);

    const settings = _.merge(_.merge(default_settings, private_settings), custom_settings);
    return settings;
}

function set_environment_variables(settings) {
    process.env.comprehendResult = '';

    if (settings.ENABLE_REDACTING) {
        qnabot.debug('redacting enabled');
        process.env.QNAREDACT = 'true';
        process.env.REDACTING_REGEX = settings.REDACTING_REGEX;
    } else {
        qnabot.debug('redacting disabled');
        process.env.QNAREDACT = 'false';
        process.env.REDACTING_REGEX = '';
    }
    if (settings.DISABLE_CLOUDWATCH_LOGGING) {
        qnabot.debug('disable cloudwatch logging');
        process.env.DISABLECLOUDWATCHLOGGING = 'true';
    } else {
        qnabot.debug('enable cloudwatch logging');
        process.env.DISABLECLOUDWATCHLOGGING = 'false';
    }
    if (settings.ENABLE_REDACTING_WITH_COMPREHEND) {
        qnabot.debug('enable Amazon Comprehend based redaction.');
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = 'true';
    } else {
        qnabot.debug('disable Amazon Comprehend based redaction.');
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = 'false';
    }
    if (settings.ENABLE_DEBUG_LOGGING) {
        process.env.ENABLE_DEBUG_LOGGING = 'true';
    }
}

module.exports = {
    get_parameter,
    getSettings,
    set_environment_variables
};
