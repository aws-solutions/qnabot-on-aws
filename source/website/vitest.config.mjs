/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { defineConfig, mergeConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';
import viteConfig from './vite.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            // Enable global test APIs (describe, it, expect, etc.)
            globals: true,
            
            // Use jsdom environment for DOM testing
            environment: 'jsdom',
            
            // Setup files
            setupFiles: ['./__tests__/setup.js'],
            
            // Test file patterns
            include: [
                '**/__tests__/**/*.test.js',
                '**/__tests__/**/*.spec.js',
            ],
            
            // Exclude patterns - be specific to avoid excluding test directories
            exclude: [
                '**/node_modules/**',
                'build/**',
                '**/dist/**',
            ],
            
            // Coverage configuration
            coverage: {
                provider: 'v8',
                reporter: ['text', 'html', 'lcov'],
                reportsDirectory: '../test/coverage-reports/jest/website',
                // Set the base path for coverage to match SonarQube expectations
                // This ensures paths in lcov.info are relative to project root
                all: true,
                include: [
                    'js/**/*.js',
                    'js/**/*.vue',
                ],
                exclude: [
                    '**/jest.config.js',
                    '**/__tests__/**/*.js',
                    '**/test/*.js',
                    '**/test.js',
                    '**/coverage/**/*.js',
                    'build/**/*.js',
                    '**/config/**/*',
                    '**/assets/**/*',
                    '**/*.json',
                    '**/empty-module.js',
                    'js/lib/index.js', // Re-export barrel file
                    'js/lib/store/index.js', // Vuex store wiring
                    'js/lib/store/user/index.js', // Vuex module wiring
                    'js/lib/store/page/index.js', // Vuex module wiring
                    'js/lib/store/data/index.js', // Vuex module wiring
                    'js/lib/store/api/index.js', // Vuex module wiring
                    '**/steps.js', // Exclude step definition files (mostly data)
                    '**/getters.js', // Exclude empty getters files
                    'js/browser-check.js', // Browser detection entry point
                    'js/client.js', // Client app entry point
                    'js/admin.js', // Admin app entry point
                    'js/lib/schemas/*.js', // JSON schema definitions (data only)
                    'js/lib/router.js', // Router configuration (tested via integration)
                    'js/lib/validator.js', // Validator wrapper (thin wrapper around library)
                    'js/lib/store/api/actions/tmp.js', // Temporary development file
                    // Thin wiring files — no testable logic
                    'js/lib/store/api/actions/connect.js', // Single dispatch call
                    'js/lib/store/api/actions/genesys.js', // Single dispatch call
                    'js/lib/store/data/actions/index.js', // Re-export barrel file
                    'js/components/designer/event-bus.js', // createApp({}) — no logic
                    'js/components/hooks/example.js', // Test fixture data, not production code
                    // Simple state setters — no conditional logic
                    // Coverage debt: page/mutations.js and store/mutations.js contain branching
                    // logic (toggleMode loop/conditionals, setBotInfo regex). Tests exist but
                    // vitest v8 does not instrument these via transitive Vuex import — removing
                    // from exclude causes 0% in lcov. Confirmed by targeted run. TODO v7.5.
                    'js/lib/store/page/mutations.js',
                    'js/lib/store/mutations.js',
                    // Thin action dispatchers
                    'js/lib/store/api/actions/kendraIndex.js', // 2-line dispatch wrapper
                    // Utility/helper files
                    'js/capability/util.js', // Single user-agent builder function
                    // Misc
                    'js/components/designer/sanitizeOutput.js', // 2-line re-export
                    'js/components/designer/empty.js', // Component placeholder
                ],
            },
        },
        resolve: {
            alias: {
                'aws-lex-web-ui/dist/lex-web-ui.min.js': new URL('./js/lib/empty-module.js', import.meta.url).pathname,
            },
        },
    })
);
