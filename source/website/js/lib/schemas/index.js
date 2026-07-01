/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// Bundled schema definitions - fallback for when API Gateway OPTIONS returns 204
// These schemas match the Lambda schema definitions in source/lambda/schema/

import qna from './qna.js';
import text from './text.js';
import quiz from './quiz.js';
import slottype from './slottype.js';

export default {
    qna,
    text,
    quiz,
    slottype
};
