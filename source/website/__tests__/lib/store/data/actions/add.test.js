/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import actions from '../../../../../js/lib/store/data/actions/add.js';
import { createMockStore } from '../../../../helpers/test-utils.js';

// Mock lodash
vi.mock('lodash', () => ({
    default: {
        omit: vi.fn((obj, keys) => {
            const result = { ...obj };
            keys.forEach(key => delete result[key]);
            return result;
        })
    }
}));

// Mock util module
vi.mock('../../../../../js/lib/store/data/actions/util', () => ({
    default: {
        api: vi.fn(),
        handle: vi.fn(() => vi.fn())
    }
}));

import util from '../../../../../js/lib/store/data/actions/util';

describe('data/actions/add', () => {
    let context;

    beforeEach(() => {
        vi.clearAllMocks();
        const mockStore = createMockStore();
        context = {
            ...mockStore,
            rootState: {
                ...mockStore.state,
                bot: {
                    status: '',
                    build: {
                        message: '',
                        token: '',
                        status: ''
                    }
                }
            }
        };
    });

    describe('build', () => {
        it('should successfully build when bot is READY', async () => {
            const buildToken = 'test-token-123';
            
            // Mock botinfo calls
            util.api
                .mockResolvedValueOnce({ status: 'READY' }) // Initial check
                .mockResolvedValueOnce({ token: buildToken }) // Build call
                .mockResolvedValueOnce({ // First status check
                    build: {
                        token: buildToken,
                        status: 'READY',
                        message: 'Build complete'
                    }
                });

            await actions.build(context);

            expect(context.rootState.bot.status).toBe('READY');
            expect(context.rootState.bot.build.token).toBe(buildToken);
            expect(util.api).toHaveBeenCalledTimes(3);
        });

        it('should reject if bot is already BUILDING', async () => {
            util.api.mockResolvedValueOnce({ status: 'BUILDING' });

            await actions.build(context);

            expect(util.api).toHaveBeenCalledTimes(1);
        });

        it('should reject if bot is in invalid state', async () => {
            util.api.mockResolvedValueOnce({ status: 'INVALID' });

            await expect(actions.build(context)).rejects.toMatch('cannot build, bot in state INVALID');
        });

        it('should handle build failure', async () => {
            const buildToken = 'test-token-456';
            
            util.api
                .mockResolvedValueOnce({ status: 'READY' })
                .mockResolvedValueOnce({ token: buildToken })
                .mockResolvedValueOnce({
                    build: {
                        token: buildToken,
                        status: 'Failed',
                        message: 'Build error occurred'
                    }
                });

            await expect(actions.build(context)).rejects.toMatch('build failed:Build error occurred');
        });

        it('should wait for token to match', async () => {
            const buildToken = 'test-token-abc';
            
            util.api
                .mockResolvedValueOnce({ status: 'READY' })
                .mockResolvedValueOnce({ token: buildToken })
                .mockResolvedValueOnce({
                    build: {
                        token: 'different-token',
                        status: 'BUILDING',
                        message: 'Building...'
                    }
                })
                .mockResolvedValueOnce({
                    build: {
                        token: buildToken,
                        status: 'READY',
                        message: 'Complete'
                    }
                });

            await actions.build(context);

            expect(context.rootState.bot.status).toBe('READY');
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            util.api.mockRejectedValueOnce(error);

            await expect(actions.build(context)).rejects.toThrow('API Error');
            expect(util.handle).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update a QA item', async () => {
            const qa = {
                qid: 'test.001',
                q: ['test question'],
                a: 'test answer',
                select: true,
                _score: 0.95
            };

            util.api.mockResolvedValueOnce({ success: true });

            await actions.update(context, qa);

            expect(util.api).toHaveBeenCalledWith(
                context,
                'update',
                expect.objectContaining({
                    qid: 'test.001',
                    q: ['test question'],
                    a: 'test answer'
                })
            );
            expect(util.api).toHaveBeenCalledWith(
                context,
                'update',
                expect.not.objectContaining({
                    select: expect.anything(),
                    _score: expect.anything()
                })
            );
        });

        it('should trim string values', async () => {
            const qa = {
                qid: '  test.002  ',
                q: ['  question with spaces  '],
                a: '  answer with spaces  '
            };

            util.api.mockResolvedValueOnce({ success: true });

            await actions.update(context, qa);

            const callArgs = util.api.mock.calls[0][2];
            expect(callArgs.qid).toBe('test.002');
            expect(callArgs.q[0]).toBe('question with spaces');
            expect(callArgs.a).toBe('answer with spaces');
        });
    });

    describe('add', () => {
        it('should add a new QA item', async () => {
            const qa = {
                qid: 'test.003',
                q: ['new question'],
                a: 'new answer'
            };

            util.api.mockResolvedValueOnce({ success: true });

            await actions.add(context, qa);

            expect(util.api).toHaveBeenCalledWith(context, 'update', expect.objectContaining(qa));
            expect(context.commit).toHaveBeenCalledWith('page/incrementTotal', null, { root: true });
        });

        it('should trim nested string values', async () => {
            const qa = {
                qid: 'test.004',
                q: ['  question  '],
                nested: {
                    field: '  value  ',
                    array: ['  item1  ', '  item2  ']
                }
            };

            util.api.mockResolvedValueOnce({ success: true });

            await actions.add(context, qa);

            const callArgs = util.api.mock.calls[0][2];
            expect(callArgs.nested.field).toBe('value');
            expect(callArgs.nested.array[0]).toBe('item1');
            expect(callArgs.nested.array[1]).toBe('item2');
        });
    });
});
