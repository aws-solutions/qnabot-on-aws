/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import actions from '../../../js/lib/store/actions.js';
import axios from 'axios';

vi.mock('axios');

describe('store/actions', () => {
    let context;
    let originalEnv;

    beforeEach(() => {
        context = {
            commit: vi.fn(),
        };
        originalEnv = { ...import.meta.env };
        
        // Mock window.location
        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            writable: true,
            value: {
                href: 'https://example.com/index.html',
                origin: 'https://example.com',
                pathname: '/index.html',
            },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        Object.keys(originalEnv).forEach(key => {
            import.meta.env[key] = originalEnv[key];
        });
    });

    describe('bootstrap', () => {
        test('bootstraps in production mode with api-stage header', async () => {
            const mockData = {
                _links: {
                    DesignerLogin: { href: 'https://example.com/login' },
                    ClientLogin: { href: 'https://example.com/client' },
                },
                ClientIdDesigner: 'test-client-id',
            };

            axios.head.mockResolvedValue({
                headers: { 'api-stage': 'prod' },
            });
            axios.get.mockResolvedValue({ data: mockData });

            import.meta.env.DEV = false;

            await actions.bootstrap(context);

            expect(axios.head).toHaveBeenCalledWith('https://example.com/index.html');
            expect(axios.get).toHaveBeenCalledWith('/prod');
            expect(context.commit).toHaveBeenCalledWith('info', expect.objectContaining({
                stage: 'prod',
                _links: mockData._links,
            }));
        });

        test('bootstraps in development mode with proxy', async () => {
            const mockData = {
                _links: {
                    DesignerLogin: { href: 'https://api.example.com/dev/login' },
                    Questions: { href: 'https://api.example.com/dev/questions' },
                    CognitoEndpoint: { href: 'https://cognito.example.com' },
                },
                ClientIdDesigner: 'test-client-id',
            };

            axios.get.mockResolvedValue({ data: mockData });

            import.meta.env.DEV = true;
            import.meta.env.VITE_PROXY_STAGE = 'dev';

            await actions.bootstrap(context);

            expect(axios.get).toHaveBeenCalledWith('/dev');
            expect(context.commit).toHaveBeenCalledWith('info', expect.objectContaining({
                stage: 'dev',
            }));
        });

        test('converts API URLs to relative in development mode', async () => {
            const mockData = {
                _links: {
                    Questions: { href: 'https://api.example.com/dev/questions' },
                    Settings: { href: 'https://api.example.com/dev/settings' },
                    CognitoEndpoint: { href: 'https://cognito.example.com' },
                    OpenSearchDashboards: { href: 'https://opensearch.example.com' },
                },
            };

            axios.get.mockResolvedValue({ data: mockData });

            import.meta.env.DEV = true;
            import.meta.env.VITE_PROXY_STAGE = 'dev';

            await actions.bootstrap(context);

            const committedData = context.commit.mock.calls[0][1];
            expect(committedData._links.Questions.href).toBe('/questions');
            expect(committedData._links.Settings.href).toBe('/settings');
            // External services should not be converted
            expect(committedData._links.CognitoEndpoint.href).toBe('https://cognito.example.com');
            expect(committedData._links.OpenSearchDashboards.href).toBe('https://opensearch.example.com');
        });

        test('constructs Cognito login URL in development mode', async () => {
            const mockData = {
                _links: {
                    CognitoEndpoint: { href: 'https://cognito.example.com' },
                    DesignerLogin: { href: 'https://old-login.example.com' },
                },
                ClientIdDesigner: 'test-client-id',
            };

            axios.get.mockResolvedValue({ data: mockData });

            import.meta.env.DEV = true;
            import.meta.env.VITE_PROXY_STAGE = 'dev';

            await actions.bootstrap(context);

            const committedData = context.commit.mock.calls[0][1];
            expect(committedData._links.DesignerLogin.href).toContain('https://cognito.example.com/login');
            expect(committedData._links.DesignerLogin.href).toContain('client_id=test-client-id');
            expect(committedData._links.DesignerLogin.href).toContain('response_type=code');
        });

        test('throws error when api-stage header is missing in production', async () => {
            axios.head.mockResolvedValue({
                headers: {},
            });

            import.meta.env.DEV = false;

            await expect(actions.bootstrap(context)).rejects.toThrow('api-stage header not found');
        });

        test('handles axios errors gracefully', async () => {
            axios.head.mockRejectedValue(new Error('Network error'));

            import.meta.env.DEV = false;

            await expect(actions.bootstrap(context)).rejects.toThrow('Network error');
        });
    });
});
