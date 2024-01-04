/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

exports.event = {
    req: {
        _event: {
            userId: 'test',
        },
        _info: {
            es: {
                service: {
                    qid: 'test',
                },
            },
        },
        question: 'Earth',
    },
    res: {
        session: {
            qnabotcontext: {
                previous: {
                    qid: 'test',
                },
            },
        },
        result: {
            args: ['Quiz.001'],
        },
    },
};

exports.data = {
    Payload: JSON.stringify({
        qid: 'Quiz.001',
        question: 'Which celestial object is a planet?',
        correctAnswers: ['Earth', 'Mars'],
        incorrectAnswers: ['Pluto', 'Moon'],
        type: 'quiz',
        r: {
            imageUrl: 'http://localhost',
        },
    }),
};

exports.encrypt = {
    CiphertextBlob: 'encrypt',
};

exports.decrypt = {
    Plaintext: JSON.stringify({
        prev: 'Quiz.001',
        qid: 'Quiz.002',
        next: 'Quiz.003',
        correctAnswers: ['EARTH', 'MARS'],
        incorrectAnswers: ['PLUTO', 'MOON'],
    }),
};
