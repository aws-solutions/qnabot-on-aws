/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const sanitizeHtml = require('sanitize-html');

// Sanitize outputs to prevent malicious attacks
function sanitize(data) {
    const sanitizeParams = {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'question',
            'references',
            'chatHistory',
            'followUpMessage',
            'details',
            'summary',
            'img'
        ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            a: ['href'],
            p: ['style'],
            span: ['translate', 'style']
        },
        allowedStyles: {
            p: { 'white-space': [/^pre-line$/] },
            span: { 'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/] }
        },
        allowedSchemesByTag: {
            img: ['https', 'data'],
            a: ['http', 'https', 'mailto', 'tel']
        }
    };
    const sanitizedData = sanitizeHtml(data, sanitizeParams);
    return sanitizedData;
}

// Escapes hash if the input text starts with one or more hashes followed by a space. 
function escapeHashMarkdown(text) { 

    const match = /^(#+)/; // Matches one ore more hashes at the start of the text

    if(match.test(text)){ // If it matches the escape first hash symbol
        text = text.replace(/^#/, '\\#')
    };
    return text;
}

exports.escapeHashMarkdown = escapeHashMarkdown;
exports.sanitize = sanitize;
