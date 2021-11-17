const _ = require("lodash");
const hook = require("lambda_hook_sdk/hooks")


function create_buttons(event,start=0,stop=10) {
  let buttons = []
  let settings = hook.list_settings(event);
  let topicMap = {},
    topicKey;
  for (let key of Object.keys(settings)) {
    if (key.startsWith("topic::")) {
      [, topicKey] = key.split("::");
      console.log(topicKey);
      topicMap[topicKey] = settings[key];
    }
  }
  let userTopics = hook.get_user_attribute(event, "recentTopics", []).sort((t1, t2) => {
    if (t1.dateTime == t2.dateTime) {
      return 0;
    }
    return t2.dateTime < t1.dateTime ? -1 : 1;
  });
  for (let userTopic of userTopics.slice(start, stop)) {
    if (!(userTopic.topic in topicMap)) {
      continue;
    }
    var [description, qid] = topicMap[userTopic.topic].split("::");

    if (!description || !qid) {
      console.log(
        "WARNING: The topic mapping topic::" +
        userTopic.topic +
        " is not defined properly.  The format should be <description>::<QID>. Using the description as the value."
      );
      continue;
    }
    buttons.push({
      event: event,
      description: description,
      qid: qid
    })
  }
  return buttons
}

exports.handler = async function (event, context) {
  let step = hook.get_step(event)

  console.log(event)
  if (step == "postprocess") {
    let buttons = create_buttons(event)
    if (buttons.length == 0) {
      let recentTopicButton = hook.get_setting(event, "RECENT_TOPICS_BUTTON_VALUE")
      if (recentTopicButton) {
        let buttons = hook.list_response_card_buttons(event)
        let filteredButtons = buttons.filter(r => r.value != recentTopicButton)
        event.res.card.buttons = filteredButtons
        event.res.result.r.buttons = filteredButtons
      }
    }
    console.log(JSON.stringify(event))

    return event
  }

  if (step == "preprocess") {
    return event
  }
  //Retrieve the args passed in via the Content Designer
  var args = hook.get_args(event)
  var start = 0;
  var end = 3;
  if (args) {
    start = args.start != undefined ? args.start : start;
    end = args.end != undefined ? args.end : end;
  }

  hook.set_response_card_title("Recent Topics", false)

  let buttons = create_buttons(event,start,end)
  buttons.forEach(index => hook.add_response_card_button(index.event, index.description, index.qid, true, true))

  return hook.validate_response(event);
};
