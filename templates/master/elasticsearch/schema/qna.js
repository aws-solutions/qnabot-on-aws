module.exports={
    _meta:{
        schema:{
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
                    title:"Questions",
                    description:"Enter one or more questions that a user might ask.",
                    type:"array",
                    items:{
                        title:"Question",
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
                    propertyOrder: 2
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
                    propertyOrder: 3
                },
                t:{
                    type:"string",
                    description:"Assign a topic to this item, to support follow up questions on the same topic.",
                    title:"Topic",
                    propertyOrder: 4
                },
                r:{
                    title:"Response card",
                    description:"Attach images and buttons to your answer",
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
                            format:'url',
                            maxLength:2000,
                            propertyOrder: 2
                        },
                        buttons:{
                            title:"Lex Buttons",
                            description:"Conditionally Required for Lex if no Card Image Url is specified. Add response buttons users can click on if they are interacting through Lex.",
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
                    propertyOrder:5,
                    required:["title"]
                },
                l:{
                    type:"string",
                    description:"Enter your lambda function name/ARN to dynamically create or modify answers, or to redirect to a different question.",
                    title:"Lambda Hook",
                    propertyOrder:6
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
                    propertyOrder:7
                },
                elicitResponse:{
                    title:"Elicit Response",
                    description:"If your answer includes a question to the user, configure QnABot to process and capture the user's response as session attributes.",
                    type:"object",
                    propertyOrder:8,
                    properties:{
                        responsebot_hook:{
                            title:"Elicit Response: ResponseBot Hook",
                            description:"To capture the next utterance as a response, provide the name of a Lex bot to parse the response and return at least one slot value, e.g. (QNAYesNo, QNADate, etc.). ResponseBot name must start with \"QNA\".",
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
                    description:"Automatically move on to another item based on the question string returned by this rule. Rule can be a single-quoted string, e.g. 'next question', or a JavaScript conditional expression that evaluates to a string, e.g. (SessionAttributes.namespace.Yes_No == \"Yes\" ) ? \"Yes question\" : \"No Question\", or a Lambda Function Name or ARN that returns a string specified as \"Lambda::FunctionName\". Function name must start with \"QNA\".",
                    type:"string",
                    maxLength:4000,
                    propertyOrder:9
                },
                next:{
                    title:"Guided Navigation: Next QID",
                    description:"If applicable, enter the QID of the document(s) that is/are next in the sequence, otherwise leave blank. Be careful; if you set this field to an earlier document in the sequence, you might make your sequence loop forever, which would not be fun!  You can add more QIDs after the first, but they won't do anything at the moment.",
                    type:"string",
                    maxLength:100,
                    propertyOrder:10
                },
            },
            required:["qid","q","a"]
        }
    },
    properties:{
        qid:{
            type:"keyword"
        },
		quniqueterms: {
			type: "text",
			analyzer: "custom_english_unique"
		},
        questions:{
            type:"nested",
            properties:{
                q:{
                    type:"text",
                    analyzer:"custom_english"
                }
            }
        },
        a:{
            type:"text",
            analyzer:"custom_english"
        },
        t:{
            type:'text',analyzer:"whitespace" 
        },
        r:{
            properties:{
                imageUrl:{type:"keyword"},
                title:{type:"text"}
            }
        },
        l:{
            type:"keyword"
        }
    }
}
                
