/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class Meta extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = {
            max_gen_len: 512,
            temperature: 0,
            top_p: 0.9,
        };
    }

    getResponseBody(response) {
        const body = this.parseResponseBody(response);
        return body.generation;
    }
}
exports.Meta = Meta;
