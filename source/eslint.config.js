const js = require('@eslint/js');
const pluginVue = require('eslint-plugin-vue');
const pluginVuePug = require('eslint-plugin-vue-pug');
const pluginImport = require('eslint-plugin-import');
const pluginPrettier = require('eslint-plugin-prettier/recommended');
const configPrettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: [
            '**/node_modules/**',
            '**/tmp/**',
            '**/dist/**',
            '**/build/**',
            '**/test/**',
            '**/tests/**',
            '**/coverage/**',
            '**/*.config.js',
            '**/*.eslint*',
            '**/bin/**',
            '**/assets/**',
            '**/__tests__/**'
        ]
    },
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    configPrettier,
    pluginPrettier,
    {
        plugins: {
            'vue-pug': pluginVuePug,
            import: pluginImport
        },
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                global: 'readonly'
            }
        },
        rules: {
            // Original rules from .eslintrc.js
            indent: ['warn', 4],
            quotes: ['warn', 'single'],
            'vue/no-deprecated-slot-attribute': 'off',

            // Vue-pug rules
            'vue-pug/no-parsing-error': 'error',

            // Key airbnb-base style rules for consistency
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error',
            'object-shorthand': ['error', 'always'],
            'prefer-template': 'error',
            'prefer-arrow-callback': 'error',
            'arrow-body-style': ['error', 'as-needed'],
            'no-param-reassign': ['error', { props: false }],
            'no-shadow': 'error',
            'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],

            // Import rules (from airbnb-base)
            'import/no-unresolved': 'off',
            'import/extensions': 'off',
            'import/prefer-default-export': 'off',
            'import/no-extraneous-dependencies': 'off'
        }
    }
];
