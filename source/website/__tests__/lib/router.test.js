/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import routerConfig from '../../js/lib/router.js';

describe('router', () => {
    test('exports router configuration', () => {
        expect(routerConfig).toBeDefined();
        expect(routerConfig.routes).toBeDefined();
    });

    test('has correct base path', () => {
        expect(routerConfig.base).toBe('/');
    });

    test('has history configuration', () => {
        expect(routerConfig.history).toBeDefined();
    });

    test('routes array is defined and not empty', () => {
        expect(Array.isArray(routerConfig.routes)).toBe(true);
        expect(routerConfig.routes.length).toBeGreaterThan(0);
    });

    test('has alexa route', () => {
        const alexaRoute = routerConfig.routes.find(r => r.path === '/alexa');
        expect(alexaRoute).toBeDefined();
        expect(alexaRoute.name).toBe('alexa');
        expect(alexaRoute.component).toBeDefined();
    });

    test('has connect route', () => {
        const connectRoute = routerConfig.routes.find(r => r.path === '/connect');
        expect(connectRoute).toBeDefined();
        expect(connectRoute.name).toBe('connect');
    });

    test('has genesys route', () => {
        const genesysRoute = routerConfig.routes.find(r => r.path === '/genesys');
        expect(genesysRoute).toBeDefined();
        expect(genesysRoute.name).toBe('genesys');
    });

    test('has hooks route', () => {
        const hooksRoute = routerConfig.routes.find(r => r.path === '/hooks');
        expect(hooksRoute).toBeDefined();
        expect(hooksRoute.name).toBe('hooks');
    });

    test('has import route', () => {
        const importRoute = routerConfig.routes.find(r => r.path === '/import');
        expect(importRoute).toBeDefined();
        expect(importRoute.name).toBe('import');
    });

    test('has customTranslate route', () => {
        const customTranslateRoute = routerConfig.routes.find(r => r.path === '/customTranslate');
        expect(customTranslateRoute).toBeDefined();
        expect(customTranslateRoute.name).toBe('Import Custom Terminology');
    });

    test('has kendraIndex route', () => {
        const kendraRoute = routerConfig.routes.find(r => r.path === '/kendraIndex');
        expect(kendraRoute).toBeDefined();
        expect(kendraRoute.name).toBe('Kendra Web Page Indexing');
    });

    test('has export route', () => {
        const exportRoute = routerConfig.routes.find(r => r.path === '/export');
        expect(exportRoute).toBeDefined();
        expect(exportRoute.name).toBe('export');
    });

    test('has edit route', () => {
        const editRoute = routerConfig.routes.find(r => r.path === '/edit');
        expect(editRoute).toBeDefined();
        expect(editRoute.name).toBe('edit');
    });

    test('has settings route', () => {
        const settingsRoute = routerConfig.routes.find(r => r.path === '/settings');
        expect(settingsRoute).toBeDefined();
        expect(settingsRoute.name).toBe('settings');
    });

    test('has loading route', () => {
        const loadingRoute = routerConfig.routes.find(r => r.path === '/loading');
        expect(loadingRoute).toBeDefined();
        expect(loadingRoute.component).toBeDefined();
    });

    test('has root route', () => {
        const rootRoute = routerConfig.routes.find(r => r.path === '/');
        expect(rootRoute).toBeDefined();
        expect(rootRoute.component).toBeDefined();
    });

    test('all routes have components', () => {
        routerConfig.routes.forEach(route => {
            expect(route.component).toBeDefined();
        });
    });
});
