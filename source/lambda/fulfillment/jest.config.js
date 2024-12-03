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
    moduleNameMapper: {
        "../../../../../../../../../../opt/lib/query.js": "<rootDir>/test/lib/middleware/__mocks__/esQueryMock.js",
        "../../../../../../../../../../opt/lib/supportedLanguages": "<rootDir>/../es-proxy-layer/lib/supportedLanguages.js",
        "../../../../../../../../../../opt/lib/fulfillment-event/utterance": "<rootDir>/../es-proxy-layer/lib/fulfillment-event/utterance.js"
      },
    modulePaths: [
        "<rootDir>/../qnabot-common-layer/",
        "<rootDir>/../aws-sdk-layer/"
    ]
};