/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    testEnvironment: 'node',
    testMatch: ['test/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    collectCoverage: true,
    collectCoverageFrom: ['**/*.js', '!jest.config.js', '!test/*.js', '!coverage/**/*.js'],
    coverageReporters: ['text', ['lcov', { projectRoot: '../../../' }]],
    moduleDirectories: ['node_modules', 'nodejs/node_modules','lambda/aws-sdk-layer/node_modules', 'lambda/aws-sdk-layer/nodejs/node_modules'],
    modulePaths: [
        "<rootDir>/../aws-sdk-layer/"
    ]
};