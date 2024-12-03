/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
