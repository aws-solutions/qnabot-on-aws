/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { Validator } from 'jsonschema';
import axios from 'axios';
import util from './util';
import get from './get.js';
import deleteActions from './delete.js';
import upDownload from './up-download.js';
import add from './add.js';

const validator = new Validator();

export default Object.assign(
    get,
    deleteActions,
    upDownload,
    add,
);
