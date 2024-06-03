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