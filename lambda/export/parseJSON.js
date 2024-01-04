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

// parseJSON.js

const fs = require('fs');
const _ = require('lodash');

/**
 * Function to parse JSON of configurations/questions from QNA Content Designer and write an output Kendra JSON FAQ file
 * @param input_path : the input file path of the exported JSON
 * @param output_path : the output file path to write the JSON
 * @returns output_path
 */
async function qnaJsontoKendraJsonParser(params) {
    const data = {
        SchemaVersion: 1,
        FaqDocuments: [
        ],
    };

    const qna = `{"qna":[${params.content.toString().replace(/\n/g, ',\n')}]}`;
    params.content = JSON.parse(qna);
    const q_list = params.content.qna;

    q_list.forEach((elem) => {
    // Exclude QIDs with enableQidIntent: true. They should be matched only by Lex
    // as intents, not by Kendra FAQ queries.
        if (!_.get(elem, 'enableQidIntent', false)) {
            if (elem.q) { // qna type questions (standard)
                elem.q.forEach((ques) => {
                    const entry = {
                        Question: ques,
                        Answer: elem.a,
                        Attributes: {
                            // use standard index attribute _source_uri  (string) to reference qid
                            // - embedding the entire JSON document can cause issues with Kendra attribute length limits
                            // - custom attributes need to be added at the index level, which represents extra work/complexity for user
                            // QnABot query lambda will use the qid stored in the _source_uri attribute to retrieve full JSON doc from ES
                            _source_uri: JSON.stringify({ _source_qid: elem.qid }),
                        },
                    };
                    data.FaqDocuments.push(entry);
                });
            } else {
                console.log(`this element is not supported with KendraFAQ and was skipped in the sync: ${JSON.stringify(elem)}`);
            }
        }
    });
    console.log(`Kendra Data ${JSON.stringify(data)}`);

    fs.writeFileSync(params.output_path, JSON.stringify(data), { encoding: 'utf8' });
    console.log(`The JSON file ${params.output_path} was written successfully`);
}

exports.handler = async (params) => await qnaJsontoKendraJsonParser(params);
