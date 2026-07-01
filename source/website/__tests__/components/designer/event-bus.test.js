/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { EventBus } from '../../../js/components/designer/event-bus.js';

describe('designer event bus', () => {
    test('event bus', () => {
        expect(EventBus).toBeDefined();
    });
});
