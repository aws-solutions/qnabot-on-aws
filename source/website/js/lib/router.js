/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { createWebHashHistory } from 'vue-router';
import AlexaIndex from '../components/alexa/index.vue';
import ConnectIndex from '../components/connect/index.vue';
import GenesysIndex from '../components/genesys/index.vue';
import HooksIndex from '../components/hooks/index.vue';
import ImportComponent from '../components/import.vue';
import CustomTranslate from '../components/customTranslate.vue';
import KendraIndex from '../components/kendraIndex.vue';
import ExportComponent from '../components/export.vue';
import DesignerIndex from '../components/designer/index.vue';
import LoadingComponent from '../components/loading.vue';
import SettingsComponent from '../components/settings.vue';

export default {
    base: '/',
    history: createWebHashHistory(),
    routes: [
        {
            path: '/alexa',
            name: 'alexa',
            component: AlexaIndex,
        },
        {
            path: '/connect',
            name: 'connect',
            component: ConnectIndex,
        },
        {
            path: '/genesys',
            name: 'genesys',
            component: GenesysIndex,
        },
        {
            path: '/hooks',
            name: 'hooks',
            component: HooksIndex,
        },
        {
            path: '/import',
            name: 'import',
            component: ImportComponent,
        },
        {
            path: '/customTranslate',
            name: 'Import Custom Terminology',
            component: CustomTranslate,
        },
        {
            path: '/kendraIndex',
            name: 'Kendra Web Page Indexing',
            component: KendraIndex,
        },
        {
            path: '/export',
            name: 'export',
            component: ExportComponent,
        },
        {
            path: '/edit',
            name: 'edit',
            component: DesignerIndex,
        },
        {
            path: '/loading',
            component: LoadingComponent,
        },
        {
            path: '/',
            component: LoadingComponent,
        },
        {
            path: '/settings',
            name: 'settings',
            component: SettingsComponent,
        },
    ],
};
