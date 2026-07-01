/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { Validator } from 'jsonschema';
import cardSchema from './store/api/card-schema.json';

export default function (App) {
    App.$validator.extend('json', {
        getMessage: (field) => 'invalid json',
        validate(value) {
            try {
                const card = JSON.parse(value);
                const v = new Validator();
                const { valid } = v.validate(card, cardSchema);
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
}
