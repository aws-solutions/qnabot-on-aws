/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { ComprehendClient, DetectPiiEntitiesCommand } = require('@aws-sdk/client-comprehend');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const _ = require('lodash');

const comprehend = new ComprehendClient(customSdkConfig('C022', { region }));

function filter_comprehend_pii(text) {
    if (process.env.ENABLE_REDACTING_WITH_COMPREHEND !== 'true') {
        return text;
    }
    if (!process.env.found_comprehend_pii) {
        return text;
    }

    const regex = process.env.found_comprehend_pii.split(',').map((pii) => `(${pii})`).join('|');

    const re = new RegExp(regex, 'g');
    return text.replace(re, 'XXXXXX');
}

function filter(text) {
    if (process.env.DISABLECLOUDWATCHLOGGING === 'true') {
        return 'cloudwatch logging disabled';
    }

    if (text === undefined) {
        return '';
    }

    // always redact jwts
    if (typeof text === 'object') {
        text = JSON.stringify(text);
    } else if (typeof text !== 'string') {
        text = String(text);
    }

    text = text.replace(/"accesstokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"accesstokenjwt":"<token redacted>"'); // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
    text = text.replace(/"idtokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"idtokenjwt":"<token redacted>"');  // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
    text = text.replace(/"refreshtoken":\s*"[^"]+?([^\/"]+)"/g, '"refreshtoken":"<token redacted>"');  // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
    text = text.replace(/"Token":\s*"[^"]+?([^\/"]+)"/g, '"Token":"<token redacted>"');  // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
    text = filter_comprehend_pii(text);

    if (process.env.QNAREDACT === 'true') {
        if (process.env.REDACTING_REGEX) {
            const re = new RegExp(process.env.REDACTING_REGEX, 'g');
            text = text.replace(re, 'XXXXXX');
        }
    }
    return text;
}

async function isPIIDetected(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score = 0.99) {
    try {
        const detectionResult = await _detectPii(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score);
        // Ugly hack to prevent Comprehend PII Detection from being called twice unnecessarily
        if (detectionResult?.comprehendResult) {
            process.env.comprehendResult = JSON.stringify(detectionResult.comprehendResult);
        }
        return detectionResult.pii_detected;
    } catch (e) {
        console.warn('Error calling Amazon Comprehend ', e);
        return false;
    }
}

async function setPIIRedactionEnvironmentVars(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score = 0.99) {
    try {
        const detectionResult = await _detectPii(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score);
        // Ugly hack to prevent Comprehend PII Detection from being called twice unnecessarily
        if (detectionResult && detectionResult.comprehendResult) {
            process.env.comprehendResult = JSON.stringify(detectionResult.comprehendResult);
        }
        process.env.found_comprehend_pii = _.get(detectionResult, 'foundPII', '');
    } catch (e) {
        console.warn('Warning: Exception while trying to detect PII with Comprehend. All logging is disabled.');
        console.warn('Exception ', e);
        // if there is an error during Comprehend PII detection, turn off all logging for this request
        process.env.DISABLECLOUDWATCHLOGGING = true;
    }
}

async function _getPIIEntities(params) {
    if (process.env.comprehendResult) {
        try {
            return JSON.parse(process.env.comprehendResult);
        } catch (e) {
            console.warn("No environment variable found for comprehendResult");
            return { Entities: [] };
        }
    }
    const detectPiiEntitiesCmd = new DetectPiiEntitiesCommand(params);
    const comprehendResult = await comprehend.send(detectPiiEntitiesCmd);
    return comprehendResult;
}

function filterFoundEntities(comprehendResult, entity_allow_list, comprehend_confidence_score) {
    return comprehendResult.Entities.filter((entity) => entity.Score >= comprehend_confidence_score && entity_allow_list.indexOf(entity.Type.toLowerCase()) != -1);
}

async function _detectPii(text, useComprehendForPII, piiRegex, pii_rejection_entity_types, pii_confidence_score = 0.99) {
    let found_redacted_pii = false;
    if (piiRegex) {
        const re = new RegExp(piiRegex, 'g');
        const redacted_text = text.replace(re, 'XXXXXX');
        found_redacted_pii = redacted_text != text;
    } else {
        console.log('Warning: No value found for setting  PII_REJECTION_REGEX not using REGEX Matching');
    }
    if (useComprehendForPII) {
        const params = {
            LanguageCode: 'en',
            Text: text,
        };
        const comprehendResult = await _getPIIEntities(params);
        if (!('Entities' in comprehendResult) || comprehendResult.Entities.length == 0) {
            console.log('No PII found by Comprehend');
            return {
                pii_detected: false,
                comprehendResult,
            };
        }
        const foundPII = comprehendResult.Entities.map((entity) => text.slice(entity.BeginOffset, entity.EndOffset));
        const foundEntities = filterFoundEntities(comprehendResult, pii_rejection_entity_types.toLowerCase().split(','), pii_confidence_score);
        return {
            pii_detected: foundEntities.length != 0 || found_redacted_pii,
            comprehendResult,
            foundPII,
        };
    }
    return {
        pii_detected: false,
        comprehendResult: null,
        foundPII: null,
    };
}

module.exports = {
    log(...messages) {
        console.log(messages.map((message) => filter(message)).join(' '));
    },
    warn(...messages) {
        console.warn(messages.map((message) => filter(message)).join(' '));
    },
    error(...messages) {
        console.error(messages.map((message) => filter(message)).join(' '));
    },
    debug(...messages) {
        if (process.env.ENABLE_DEBUG_LOGGING == 'true') {
            console.debug(messages.map((message) => filter(message)).join(' '));
        }
    },
    redact_text: filter,
    filter_comprehend_pii,
    isPIIDetected,
    setPIIRedactionEnvironmentVars,
};
