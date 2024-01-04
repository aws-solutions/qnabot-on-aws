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

module.exports = {
    testEnvironment: 'node',
    testMatch: ['test/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    collectCoverage: true,
    collectCoverageFrom: ['**/*.js', '!jest.config.js', '!test/*.js', '!coverage/**/*.js'],
    coverageReporters: ['text', ['lcov', { projectRoot: '../../' }]],
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