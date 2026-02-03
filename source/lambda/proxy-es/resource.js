/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.handler = async (event, context) => {
    const cfnResource = require('../../../../../../../../opt/lib/cfn').resource;
    
    return new Promise((resolve, reject) => {
        // Override context.done to resolve our Promise
        context.done = (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        };

        // Call the cfn resource handler
        try {
            cfnResource(event, context);
        } catch (error) {
            reject(error);
        }
    });
};
