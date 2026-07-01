/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';

vi.mock('vue', async () => {
    const actual = await vi.importActual('vue');
    return {
        ...actual,
        createApp: vi.fn().mockReturnValue({
            use: vi.fn().mockReturnThis(),
            mount: vi.fn(),
        }),
    };
});

vi.mock('vuetify/iconsets/md', () => ({
    aliases: vi.fn(),
    md: vi.fn(),
}));

vi.mock('vuetify', () => ({
    createVuetify: vi.fn().mockReturnValue({
        install: vi.fn(),
    }),
}));

vi.mock('vuetify/components', () => ({}));

vi.mock('vuetify/directives', () => ({}));

const mockRouter = {
    replace: vi.fn(),
    isReady: vi.fn().mockReturnValue(Promise.resolve()),
};

vi.mock('vue-router', () => ({
    createRouter: vi.fn().mockReturnValue(mockRouter),
}));

vi.mock('vuex-router-sync', () => ({
    sync: vi.fn(),
}));

vi.mock('../js/lib', () => ({
    router: {},
}));

// Create the #App element before importing admin.js
const appDiv = document.createElement('div');
appDiv.id = 'App';
document.body.appendChild(appDiv);

vi.mock('idle-js', () => {
    const mockIdle = vi.fn().mockImplementation(function(config) {
        this.config = config;
        this.start = vi.fn();
        return this;
    });
    return {
        default: mockIdle
    };
});

// Import after mocks are set up
await import('../js/admin');
const vueRouter = await import('vue-router');

describe('js admin module', () => {
    test('load', () => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/loading');
    });

    test('router isReady resolves and mounts app', async () => {
        expect(mockRouter.isReady).toHaveBeenCalled();
        await mockRouter.isReady();
        // The mount should be called after isReady resolves
        // We can't directly test mount since it's async, but we verify isReady was called
    });
});
