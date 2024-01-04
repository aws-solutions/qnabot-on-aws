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

module.exports = function (App) {
    App.$validator.extend('json', {
        getMessage: (field) => 'invalid json',
        validate(value) {
            try {
                const card = JSON.parse(value);
                const v = new (require('jsonschema').Validator)();
                const { valid } = v.validate(card, require('./store/api/card-schema.json'));
                return valid;
            } catch (e) {
                return false;
            }
        },
    });

    App.$validator.extend('optional', {
        getMessage: (field) => 'invalid characters',
        validate(value) {
            try {
                return !!value.match(/.*/);
            } catch (e) {
                return false;
            }
        },
    });
};
