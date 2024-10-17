/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');

// use DEFAULT_SETTINGS_PARAM as random encryption key unique to this QnABot installation
const key = _.get(process.env, 'DEFAULT_SETTINGS_PARAM', 'fdsjhf98fd98fjh9 du98fjfd 8ud8fjdf');
const encryptor = require('simple-encryptor')(key);

exports.encryptor = encryptor;
