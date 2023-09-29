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
const qnabot = require('qnabot/logging');

module.exports = class router {
    constructor() {
        this.middleware = [];
    }

    async start(event, callback) {
        qnabot.debug(`Request:${JSON.stringify(event, null, 2)}`);
        try {
            const res = await this._walk({ _event: event });
            qnabot.log('final:', JSON.stringify(res, null, 2));
            callback(null, res);
        } catch (e) {
            qnabot.log('throwing response:', JSON.stringify(e));
            if (e.action === 'END') {
                callback(null);
            } else if (e.action === 'RESPOND') {
                callback(null, e.message);
            } else {
                callback(e);
            }
        }
    }

    async _walk(req, res = {}, index = 0) {
        qnabot.debug(JSON.stringify({ req, res }, null, 2));

        if (this.middleware[index]) {
            qnabot.log(`middleware=${this.middleware[index].name}`);
            const result = await this.middleware[index](req, res);
            return await this._walk(result.req, result.res, ++index);
        }
        return _.get(res, 'out', res);
    }

    add(fnc) {
        this.middleware.push(fnc);
    }
};
