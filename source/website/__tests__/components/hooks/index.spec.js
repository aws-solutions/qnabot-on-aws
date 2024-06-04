/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
import indexComponent from '../../../js/components/hooks/index.vue';
import { shallowMount } from '@vue/test-utils';

const handlebars = require('handlebars');

jest.mock('handlebars');

// We are mocking the following files this way to prevent jest from
// attempting to read the file contents.
jest.mock('../../../js/components/hooks/codepy.txt', () => jest.fn());
jest.mock('../../../js/components/hooks/codejs.txt', () => jest.fn());

describe('index hook component', () => {
    const store = {
        state: {
            bot: ''
        }
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('should render', () => {
        handlebars.compile.mockReturnValue(jest.fn().mockImplementation(() => 'a = b + c'));
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
