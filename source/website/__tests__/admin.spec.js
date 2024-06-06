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
import adminModule from '../js/admin.vue';
import { shallowMount } from '@vue/test-utils';

describe('js admin module', () => {
    test('mounted', () => {
        const wrapper = shallowMount(adminModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('computed methods', () => {
        const store = {
            state: {
                route: {
                    name: 'test-name',
                },
                error: 'no-error',
                user: {
                    name: 'test-username',
                },
                info: {
                    Version: '1.0.0',
                    BuildDate: 'test-date',
                    _links: {
                        DesignerLogin: {
                            href: 'test-href1',
                        },
                        ClientLogin: {
                            href: 'test-href2',
                        },
                        OpenSearchDashboards: {
                            href: 'test-href3',
                        },
                    },
                },
            },
        };

        const wrapper = shallowMount(adminModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        const expectedPages = [{
            title: 'Edit',
            id: 'edit',
            subTitle: 'Edit questions and simulate responses',
            icon: 'mode_edit',
            href: '#/edit',
        }, {
            title: 'Settings',
            id: 'settings',
            subTitle: 'View and Modify QnABot configuration settings',
            icon: 'settings',
            href: '#/settings',
        }, {
            title: 'Import',
            id: 'import',
            subTitle: 'Import new questions',
            icon: 'cloud_upload',
            href: '#/import',
        },
        {
            title: 'Export',
            id: 'export',
            subTitle: 'Download backups of your QnAs',
            icon: 'file_download',
            href: '#/export',
        }, {
            title: 'Import Custom Terminology',
            id: 'customTranslate',
            subTitle: 'Import custom translation terminology',
            icon: 'transform',
            href: '#/customTranslate',
        },
        {
            title: 'Kendra Web Crawler',
            id: 'kendraIndexing',
            subTitle: 'Crawl web pages with Kendra',
            icon: 'search',
            href: '#/kendraIndex',
        },
        {
            title: 'Alexa',
            id: 'alexa',
            subTitle: 'Instructions for setting up an Alexa Skill',
            icon: 'info',
            href: '#/alexa',
        },
        {
            title: 'Connect',
            id: 'connect',
            subTitle: 'Instructions for integrating with Connect',
            icon: 'info',
            href: '#/connect',
        },
        {
            title: 'Genesys Cloud',
            id: 'genesys',
            subTitle: 'Instructions for integrating with Genesys Cloud',
            icon: 'info',
            href: '#/genesys',
        },
        {
            title: 'Lambda Hooks',
            id: 'hooks',
            subTitle: 'Instructions for customizing QnABot behavior using AWS Lambda',
            icon: 'info',
            href: '#/hooks',
        }, {
            title: 'QnABot Client',
            id: 'client',
            subTitle: 'Use QnABot to interact with your bot in the browser',
            icon: 'forum',
            target: '_blank',
            href: 'test-href2',
        }, {
            title: 'OpenSearch Dashboards',
            id: 'openSearchDashboard',
            subTitle: 'Analyze ChatBot usage',
            icon: 'show_chart',
            target: '_blank',
            href: 'test-href3',
        }];

        expect(wrapper.vm.page).toEqual('test-name');
        expect(wrapper.vm.error).toEqual('no-error');
        expect(wrapper.vm.username).toEqual('test-username');
        expect(wrapper.vm.Version).toEqual('1.0.0');
        expect(wrapper.vm.BuildDate).toEqual('test-date');
        expect(wrapper.vm.login).toEqual('test-href1');
        expect(wrapper.vm.client).toEqual('test-href2');
        expect(wrapper.vm.pages).toEqual(expectedPages);
    });

    test('logout', () => {
        const store = {
            dispatch: jest.fn(),
        };
        const wrapper = shallowMount(adminModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.logout();
        expect(store.dispatch).toHaveBeenCalledWith('user/logout');
    });
});
