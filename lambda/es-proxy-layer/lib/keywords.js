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

// start connection
const _ = require('lodash');
const aws = require('aws-sdk');
const qnabot = require('qnabot/logging');

const stopwords = 'a,an,and,are,as,at,be,but,by,for,if,in,into,is,it,not,of,on,or,such,that,the,their,then,there,these,they,this,to,was,will,with';

async function get_keywords_from_comprehend(params) {
    // get keywords from question using Comprehend syntax api
    let keywords = '';
    const keyword_syntax_types = _.get(params, 'keyword_syntax_types') || 'NOUN,PROPN,VERB,INTJ';
    const syntax_confidence_limit = _.get(params, 'syntax_confidence_limit') || 0.20;
    const comprehend = new aws.Comprehend();
    const comprehend_params = {
        LanguageCode: 'en',
        Text: params.question,
    };
    const data = await comprehend.detectSyntax(comprehend_params).promise()
    for (const syntaxtoken of data.SyntaxTokens) {
        qnabot.debug(
            `WORD = '${syntaxtoken.Text}', `
            + `PART OF SPEECH = ${syntaxtoken.PartOfSpeech.Tag}, `
            + `SCORE: ${syntaxtoken.PartOfSpeech.Score}`,
        );

        if (keyword_syntax_types.split(',').indexOf(syntaxtoken.PartOfSpeech.Tag) === -1) {
            qnabot.debug('X part of speech not in list:', keyword_syntax_types);
        } else if (stopwords.split(',').indexOf(syntaxtoken.Text.toLowerCase()) !== -1) {
            qnabot.debug(`X '${syntaxtoken.Text}' is a stop word`);
        } else if (syntaxtoken.PartOfSpeech.Score < syntax_confidence_limit) {
            qnabot.debug('X score < ', syntax_confidence_limit, ' (threshold)');
        } else {
            qnabot.debug(`+KEYWORD: ${syntaxtoken.Text}`);
            if (!(syntaxtoken.Text.startsWith('\'') || syntaxtoken.Text.startsWith('`'))) {
                keywords = `${keywords + syntaxtoken.Text} `;
            } else {
                qnabot.debug(`Not including ${syntaxtoken.Text}`);
            }
        }
    }

    if (keywords.length === 0) {
        qnabot.debug('Keyword list empty - no query filter applied');
    } else {
        qnabot.debug('KEYWORDS:', keywords);
    }
    return keywords;
}

async function get_keywords(params) {
    let contraction_list;
    let new_question = '';
    let new_word = '';
    try {
        contraction_list = JSON.parse(params.es_expand_contractions);
    } catch {
        qnabot.log(`Improperly formatted JSON in ES_EXPAND_CONTRACTIONS: ${params.es_expand_contractions}`);
        contraction_list = {};
    }

    for (const word of params.question.split(' ')) {
        for (const contraction in contraction_list) {
            new_word = '';
            if (word.toLowerCase() == contraction.toLowerCase() || word.toLowerCase() == contraction.toLowerCase().replace('\'', '’')) {
                new_word = contraction_list[contraction];
                break;
            }
        }
        new_question += ` ${new_word != '' ? new_word : word}`;
    }
    qnabot.log(`Question after expanding contractions${new_question}`);
    params.question = new_question;

    if (_.get(params, 'use_keyword_filters')) {
        qnabot.log('use_keyword_filters is true; detecting keywords from question using Comprehend');
        return get_keywords_from_comprehend(params);
    }
    qnabot.log('use_keyword_filters is false');
    return Promise.resolve('');
}

module.exports = function (params) {
    return get_keywords(params);
};
