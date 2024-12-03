/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const XLSX = require('read-excel-file/node');
const _ = require('lodash');
const qnabot = require('qnabot/logging');

exports.convertxlsx = async function (content) {
    // this headermap enabled customers to more conveniently
    // map some of the more common fields using a 'friendly' name
    const headerMapping = {
        question: 'q',
        topic: 't',
        markdown: 'alt.markdown',
        answer: 'a',
        Answer: 'a',
        ssml: 'alt.ssml',
    };

    qnabot.log('inside convert json');
    try {
        const sheetNames = await XLSX.readSheetNames(content);
        const valid_questions = [];
        for (const sheetName of sheetNames) {
        // Here is your object
            const rows = await XLSX.default(content, { sheet: sheetName });
            const headerRow = rows.shift();
            let excelRowNumber = 1; // excel sheets start at index 1, which for us is the header
            rows.forEach((question) => {
                qnabot.log(`Processing ${JSON.stringify(question)}`);
                excelRowNumber++;

                question = mapQuestions(headerRow, question);
                question = mapProperties(headerMapping, question);
                question.q = extractUserQuestions(question);

                if (!questionIsValid(question, excelRowNumber)) {
                    return;
                }

                if (question.cardtitle) {
                    question = addQuestionCard(question);
                }

                question = addDotProperties(question);

                // Note that at this point we have stopped processing the excel file and any additional
                // fields will be left as is. This means that new or more advanced fields can be imported
                // by directly referencing their schema id (e.g. 'kendraRedirectQueryArgs')
                qnabot.log(`Processed ${JSON.stringify(question)}`);
                valid_questions.push(question);
            });
        }
        return valid_questions;
    } catch (err) {
        qnabot.log('Parse error');
        qnabot.log(err);
        throw err;
    }
};
function addDotProperties(question) {
    // properties with a '.' should be treated as nested properties
    // let's set any that we find into their proper destination within the object
    // e.g. 'botRouting.specialty_bot' ==> 'botRouting': { 'specialty_bot': value }
    for (const property in question) {
        if (property.includes('.')) {
            const value = question[property];
            // need to delete the property first to ensure lodash treats the property
            // variable as a path, and not just as a string key
            delete question[property];
            if (value != null) {
                _.set(question, property, value);
            }
        }
    }

    return question;
}

function addQuestionCard(question) {
    qnabot.log('processing response title');
    question.r = {};
    question.r.title = question.cardtitle;
    delete question.cardtitle;
    if (question.imageurl) {
        question.r.imageUrl = question.imageurl;
        delete question.imageurl;
    }
    if (question.cardsubtitle) {
        question.r.subTitle = question.subtitle;
        delete question.cardsubtitle;
    }

    question.r.buttons = processButtons(question);

    return question;
}

function mapProperties(headerMapping, question) {
    // let's try and map a couple friendly column names into their
    // actual property names using the header mapping (e.g. 'topic' to 't')
    for (const property in headerMapping) {
        const dest_property = headerMapping[property];
        if (question[dest_property] == undefined) {
            qnabot.log(`Assigning value for ${dest_property}`);
            _.set(question, dest_property, question[property]);
            delete question[property];
        }
    }
    return question;
}

function mapQuestions(headerRow, question) {
    const questionMap = {};
    for (let j = 0; j < headerRow.length; j++) {
        questionMap[headerRow[j]] = question[j];
    }
    return questionMap;
}

function extractUserQuestions(question) {
    const q = question.q ? [question.q] : [];
    let counter = 1;
    while (true) {
        // users can import multiple utterances, be appending sequential numbers to
        // the column 'question', e.g. question8
        const userQuestion = question[`question${counter}`];
        if (!userQuestion) {
            // break on the first instance of missing question number. For example,
            // if user has question1 and question3 in their excel file, but no question2
            // then we would never look at question3 because question2 is missing
            break;
        }
        q.push(userQuestion.replace(/(\r\n|\n|\r)/gm, ' '));
        delete question[`question${counter}`];
        counter += 1;
    }
    return q;
}

function questionIsValid(question, excelRowNumber) {
    // validate mandatory fields of qid, question, and answer
    // qid must exist
    if (!question.qid) {
        qnabot.log(
            `Warning: No QID found for line ${excelRowNumber}. The question will be skipped.`,
        );
        return false;
    }
    // qid must have no spaces
    if (/\s/g.test(question.qid)) {
        qnabot.log(
            `Warning: QID found for line ${excelRowNumber} must have no spaces. The question will be skipped.`,
        );
        return false;
    }
    // must have atleast 1 question
    if (question.q.length == 0) {
        qnabot.log(
            `Warning: No questions found for QID: ${question.qid}. The question will be skipped.`,
        );
        return false;
    }
    // answer must exist and include valid characters
    if (!question.a || question.a.replace(/\s/g, '').length == 0) {
        qnabot.log(
            `Warning: No answer found for QID: ${question.qid}. The question will be skipped.`,
        );
        return false;
    }
    return true;
}

function processButtons(question) {
    // NOSONAR TODO, refactor to operate similar to import.vue
    // better yet, move common xlsx validation into common-modules
    const buttons = [];
    let i = 1;
    while (true) {
        qnabot.log(`Processing Button${i}`);
        const buttonFieldTextName = `displaytext${i}`;
        const buttonFieldValueName = `buttonvalue${i}`;
        i++;
        const undefinedButtonFieldCount = (question[buttonFieldTextName] == undefined) + (question[buttonFieldValueName] == undefined);
        qnabot.log(`ButtonName ${question[buttonFieldTextName]} ButtonValue ${question[buttonFieldValueName]}`);
        qnabot.log(`Undefined field count ${undefinedButtonFieldCount}`);

        if (undefinedButtonFieldCount == 2) {
            break;
        }
        if (undefinedButtonFieldCount == 1) {
            qnabot.log(`Warning:  Both ${buttonFieldTextName} and ${buttonFieldValueName} must be defined for qid: ${question.qid}`);
            continue;
        }
        qnabot.log('Found two values');
        if (question[buttonFieldValueName].length > 80) {
            qnabot.log(`Warning: ${buttonFieldValueName} must be less than or equal to 80 characters for qid: ${question.qid}`);
            continue;
        }
        if (question[buttonFieldTextName].length > 80) {
            qnabot.log(`Warning: ${buttonFieldTextName} must be less than or equal to 80 characters for qid: ${question.qid}`);
            continue;
        }
        const button = {
            text: question[buttonFieldTextName],
            value: question[buttonFieldValueName],
        };
        qnabot.log(`Adding button ${JSON.stringify(button)}`);
        buttons.push(button);
        delete question[buttonFieldTextName];
        delete question[buttonFieldValueName];
    }

    return buttons;
}
