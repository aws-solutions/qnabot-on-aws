/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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
