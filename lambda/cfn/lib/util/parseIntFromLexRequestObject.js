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
