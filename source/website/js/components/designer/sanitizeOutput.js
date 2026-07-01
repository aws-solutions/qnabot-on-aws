/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// Mirrors source/lambda/es-proxy-layer/lib/sanitizeOutput.js
// To add custom tags or attributes, update BOTH this file and the Lambda version.
import sanitizeHtml from 'sanitize-html';

// Sanitize outputs to prevent malicious attacks
export function sanitize(data) {
    const sanitizeParams = {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['question', 'references', 'chatHistory', 'followUpMessage', 'details', 'summary', 'img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, a: ['href'], p: ['style'], span: ['translate'] },
        allowedStyles: {
            p: { 'white-space': [/^pre-line$/] },
        },
        allowedSchemesByTag: {
            img: ['https', 'data'],
            a: ['http', 'https', 'mailto', 'tel'],
        },
    };
    return sanitizeHtml(data, sanitizeParams);
}
