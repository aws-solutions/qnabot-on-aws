/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

exports.handler = function (event, context, cb) {
    const today = new Date();
    const curHr = (today.getHours() - 8 + 24) % 24;
    let message;

    console.log(JSON.stringify(event, null, 2));
    if (curHr < 12) {
        message = 'good morning, ';
    } else if (curHr < 18) {
        message = 'good afternoon, ';
    } else {
        message = 'good evening, ';
    }
    event.res.message = message + event.res.message;
    cb(null, event);
};
