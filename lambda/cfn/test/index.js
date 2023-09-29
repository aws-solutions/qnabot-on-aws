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

const lambda = require('./setup.js');

const mock = require('./mock');
const Promise = require('bluebird');
const aws = require('../lib/util/aws');
const api = new aws.APIGateway();
module.exports = {
    setUp: function (cb) {
        cb();
    },
    tearDown: function (cb) {
        cb();
    },
    api: {
        deploy: function (test) {
            const lib = require('../lib/ApiDeployment');
            const params = require('./params/api.deploy');
            const tmp = Promise.promisifyAll(new lib());
            let oldId;
            Promise.join(params.create(), params.update(), params.delete())
                .spread(function (c, u, d) {
                    return tmp
                        .CreateAsync(c.ResourceProperties)
                        .tap(test.ok)
                        .log('Create Complete')
                        .tap((id) => (oldId = id))
                        .then((id) => tmp.UpdateAsync(id, c.ResourceProperties, u.ResourceProperties))
                        .log('Update Complete')
                        .tap(test.ok)
                        .then((id) => tmp.DeleteAsync(oldId, u.ResourceProperties))
                        .log('Delete Complete')
                        .tap(test.ok);
                })
                .catch(test.error)
                .finally(test.done);
        }
    },
    lex: require('./lex'),
    role: function (test) {
        lifecycle(require('./params/role'), test);
    },
    clear: function (test) {
        lifecycle(require('./params/s3-clear'), test, 2);
    },
    version: function (test) {
        lifecycle(require('./params/s3-version'), test);
    },
    unzip: function (test) {
        lifecycle(require('./params/s3-unzip'), test);
    },
    login: function (test) {
        lifecycle(require('./params/login'), test);
    },
    var: function (test) {
        lifecycle(require('./params/var'), test);
    },
    domain: function (test) {
        lifecycle_chain(require('../lib/CognitoDomain'), require('./params/domain'), test);
    },
    url: function (test) {
        lifecycle(require('./params/url'), test);
    }
};

function lifecycle(params, test, expect = 3) {
    test.expect(expect);
    mock.register((status) => test.equal(status, 'SUCCESS'));
    const ser = mock.server(test);

    return lambda(params.create())
        .then(() => lambda(params.update()))
        .then(() => lambda(params.delete()))
        .catch(test.ifError)
        .finally(() => {
            ser.close();
            test.done();
        });
}

function lifecycle_chain(lib, params, test) {
    const tmp = Promise.promisifyAll(new lib());

    Promise.join(params.create(), params.update(), params.delete())
        .spread(function (c, u, d) {
            return tmp
                .CreateAsync(c.ResourceProperties)
                .tap(test.ok)
                .log('Create Complete')
                .then((id) => tmp.UpdateAsync(id, c.ResourceProperties, u.ResourceProperties))
                .log('Update Complete')
                .tap(test.ok)
                .then((id) => tmp.DeleteAsync(id, u.ResourceProperties))
                .log('Delete Complete')
                .tap(test.ok);
        })
        .catch(test.error)
        .finally(test.done);
}

function run(params, test) {
    return lambda(params).tap(test.ok);
}
