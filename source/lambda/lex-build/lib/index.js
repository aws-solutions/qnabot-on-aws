/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const getQidsandquestions = require('./qidsandquestions');

module.exports = async function (params) {
    const promises = [];
    console.log('Starting Lex V2');
    const qidsandquestions = await getQidsandquestions(params);
    const LexV2Bot = require('./lexv2bot');
    const lexV2 = await LexV2Bot(qidsandquestions);
    promises.push(lexV2);
    await Promise.all(promises);
    console.log('All Done');
    return 1;
};
