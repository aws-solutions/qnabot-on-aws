/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, it, expect } from 'vitest';
import mutations from '../../../../js/lib/store/user/mutations';

describe('user/mutations', () => {
    it('credentials sets loggedin and credentials on state', () => {
        const state = { loggedin: false, credentials: null };
        const payload = { accessKeyId: 'key', secretAccessKey: 'secret' };
        mutations.credentials(state, payload);
        expect(state.loggedin).toBe(true);
        expect(state.credentials).toEqual(payload);
    });

    it('login sets loggedIn on state', () => {
        const state = { loggedIn: false };
        mutations.login(state);
        expect(state.loggedIn).toBe(true);
    });

    it('setId sets Id on state', () => {
        const state = { Id: null };
        mutations.setId(state, 'user-123');
        expect(state.Id).toBe('user-123');
    });
});
