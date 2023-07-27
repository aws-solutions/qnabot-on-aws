// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const lambda = require('../index');
const quiz = require('../quiz.js')
const qna = require('../qna.js')
const slottype = require('../slottype.js');
const text = require('../text.js');

describe('when invoking lambda to obtain schema', () => {
    it("should return a correctly formatted object", async () => {
        let result;
        lambda.handler(null, null, (error, response) => {
            result = response
        });

        expect(result).toEqual({
            quiz: quiz,
            qna: qna,
            slottype: slottype,
            text: text,
        });
	});
});