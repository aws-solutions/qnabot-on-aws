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