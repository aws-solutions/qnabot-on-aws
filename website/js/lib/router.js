/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

/* eslint-disable global-require */
const { createWebHashHistory } = require('vue-router');

module.exports = {
    base: '/',
    history: createWebHashHistory(),
    routes: [
        {
            path: '/alexa',
            name: 'alexa',
            component: require('../components/alexa/index.vue').default,
        },
        {
            path: '/connect',
            name: 'connect',
            component: require('../components/connect/index.vue').default,
        },
        {
            path: '/genesys',
            name: 'genesys',
            component: require('../components/genesys/index.vue').default,
        },
        {
            path: '/hooks',
            name: 'hooks',
            component: require('../components/hooks/index.vue').default,
        },
        {
            path: '/import',
            name: 'import',
            component: require('../components/import.vue').default,
        },
        {
            path: '/customTranslate',
            name: 'Import Custom Terminology',
            component: require('../components/customTranslate.vue').default,
        },
        {
            path: '/kendraIndex',
            name: 'Kendra Web Page Indexing',
            component: require('../components/kendraIndex.vue').default,
        },
        {
            path: '/export',
            name: 'export',
            component: require('../components/export.vue').default,
        },
        {
            path: '/edit',
            name: 'edit',
            component: require('../components/designer/index.vue').default,
        },
        {
            path: '/loading',
            component: require('../components/loading.vue').default,
        },
        {
            path: '/',
            component: require('../components/loading.vue').default,
        },
        {
            path: '/settings',
            name: 'settings',
            component: require('../components/settings.vue').default,
        },
    ],
};
