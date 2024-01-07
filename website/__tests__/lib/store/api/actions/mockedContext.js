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
const mockedContext = {
    commit: jest.fn(),
    dispatch: jest.fn(),
    rootState: {
        info: {
            _links: {
                connect: {
                    href: '',
                },
                jobs: {
                    href: '',
                },
                genesys: {
                    href: '',
                },
                examples: {
                    href: '',
                },
                translate: {
                    href: '',
                },
                bot: {
                    href: '',
                },
                alexa: {
                    href: '',
                },
                questions: {
                    href: '',
                },
                crawlerV2: {
                    href: '',
                },
                crawler: {
                    href: '',
                },
            },
            CustomQnABotSettings: '',
            DefaultQnABotSettings: '',
            Version: '1.0.0',
            region: 'us-weast',
        },
        user: {
            credentials: 'test-credentials',
        },
        bot: {
            _links: {
                alexa: {
                    href: '',
                },
            },
        },
    },
};
export default mockedContext;
