// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports={
    type:"object",
    description:"Text passage",
    properties:{
        qid:{
            type:"string",
            title:"Item ID",
            description:"Assign a unique identifier for this item.",
            maxLength:100,
            propertyOrder: 0
        },
        a:{
            type:"string",
            title:"Passage",
            description:"Enter a short text passage/paragraph with information on a topic that a user may ask about.",
            maxLength:8000,
            propertyOrder: 3
        },
        t:{
            type:"string",
            description:"Assign a topic to this item, to support follow up questions on the same topic. (Sets session attribute 'topic' in response). Topics cannot be used if enableLexIntent is enabled.",
            title:"Topic",
            propertyOrder: 5
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
    },
    required:["qid","a"]
};
