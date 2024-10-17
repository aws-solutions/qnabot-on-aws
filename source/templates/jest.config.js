/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

process.env.npm_package_version = "x.x.x"
process.env.npm_package_config_lambdaRuntime = "nodejs"
process.env.npm_package_config_pythonRuntime = "python"

module.exports = {
    testEnvironment: 'node',
    testMatch: ['test/**/*.[jt]s?(x)', '**/(*.)+(spec|test).[jt]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/'],
    collectCoverage: true,
    collectCoverageFrom: ['**/*.js', '!**/jest.config.js', '!**/__tests__/*.js', '!**/test/*.js', '!**/test.js', '!**/coverage/**/*.js'],
    coverageReporters: ['text', ['lcov', { projectRoot: '../../' }]],
    setupFilesAfterEnv: ['./__tests__/setup.js'],
    modulePaths: [
        "<rootDir>/../lambda/aws-sdk-layer/"
    ]
};