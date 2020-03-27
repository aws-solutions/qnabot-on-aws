var default_settings = {
    ES_USE_KEYWORD_FILTERS: "true",
    ES_NO_HITS_QUESTION: "no_hits",
    ES_KEYWORD_SYNTAX_TYPES: "NOUN,PROPN,VERB,INTJ",
    ES_SYNTAX_CONFIDENCE_LIMIT: ".20",
    ES_MINIMUM_SHOULD_MATCH: "2<75%",
    ES_SCORE_ANSWER_FIELD: true,
    ERRORMESSAGE: "Unfortunately I encountered an error when searching for your answer. Please ask me again later.",
    EMPTYMESSAGE: "You stumped me! Sadly I don't know how to answer your question.",
    DEFAULT_ALEXA_LAUNCH_MESSAGE: "Hello, Please ask a question",
    DEFAULT_ALEXA_STOP_MESSAGE: "Goodbye",
    SMS_HINT_REMINDER_ENABLE: "true",
    SMS_HINT_REMINDER: " (Feedback? Reply THUMBS UP or THUMBS DOWN. Ask HELP ME at any time)",
    SMS_HINT_REMINDER_INTERVAL_HRS: "24",
    IDENTITY_PROVIDER_JWKS_URLS: [],  // User can override this empty list using CustomQnABotSettings to add trusted IdPs (eg from Lex-Web-UI)
    ENABLE_MULTI_LANGUAGE_SUPPORT: false, //User can override and set to true using CustomQnABotSettings to Enable Multilanguage support
    MINIMUM_CONFIDENCE_SCORE: 0.6, //User can override this value to set the minimum confidence they accept using CustomQnABotSettings
    ALT_SEARCH_KENDRA_INDEXES: [], // Add Kendra index to array to enable Amazon Kendra as a fallback source of answers
    ELICIT_RESPONSE_MAX_RETRIES: 5, // Number of times an elictResponse LexBot can be called before giving up
    ELICIT_RESPONSE_RETRY_MESSAGE: "Please try again?" // Default retry message when working with LexBot
}

module.exports = {
    "DefaultUserPoolJwksUrl": {
        "Type": "AWS::SSM::Parameter",
        "Properties": {
            "Description": "Default QnABot Setting - DO NOT MODIFY",
            "Type": "String",
            "Value": { "Fn::Join": ["", ["https://cognito-idp.", { "Ref": "AWS::Region" }, ".amazonaws.com/", { "Ref": "UserPool" }, "/.well-known/jwks.json"]] }
        }
    },
    "DefaultQnABotSettings": {
        "Type": "AWS::SSM::Parameter",
        "Properties": {
            "Description": "Default QnABot Settings - DO NOT MODIFY",
            "Type": "String",
            "Value": JSON.stringify(default_settings)
        }
    },
    "CustomQnABotSettings": {
        "Type": "AWS::SSM::Parameter",
        "Properties": {
            "Description": "Custom QnABot Settings - Modify to override defaults, or to add new settings",
            "Type": "String",
            "Value": "{}"
        }
    }
}
