/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    bot: require('./bot/test'),
    error: require('./error/test'),
    health: require('./health/test'),
    qa: require('./qa/test'),
    root: require('./root/test'),
    examples: require('./examples'),
    jobs: require('./jobs'),
    services: require('./services'),
};
