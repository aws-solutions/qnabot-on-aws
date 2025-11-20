/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const cfnLambda = require('cfn-lambda');
const _ = require('lodash');
const response = require('./lib/util/response');

exports.handler = function (event, context, cb) {
    dispatch(event, context, cb);
};

const targets = {
    ApiDeployment: require('./lib/ApiDeployment'),
    ModelAccess: require('./lib/ModelAccess'),
    CognitoDomain: require('./lib/CognitoDomain'),
    CognitoLogin: require('./lib/CognitoLogin'),
    CognitoRole: require('./lib/CognitoRole'),
    CognitoUrl: require('./lib/CognitoUrl'),
    ESCognitoClient: require('./lib/ESCognitoClient'),
    LambdaVersion: require('./lib/LambdaVersion'),
    OpenSearchDashboards: require('./lib/base'), // OpenSearchDashboards custom resource deprecated.. preserve entry here to avoid resource delete failure on stack upgrade.
    PostUpgradeImport: require('./lib/PostUpgradeImport'),
    PreUpgradeExport: require('./lib/PreUpgradeExport'),
    S3Lambda: require('./lib/S3Lambda'),
    S3Unzip: require('./lib/S3Unzip'),
    S3Version: require('./lib/S3Version'),
    Variable: require('./lib/Variable'),
    OpenSearchUpdates: require('./lib/OpenSearchUpdates'),
    SettingsInitializer: require('./lib/SettingsInitializer')
};
const Lex = require('./lib/lex');

function dispatch(event, context, cb) {
    console.log('event', JSON.stringify(event, null, 2));
    const type = event.ResourceType.match(/Custom::(.*)/);
    const Lextype = event.ResourceType.match(/Custom::Lex(Bot|Alias|SlotType|Intent)/);
    if (_.get(Lextype, 1) === 'Alias') Lextype[1] = 'BotAlias';
    console.log("Targets: ", targets[type[1]]);

    if (Lextype) {
        /* change to fix 4.4.0 installs where QNAPin and QNAPinNoConfirm elicit response bots inadvertently included a
         * bad character in clarificationPrompt and rejectionStatement which would break further updates.
        */
        if (_.has(event, 'OldResourceProperties.clarificationPrompt.messages[0].content')) {
            let v = _.get(event, 'OldResourceProperties.clarificationPrompt.messages[0].content', '');
            if (v.includes('I’m')) {
                console.log('found bad apostrophe and replacing');
                v = v.replace('I’m', 'I\'m');
                _.set(event, 'OldResourceProperties.clarificationPrompt.messages[0].content', v);
            }
        }
        if (_.has(event, 'OldResourceProperties.rejectionStatement.messages[0].content')) {
            let v = _.get(event, 'OldResourceProperties.rejectionStatement.messages[0].content', '');
            if (v.includes('I’m')) {
                console.log('found bad apostrophe and replacing');
                v = v.replace('I’m', 'I\'m');
                _.set(event, 'OldResourceProperties.rejectionStatement.messages[0].content', v);
            }
        }
        cfnLambda(new Lex(Lextype[1]))(event, context, cb);
    } else if (targets[type[1]]) {
        return cfnLambda(new targets[type[1]]())(event, context, cb);
    } else {
        response.send({
            event,
            context,
            reason: `Invalid resource type:${event.ResourceType}`,
            responseStatus: response.FAILED,
        })
            .then(() => cb(`Invalid resource type:${event.ResourceType}`))
            .catch(cb);
    }
}
