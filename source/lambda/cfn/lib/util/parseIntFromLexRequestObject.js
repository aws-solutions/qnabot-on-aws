/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// parseIntFromLexRequestObject is a custom parser intended to convert some properties back to integer as per input requirements of Lex modeling service commands
const lexRequestProperties = ['maxAttempts', 'MaxRetries', 'Priority', 'priority', 'groupNumber', 'timeToLiveInSeconds', 'turnsToLive', 'idleSessionTTLInSeconds', 'nluIntentConfidenceThreshold']
const parseIntFromLexRequestObject = (data) => {
    if (Array.isArray(data)) {
        data.forEach(data => parseIntFromLexRequestObject(data));
    } else if (typeof data === 'object') {
		for (let key in data) {
            if (typeof data[key] === 'object' && data[key] !== null) {
                parseIntFromLexRequestObject(data[key]);
            } else if (lexRequestProperties.includes(key)) {
                parse(data, key);
            }
		}
	}
}
const parse = (obj, props) => {
    if (typeof obj[props] === 'string') {
        obj[props] = parseInt(obj[props]);
    }
}
exports.parseIntFromLexRequestObject = parseIntFromLexRequestObject;
