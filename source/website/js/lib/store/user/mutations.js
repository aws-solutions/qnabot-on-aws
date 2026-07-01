/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import _ from 'lodash';
import query from 'query-string';
import jwt from 'jsonwebtoken';

export default {
    credentials(state, payload) {
        state.loggedin = true;
        state.credentials = payload;
    },
    login(state) {
        state.loggedIn = true;
    },
    setId(state, Id) {
        state.Id = Id;
    },
};
