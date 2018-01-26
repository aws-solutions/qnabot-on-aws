module.exports={
    _meta:{
        schema:{
            type:"object",
            properties:{
                qid:{
                    type:"string",
                    title:"Item ID",
                    description:"Assign a unique identifier for this item",
                    maxLength:100
                },
                q:{
                    title:"Questions",
                    description:"Enter one or more questions that a user might ask",
                    type:"array",
                    items:{
                        title:"Question",
                        type:"string",
                        maxLength:140
                    }
                },
                a:{
                    type:"text",
                    title:"Anwser",
                    description:"Enter the answer you want to be returned when user asks one of the above questions",
                    maxLength:8000,
                },
                t:{
                    type:"text",
                    description:"Assign a topic to this item, to support follow up questions on the same topic.",
                    title:"Topic"
                },
                r:{
                    title:"Response card",
                    description:"Attach images to your answer",
                    type:"object",
                    properties:{
                        title:{
                            type:"text",
                            title:"Card Title",
                            description:"",
                            maxLength:100
                        },
                        text:{
                            type:"text",
                            title:"Card Text",
                            description:"",
                            maxLength:5000
                        },
                        url:{
                            type:"text",
                            description:"",
                            title:"Card Image Url",
                            format:'url',
                            maxLength:2000
                        }
                    }
                },
                l:{
                    type:"string",
                    description:"Enter you lambda function name/ARN to dynamically create or modify answers, or to redirect to a different question.",
                    title:"Lambda Hook"
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
                url:{type:"keyword"},
                text:{type:"text"},
                title:{type:"text"}
            }
        },
        l:{
            type:"keyword"
        }
    }
}
                
