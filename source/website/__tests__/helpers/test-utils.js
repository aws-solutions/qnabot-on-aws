/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { vi } from 'vitest';

/**
 * Creates a mock Vuex store with common state and methods
 */
export function createMockStore(overrides = {}) {
    return {
        state: {
            bot: {
                lambdaArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
                lexV2botname: 'test-bot',
                lexV2localeids: 'en_US',
                ...overrides.bot
            },
            route: { name: '', ...overrides.route },
            error: '',
            user: { name: 'test-user', ...overrides.user },
            info: {
                Version: '1.0.0',
                BuildDate: '2024-01-01',
                StackName: 'test-stack',
                _links: {},
                ...overrides.info
            },
            ...overrides.state
        },
        dispatch: vi.fn(),
        commit: vi.fn(),
        ...overrides
    };
}

/**
 * Creates mock DOM elements commonly used in tests
 */
export function setupDOMMocks() {
    // Mock document.createElement
    global.document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
            return {
                href: '',
                download: '',
                click: vi.fn(),
                style: {}
            };
        }
        return {
            style: {},
            innerText: '',
            innerHTML: ''
        };
    });

    // Mock document.getElementById
    global.document.getElementById = vi.fn((id) => ({
        innerText: '',
        innerHTML: '',
        style: {},
        disabled: false
    }));

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    // Mock sessionStorage
    global.sessionStorage = {
        getItem: vi.fn(() => 'test-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
    };

    // Mock window.location
    delete global.window.location;
    global.window.location = {
        href: 'http://localhost',
        hash: '',
        reload: vi.fn()
    };
}

/**
 * Creates a mock component instance for testing methods without mounting
 */
export function createMockComponent(component, store = null) {
    const mockStore = store || createMockStore();
    return {
        $store: mockStore,
        $nextTick: vi.fn((cb) => Promise.resolve().then(cb)),
        ...component.data(),
        ...component.methods
    };
}

/**
 * Waits for async operations to complete
 */
export function waitForAsync(ms = 50) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock file for file upload tests
 */
export function createMockFile(name = 'test.txt', content = 'test content', type = 'text/plain') {
    return new File([content], name, { type });
}

/**
 * Creates a mock Blob for download tests
 */
export function createMockBlob(content = 'test', type = 'text/plain') {
    return new Blob([content], { type });
}
