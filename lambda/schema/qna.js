module.exports={
    type:"object",
    description:"Question and Answer document",
    properties:{
        qid:{
            type:"string",
            title:"Item ID",
            description:"Assign a unique identifier for this item.",
            maxLength:100,
            propertyOrder: 0
        },
        q:{
            title:"Questions / Utterances",
            description:"Enter one or more questions or phrases that a user might ask.",
            type:"array",
            items:{
                title:"Question / Utterance",
                type:"string",
                maxLength:140
            },
            propertyOrder: 1
        },
        a:{
            type:"string",
            title:"Answer",
            description:"Enter the answer you want to be returned when the user asks one of the above questions.",
            maxLength:8000,
            propertyOrder: 3
        },
        alt:{
            type:"object",
            description:"Alternate Answers",
            properties:{
                ssml:{
                    type:"string",
                    title:"SSML Answer",
                    description:"Alternate SSML answer",
                    maxLength:8000,
                    propertyOrder: 1
                },
                markdown:{
                    type:"string",
                    title:"Markdown Answer",
                    description:"Alternate Markdown answer",
                    maxLength:8000,
                    propertyOrder: 0
                },
            },
            propertyOrder: 4
        },
        t:{
            type:"string",
            description:"Assign a topic to this item, to support follow up questions on the same topic. (Sets session attribute 'topic' in response). Topics cannot be used if enableLexIntent is enabled.",
            title:"Topic",
            propertyOrder: 5
        },
        enableQidIntent: {
            title: "Create a dedicated bot intent for this item during LEX REBUILD",
            description: "Enable to support use of slots in questions. WARNING: Enabling Intents prevents use of QnABot Topics, ClientFilters, and multi-language text interactions when bot locale does not match user's language.",
            type : "boolean",
            propertyOrder: 6,
        },
        slots:{
            title: "Slots",
            description:"Define slots referenced in the questions above, if any.",
            type:"array",
            propertyOrder: 7,
            items:{
                type:"object",
                properties:{
                    slotRequired: {
                        title: "Slot required?",
                        description: "The bot will prompt for this slot during the conversation if a value has not been provided by the user.",
                        type : "boolean",
                        propertyOrder: 0,                            
                    },
                    slotValueCached: {
                        title: "Cache slot value for re-use during session?",
                        description: "Save the slot value in session attribute 'qnabotcontext.slots.slotName', and use it automatically as the value for other slots with the same name without reprompting the user.",
                        type : "boolean",
                        propertyOrder: 1,                            
                    },
                    slotName: {
                        title: "Slot name",
                        description: "Slot name, e.g. firstname.", 
                        type : "string",
                        propertyOrder: 2,
                    },
                    slotType: {
                        title: "Slot type",
                        description: "Slot type, e.g. AMAZON.FirstName (or custom slot type name).",
                        type : "string",
                        propertyOrder: 3,
                    },
                    slotPrompt: {
                        title: "Slot prompt",
                        description: "Slot elicitation prompt, e.g. What is your first name?",
                        type : "string",
                        propertyOrder: 4,
                    },
                    slotSampleUtterances: {
                        title: "Slot sample utterances",
                        description: "(Optional) Comma separated phrases that a user might use to provide the slot value. A comprehensive set of pre-defined utterances is included. You can add more if required.",
                        type : "string",
                        propertyOrder: 5,
                    },
                },
            },
        },
        sa:{
            title: "Set Session Attributes",
            type:"array",
            items:{
                title:"Name / Value Pair",
                type:"object",
                properties:{
                    text: {
                        title: "Session Attribute Name",
                        type : "string",
                        propertyOrder: 0
                    },
                    value: {
                        title: "Session Attribute Value",
                        maxLength:8000,
                        type : "string",
                        propertyOrder: 1
                    },
                    enableTranslate: {
                        title: "Translate Value if multi-language is enabled",
                        type : "boolean",
                        propertyOrder: 2
                    }
                },
            },
            propertyOrder: 8
        },
        r:{
            title:"Response card",
            description:"Attach images and/or buttons to your answer. A reponse card must have an imageUrl or at least one button.",
            type:"object",
            properties:{
                title:{
                    type:"string",
                    title:"Card Title",
                    description:"Required - max length of 80 after handlebars processing",
                    propertyOrder: 0
                },
                subTitle:{
                    type:"string",
                    title:"Card Subtitle",
                    description:"Optional - max length of 80 after handlebars processing",
                    propertyOrder: 1
                },
                imageUrl:{
                    type:"string",
                    description:"Optional",
                    title:"Card Image Url",
                    maxLength:2000,
                    propertyOrder: 2
                },
                buttons:{
                    title:"Lex Buttons",
                    description:"Add buttons for Amazon Lex client users. NOTE: Standard Amazon Lex clients will display up to 5 buttons only (Lex limit) - this limit does not apply to Lex-Web-UI version 0.16 or later.",
                    type:"array",
                    items:{
                        title:"Button",
                        type:"object",
                        properties:{
                            text: {
                                title: "Display Text",
                                type : "string",
                                propertyOrder: 0
                            },
                            value: {
                                title: "Button Value",
                                type : "string",
                                propertyOrder: 1
                            }
                        },
                        required:["text","value"]
                    },   
                    propertyOrder: 3
                }
            },
            propertyOrder:9,
            required:["title"]
        },
        kendraRedirectQueryText:{
            type:"string",
            description:"Enter QueryText to retrieve the answer from the Kendra Fallback index specified in Settings. Answer fields above are ignored when KendraRedirect query is used.",
            title:"Kendra Redirect: QueryText",
            propertyOrder:10
        },
        kendraRedirectQueryConfidenceThreshold:{
            type:"string",
            description:"Optional: LOW, MEDIUM, HIGH, or VERY HIGH. Defaults to the value of setting ALT_KENDRA_FALLBACK_CONFIDENCE_THRESHOLD.",
            title:"Kendra Redirect Confidence score threshold.",
            propertyOrder:11
        },
        kendraRedirectQueryArgs:{
            title:"Kendra query arguments",
            description:"Optional key:value parameters, e.g. \"AttributeFilter\": {\"EqualsTo\": {\"Key\": \"City\", \"Value\": {\"StringValue\": \"Seattle\"}}}. Use handlebars to substitute values using session attributes or slots. See https://docs.aws.amazon.com/kendra/latest/dg/API_Query.html.",
            type:"array",
            items:{
                title:"Kendra query argument",
                type:"string",
                maxLength:2000
            },
            propertyOrder:12
        },
        l:{
            type:"string",
            description:"Enter your lambda function name/ARN to dynamically create or modify answers, or to redirect to a different question.",
            title:"Lambda Hook",
            propertyOrder:13
        },
        args:{
            title:"Lambda Hook Arguments",
            description:"If you named a lambda hook above and it requires additional information beyond what you've entered for this document, enter that information here.  You should not add anything here unless the lambda hook you named has been specifically coded to handle it.",
            type:"array",
            items:{
                title:"Argument",
                type:"string",
                maxLength:2000
            },
            propertyOrder:14
        },
        elicitResponse:{
            title:"Elicit Response",
            description:"If your answer includes a question to the user, configure QnABot to process and capture the user's response as session attributes.",
            type:"object",
            propertyOrder:15,
            properties:{
                responsebot_hook:{
                    title:"Elicit Response: ResponseBot Hook",
                    description:"To capture the next utterance as a response, provide the name of a Lex bot to parse the response and return at least one slot value, e.g. (QNAYesNo, QNADate, etc.). For Lex V2 use \"lexv2::Botid/BotAliasId/LocaleId\". For Lex V1 use a bot name starting with \"QNA\".",
                    type:"string",
                    maxLength:100,
                    propertyOrder:0
                },
                response_sessionattr_namespace:{
                    title:"Elicit Response: Response Session Attribute Namespace",
                    description:"Enter a string used as a name space for session attributes that will store returned slot values from the Response Bot.",
                    type:"string",
                    maxLength:100,
                    propertyOrder:1
                }
            }
        },
        conditionalChaining:{
            title:"Document Chaining: Chaining Rule",
            description:"Automatically move on to another item based on the question string returned by this rule. Rule can be a single-quoted string, e.g. 'next question', or a JavaScript conditional expression that evaluates to a string, e.g. (SessionAttributes.namespace.Yes_No == \"Yes\" ) ? \"Yes question\" : \"No Question\", or a Lambda Function Name or ARN that returns a string specified as \"Lambda::FunctionName\". Function name must start with \"QNA-\".",
            type:"string",
            maxLength:4000,
            propertyOrder:16
        },
        clientFilterValues:{
            title:"Client Filters: Values",
            description:"Enter list of terms. When specified, client must provide 1 or more matching terms in request session attribute 'QNAClientFilter' for this answer to be eligible for the response. Client filters cannot be used if enableLexIntent is enabled.",
            type:"string",
            maxLength:100,
            propertyOrder:17
        }, 
        botRouting:{
            title:"Bot Routing",
            description:"Use QnABot as a supervisory Bot and route to other Bots to handle the conversation. This parameter identifies a target Bot or Lambda with which to route communication.",
            type:"object",
            propertyOrder:18,
            properties:{
                specialty_bot:{
                    title:"Bot Routing: LexV1 BotName OR lexv2::Botid/BotAliasId/LocaleId OR Lambda Function",
                    description:"The target specialty Lex Bot or Lambda Function to route requests to. For Lex V2 bot names use the format \"lexv2::BotId/BotAliasId/LocaleId\". For Lex V1 bot the names should start with \"QNA\". Lambda functions can be specified as \"Lambda::FunctionName\" or \"Lambda::FunctionARN\" - Lambda function names must start with \"QNA-\".",
                    type:"string",
                    maxLength:100,
                    propertyOrder:0
                },
                specialty_bot_name:{
                    title:"A simple name for the Specialty Bot that can optionally be presented in a user interface such as a bread crumb. (Required)",
                    description:"Enter a string used as the Specialty Bot's simple name.",
                    type:"string",
                    maxLength:100,
                    propertyOrder:1
                },
                specialty_bot_alias:{
                    title:"The Bot alias to use for the Specialty Bot. (Required for other Lex/QnA Bot targets - Not utilized when Lambda Function is used.)",
                    description:"For Lex V2 leave empty. For Lex V1 specialty bots, enter a string for the Specialty Bot's Lex alias.",
                    type:"string",
                    maxLength:100,
                    propertyOrder:2
                },
                specialty_bot_session_attributes_to_merge:{
                    title:"Session attributes to forward to a Lex specialty bot.",
                    description:"An optional comma separated list of session attributes to pass to a Lex specialty bot. Default is an empty string.",
                    type:"string",
                    maxLength:100,
                    propertyOrder:3
                }
            }
        },
        tags:{
            type:"string",
            description:"Specify tags for questions. Tags should be space separated. For multi-word tags please use underscore '_'.",
            title:"Tags",
            propertyOrder: 19
        },  
        rp:{
            type:"string",
            title:"Alexa Reprompt",
            description:"Enter the Alexa reprompt to returned if the user does not respond. (SSML autodetection with &lt;speak&gt;&lt;/speak&gt;)",
            maxLength:8000,
            propertyOrder: 20
        },
        next:{
            title:"Guided Navigation: Next QID",
            description:"Use only for Guided Navigation feature. If applicable, enter the QID of the document(s) that is/are next in the sequence, otherwise leave blank. Be careful; if you set this field to an earlier document in the sequence, you might make your sequence loop forever, which would not be fun!  You can add more QIDs after the first, but they won't do anything at the moment.",
            type:"string",
            maxLength:100,
            propertyOrder:21
        }, 
    },
    required:["qid","q","a"]
};
