/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import indexComponent from '../../../js/components/hooks/index.vue';
import { shallowMount } from '@vue/test-utils';

import handlebars from 'handlebars';

vi.mock('handlebars');

// We are mocking the following files this way to prevent vitest from
// attempting to read the file contents.
vi.mock('../../../js/components/hooks/codepy.txt', () => ({ default: '' }));
vi.mock('../../../js/components/hooks/codejs.txt', () => ({ default: '' }));

describe('index hook component', () => {
    const store = {
        state: {
            bot: ''
        }
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('should render', () => {
        handlebars.compile.mockReturnValue(vi.fn().mockImplementation(() => 'a = b + c'));
        const wrapper = shallowMount(indexComponent, {
            global: {
                mocks: {
                    $store: store,
                },
            }
        });
        expect(wrapper.exists()).toBe(true);
    });
});
