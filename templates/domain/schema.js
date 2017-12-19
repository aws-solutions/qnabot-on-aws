module.exports={
    _meta:{
        schema:{
            type:"object",
            properties:{
                qid:{
                    type:"string",
                    title:"Question ID",
                    description:"The unique ID for this question",
                    maxLength:100
                },
                q:{
                    title:"Questions",
                    description:"questions to ask",
                    type:"array",
                    items:{
                        type:"string",
                        maxLength:140
                    }
                },
                a:{
                    type:"string",
                    title:"Anwser",
                    description:"The answer or response for this question",
                    maxLength:8000,
                },
                t:{
                    type:"string",
                    description:"The topics of this question",
                    title:"Topic"
                },
                r:{
                    title:"Response card",
                    description:"The media rich response card",
                    type:"object",
                    properties:{
                        title:{
                            type:"string",
                            title:"Card Title",
                            description:"",
                            maxLength:100
                        },
                        text:{
                            type:"string",
                            title:"Card Text",
                            description:"",
                            maxLength:5000
                        },
                        url:{
                            type:"string",
                            description:"",
                            title:"Card Image Url",
                            format:'url',
                            maxLength:2000
                        }
                    }
                },
                l:{
                    type:"string",
                    description:"The lambda Arn used to dynamicaly alter anwser",
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
                    type:"string",
                    analyzer:"english"
                }
            }
        },
        a:{
            type:"text",
            analyzer:"english"
        },
        t:{
            type:'string',
            norms:false,
            analyzer:"whitespace" 
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
                
