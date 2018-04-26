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
                    maxLength:100
                },
                q:{
                    title:"Questions",
                    description:"Enter one or more questions that a user might ask.",
                    type:"array",
                    items:{
                        title:"Question",
                        type:"string",
                        maxLength:140
                    }
                },
                a:{
                    type:"string",
                    title:"Answer",
                    description:"Enter the answer you want to be returned when the user asks one of the above questions.",
                    maxLength:8000,
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
                        },
                        markdown:{
                            type:"string",
                            title:"Markdown Answer",
                            description:"Alternate Markdown answer",
                            maxLength:8000,
                        },
                    }
                },
                t:{
                    type:"string",
                    description:"Assign a topic to this item, to support follow up questions on the same topic.",
                    title:"Topic"
                },
                next:{
                    title:"Next Document",
                    description:"If applicable, enter the QID of the document(s) that is/are next in the sequence, otherwise leave blank. Be careful; if you set this field to an earlier document in the sequence, you might make your sequence loop forever, which would not be fun!  You can add more QIDs after the first, but they won't do anything at the moment.",
                    type:"string",
                    maxLength:100
                },
                r:{
                    title:"Response card",
                    description:"Attach images to your answer",
                    type:"object",
                    properties:{
                        title:{
                            type:"string",
                            title:"Card Title",
                            description:"Required",
                            maxLength:80
                        },
                        subTitle:{
                            type:"string",
                            title:"Card Subtitle",
                            description:"Optional",
                            maxLength:80
                        },
                        imageUrl:{
                            type:"string",
                            description:"Required",
                            title:"Card Image Url",
                            format:'url',
                            maxLength:2000
                        }
                    },
                    dependencies:{
                        title:["imageUrl"]
                    }
                },
                l:{
                    type:"string",
                    description:"Enter your lambda function name/ARN to dynamically create or modify answers, or to redirect to a different question.",
                    title:"Lambda Hook"
                },
                args:{
                    title:"Lambda Hook Arguments",
                    description:"If you named a lambda hook above and it requires additional information beyond what you've entered for this document, enter that information here.  You should not add anything here unless the lambda hook you named has been specifically coded to handle it.",
                    type:"array",
                    items:{
                        title:"Argument",
                        type:"string",
                        maxLength:140
                    }
                }
            },
            required:["qid","q","a"]
        }
    },
    properties:{
        qid:{
            type:"keyword"
        },
        questions:{
            type:"nested",
            properties:{
                q:{
                    type:"text",
                    analyzer:"english"
                }
            }
        },
        a:{
            type:"text",
            analyzer:"english"
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
                
