/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const eventBus = require('../../../js/components/designer/event-bus');

describe('designer event bus', () => {
    test('event bus', () => {
        expect(eventBus).toBeDefined();
    });
});
