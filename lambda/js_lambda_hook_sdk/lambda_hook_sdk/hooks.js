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

const _ = require('lodash');

module.exports = {

    steps: {
        PREPROCESS: 'preproccess',
        POSTPROCESS: 'postprocess',
        HOOK: 'lambda_hook',
    },

    get_step(event) {
        return _.get(event, 'req._fulfillment.step');
    },

    get_user_attribute(event, property, default_value = undefined) {
        return _.get(event, `res._userInfo.${property}`, default_value);
    },

    list_user_attributes(event) {
        // Session attributes may have been added to the response object in addition to what are in
        // the request object or they may have not been copied to the response on
        const requestAttributes = _.get(event, 'req._userInfo', {});
        const responseAttributes = _.get(event, 'res._userInfo', {});
        const attributes = Object.assign(requestAttributes, responseAttributes); // Merge request and response attributes

        return attributes;
    },

    add_user_attribute(event, key, value) {
        const attributes = this.list_user_attributes(event);
        attributes[key] = value;
        _.set(event, 'res.session', attributes);
        return this.list_user_attributes(event);
    },

    list_settings(event) {
        return _.get(event, 'req._settings', {});
    },

    get_setting(event, setting) {
        return this.list_settings(event)[setting];
    },

    list_response_card_buttons(event) {
        return _.get(event, 'res.card.buttons', []);
    },

    get_args(event) {
        const args = _.get(event, 'res.result.args');
        const results = [];
        args.forEach((element) => {
            try {
                const jsonResult = JSON.parse(element);
                results.push(jsonResult);
            } catch (e) {
                // exception thrown during parse means it's not JSON
                // just push onto results
                results.push(element);
            }
        });
        return results;
    },

    get_message(event) {
        return {
            plainText: _.get(event, 'res.result.a'),
            markDown: _.get(event, 'res.result.alt.markdown'),
            ssml: _.get(event, 'res.result.alt.ssml'),
        };
    },

    set_message(event, message) {
        _.set(event, 'res.result.a', message.plainText);
        _.set(event, 'res.result.alt.markdown', message.markDown);
        _.set(event, 'res.result.alt.ssml', message.ssml);
    },

    get_es_result(event) {
        return _.get(event, 'res.result');
    },

    get_answer_source(event) {
        return _.get(event, 'res.result.answerSource');
    },

    list_session_attributes(event) {
        // UserInfo attributes may have been added to the response object in addition to what are in
        // the request object or they may have not been copied to the response object yet
        const requestAttributes = _.get(event, 'req.session', {});
        const responseAttributes = _.get(event, 'res.session', {});
        const attributes = Object.assign(requestAttributes, responseAttributes); // Merge request and response attributes
        return attributes;
    },

    add_session_attribute(event, key, value) {
        const attributes = this.list_session_attributes(event);
        attributes[key] = value;
        _.set(event, `res.session.${key}`, value);
        return this.list_session_attributes(event);
    },

    add_response_card_button(event, text, value, isQID = false, prepend = false) {
        const buttons = _.get(event, 'res.card.buttons', undefined);
        if (buttons === undefined) {
            _.set(event, 'res.card.buttons', []);
        }
        if (!prepend) {
            event.res.card.buttons.push({
                text,
                value: isQID ? `QID::${value}` : value,
            });
        } else {
            event.res.card.buttons.unshift({
                text,
                value: isQID ? `QID::${value}` : value,
            });
        }
        return this.list_response_card_buttons(event);
    },

    get_lex_event(event) {
        return _.get(event, 'req._event');
    },

    get_bot(event) {
        return _.get(event, 'req._event.bot');
    },

    get_question(event) {
        return _.get(event, 'req.question');
    },

    get_sentiment(event) {
        return {
            sentiment: _.get(event, 'req.sentiment'),
            score: _.get(event, 'req.sentimentScore'),
        };
    },

    set_response_card_imageurl(event, url) {
        _.set(event, 'res.card.imageUrl', url);
    },

    get_response_card_imageurl(event) {
        return _.get(event, 'res.card.imageUrl', undefined);
    },

    set_response_card_title(event, title, overwrrite = true) {
        const card = _.get(event, 'res.card.title', undefined);
        if (!card || (card && overwrrite)) {
            _.set(event, 'res.card.title', title);
        }
        return _.get(event, 'res.card.title');
    },

    validate_response(event) {
        const card = _.get(event, 'res.card', undefined);

        if (!card) {
            return event;
        }

        if (card.title == undefined) {
            throw new Error('A response card was created without a title.  Set the title using set_response_card_title()');
        }

        const buttons = this.list_response_card_buttons(event);
        const imageUrl = this.get_response_card_imageurl(event);

        if (buttons.length == 0 && imageUrl == undefined) {
            throw new Error('If a response card is defined, either the imageUrl or buttons must be defined');
        }

        return event;
    },
};
