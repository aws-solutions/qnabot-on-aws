/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('./logging');
const region = process.env.AWS_REGION;

const ssm = new SSMClient(customSdkConfig('C022', { region }));
const dynamodb = new DynamoDBClient(customSdkConfig('C022', { region }));

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

    qnabot.log('Checking for QnABot Settings in DynamoDB Table: ', process.env.SETTINGS_TABLE);

    const params = {
        TableName: process.env.SETTINGS_TABLE
    };
    let settings = {}
    let response;
    try {
        const command = new ScanCommand(params);
        response = await dynamodb.send(command);

    } catch (error) {
        console.log(error, error.stack);
        throw new Error(`Error back from DynamoDB request: ${error}`);
    }

    response.Items.forEach(item => {
        const unmarshalledItem = unmarshall(item);
        const settingName = unmarshalledItem.SettingName;
        const settingValue = unmarshalledItem.SettingValue;
        const defaultValue = unmarshalledItem.DefaultValue;

        if (settingValue != "") {
            settings[settingName] = settingValue;
        } else {
            settings[settingName] = defaultValue;
        }
        settings = str2bool(settings);
        settings = str2int(settings);       
    });

    qnabot.log('Found settings: ', settings);

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
