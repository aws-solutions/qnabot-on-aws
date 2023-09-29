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

const aws = require('./util/aws');

const lambda = new aws.Lambda();

module.exports = class LambdaVersion extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        lambda.publishVersion({
            FunctionName: params.FunctionName,
        }).promise()
            .tap(console.log)
            .then((result) => reply(null, result.Version, { Version: result.Version }))
            .catch(reply);
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }
};
