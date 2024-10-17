/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
