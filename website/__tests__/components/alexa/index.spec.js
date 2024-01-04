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
import alexaModule from '../../../js/components/alexa/index.vue';
import { shallowMount } from '@vue/test-utils';

describe('alexa index component', () => {
    let store;
    let wrapper;

    beforeEach(() => {
        jest.resetAllMocks();
        store = {
            dispatch: jest.fn().mockImplementation(() => {
                return Promise.resolve({ result: {} });
            }),
            state: {
                bot: {
                    LambdaArn: 'some-lambda-arn'
                }
            }
        };

        wrapper = shallowMount(alexaModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
    });

    test('should mount', () => {

        expect(wrapper.exists()).toBe(true);
        expect(store.dispatch).toHaveBeenCalledTimes(1);
        expect(store.dispatch).toHaveBeenCalledWith('data/botinfo');
    });
});
