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
    coverageReporters: ['text', ['lcov', { projectRoot: '../../../' }]],
    moduleDirectories: ['node_modules', 'nodejs/node_modules','lambda/aws-sdk-layer/node_modules', 'lambda/aws-sdk-layer/nodejs/node_modules'],
    modulePaths: [
        "<rootDir>/../aws-sdk-layer/"
    ]
};