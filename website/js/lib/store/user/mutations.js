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
const _ = require('lodash');
const query = require('query-string');
const jwt = require('jsonwebtoken');
const { set } = require('vue');

module.exports = {
    credentials(state, payload) {
        set(state, 'loggedin', true);
        set(state, 'credentials', payload);
    },
    login(state) {
        state.loggedIn = true;
    },
    setId(state, Id) {
        state.Id = Id;
    },
};
