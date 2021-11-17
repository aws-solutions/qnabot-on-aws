const _ = require("lodash");

module.exports = {

    steps: {
        PREPROCESS: "preproccess",
        POSTPROCESS: "postprocess",
        HOOK: "lambda_hook"
    },

    get_step: function (event) {
        return _.get(event, "req._fulfillment.step")
    },

    get_user_attribute: function (event, property, default_value = undefined) {
        return _.get(event, "res._userInfo." + property, default_value)
    },


    list_user_attributes: function(event){
        //Session attributes may have been added to the response object in addition to what are in
        //the request object or they may have not been copied to the response on
        let requestAttributes = _.get(event,"req._userInfo",{})
        let responseAttributes = _.get(event,"res._userInfo",{})
        let attributes = Object.assign(requestAttributes,responseAttributes) //Merge request and response attributes

        return attributes
    },

    add_user_attribute: function(event,key,value){
        let attributes = this.list_user_attributes(event)
        attributes[key] = value
        _.set(event,"res.session",attributes)
        return this.list_user_attributes(event)
    },



    list_settings: function (event) {
        return _.get(event, "req._settings", {})
    },

    get_setting: function (event, setting) {
        return this.list_settings(event)[setting]
    },

    list_response_card_buttons: function (event) {
        return _.get(event, "res.card.buttons", [])
    },

    get_args: function (event) {
        var args = _.get(event, "res.result.args");
        let results = [];
        args.forEach(element => {
            if (_isJson(element)) {
                results.push(JSON.parse(element))
            }
            else{
                results.push(element)
            }
        })
        return results;
    },

    get_message: function (event) {
        return {
            plainText: _.get(event, "res.result.a"),
            markDown: _.get(event, "res.result.alt.markdown"),
            ssml: _.get(event, "res.result.alt.ssml"),
        }
    },

    set_message: function (event, message) {
        _.set(event, "res,result.a", message.plainText != undefined ? message.plainText : _.get(event, "res.a")),
        _.set(event, "res.result.alt.markdown", message.markDown != undefined ? message.markDown : _.get(event, "res.markdown"))
        _.set(event, "res.result.alt.ssml", message.ssml != undefined ? message.ssml : _.get(event, "res.ssml"))

    },


    get_es_result: function (event) {
        return _.get(event, "res.result")
    },

 

    get_answer_source: function(event){
        return _.get(event,"res.result.answerSource")
    },

    list_session_attributes: function(event){
        //UserInfo attributes may have been added to the response object in addition to what are in
        //the request object or they may have not been copied to the response object yet
        let requestAttributes = _.get(event,"req.session",{})
        let responseAttributes = _.get(event,"res.session",{})
        let attributes = Object.assign(requestAttributes,responseAttributes) //Merge request and response attributes
        return attributes
    },

    add_session_attribute: function(event,key,value){
        let attributes = this.list_session_attributes(event)
        attributes[key] = value
        _.set(event,"res.session."+key,value)
        return this.list_session_attributes(event)
    },


    add_response_card_button: function (event, text, value, isQID = false, prepend = false) {
        let buttons = _.get(event, "res.card.buttons", undefined)
        if (buttons === undefined) {
            _.set(event, "res.card.buttons", [])
        }
        if (!prepend) {

            event.res.card.buttons.push({
                text: text,
                value: isQID ? "QID::" + value : value
            });
        } else {
            event.res.card.buttons.unshift({
                text: text,
                value: isQID ? "QID::" + value : value
            });
        }
        return this.list_response_card_buttons(event)
    },

    get_lex_event: function(event){
        return _.get(event,"req._event")
    },

    get_bot:function(event){
        return _.get(event,"req._event.bot")
    },

    get_question:function(event){
        return _.get(event,"req.question")
    },

    get_sentiment:function(event){
        return {
            sentiment:_.get(event,"req.sentiment"),
            score: _.get(event,"req.sentimenScore")
        }
    },

    set_response_card_imageurl: function (event, url) {
        _.set(event, "res.card.imageUrl", url)
    },

    get_response_card_imageurl: function (event) {
        _.get(event, "res.card.imageUrl", undefined)
    },

    set_response_card_title: function (event, title, overwrrite = true) {
        let card = _.get(event, "res.card.title", undefined)
        if (!card || (card && overwrrite)) {
            _.set(event, "res.card.title", title)
        }
        return _.get(event, "res.card.title")
    },

    validate_response: function (event) {
        let card = _.get(event, "res.card", undefined)

        if (!card) {
            return card
        }

        if (card.title == undefined) {
            throw ("A response card was created without a title.  Set the title using set_response_card_title()")
        }

        let buttons = this.list_response_card_buttons(event)

        let imageUrl = this.get_response_card_imageurl(event)
        if (buttons.length == 0 && imageUrl == undefined) {
            throw ("If a response card is defined, either the imageUrl or buttons must be defined")
        }
        return event
    }
}

function _isJson(jsonString) {
    try {
        JSON.parse(jsonString);
        return true; // It's a valid JSON format
    } catch (e) {
        return false; // It's not a valid JSON format
    }
}