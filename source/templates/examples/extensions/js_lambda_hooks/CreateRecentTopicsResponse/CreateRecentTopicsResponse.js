/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const hook = require('lambda_hook_sdk/hooks');

function create_buttons(event, start = 0, stop = 10) {
    const buttons = [];
    const settings = hook.list_settings(event);
    const topicMap = {};
    let topicKey;
    for (const key of Object.keys(settings)) {
        if (key.startsWith('topic::')) {
            [, topicKey] = key.split('::');
            console.log(topicKey);
            topicMap[topicKey] = settings[key];
        }
    }
    const userTopics = hook.get_user_attribute(event, 'recentTopics', []).sort((t1, t2) => {
        if (t1.dateTime == t2.dateTime) {
            return 0;
        }
        return t2.dateTime < t1.dateTime ? -1 : 1;
    });
    for (const userTopic of userTopics.slice(start, stop)) {
        if (!(userTopic.topic in topicMap)) {
            continue;
        }
        const [description, qid] = topicMap[userTopic.topic].split('::');

        if (!description || !qid) {
            console.log(
                `WARNING: The topic mapping topic::${
                    userTopic.topic
                } is not defined properly.  The format should be <description>::<QID>. Using the description as the value.`,
            );
            continue;
        }
        buttons.push({
            event,
            description,
            qid,
        });
    }
    return buttons;
}

exports.handler = async function (event, context) {
    const step = hook.get_step(event);

    console.log(event);
    if (step == 'postprocess') {
        const buttons = create_buttons(event);
        if (buttons.length == 0) {
            const recentTopicButton = hook.get_setting(event, 'RECENT_TOPICS_BUTTON_VALUE');
            if (recentTopicButton) {
                const buttons = hook.list_response_card_buttons(event);
                const filteredButtons = buttons.filter((r) => r.value != recentTopicButton);
                event.res.card.buttons = filteredButtons;
                event.res.result.r.buttons = filteredButtons;
            }
        }
        console.log(JSON.stringify(event));

        return event;
    }

    if (step == 'preprocess') {
        return event;
    }
    // Retrieve the args passed in via the Content Designer
    const args = hook.get_args(event);
    let start = 0;
    let end = 3;
    if (args) {
        start = args.start != undefined ? args.start : start;
        end = args.end != undefined ? args.end : end;
    }

    hook.set_response_card_title('Recent Topics', false);

    const buttons = create_buttons(event, start, end);
    buttons.forEach((index) => hook.add_response_card_button(index.event, index.description, index.qid, true, true));

    return hook.validate_response(event);
};
