/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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
