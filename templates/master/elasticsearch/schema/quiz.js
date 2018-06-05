module.exports={
    _meta:{
        schema:{
            type:"object",
            description:"Quiz documents",
            properties:{
                qid:{
                    type:"string",
                    title:"Quiz Question ID",
                    description:"Assign a unique identifier for this item.  This should not be the same as any other question or document's.",
                    maxLength:100
                },
                question:{
                    type:"string",
                    title:"Question",
                    description:"Enter a question that the bot will ask the user.",
                    maxLength:140,
                },
                correctAnswers:{
                    title:"Correct Answers",
                    type:"array",
                    description:"Enter correct answer options for this question.  Any of these options will be graded as correct if the user selects them.  These will be presented to the user in randomized order alongside the incorrect answer(s) you enter below.",
                    items:{
                        title:"Correct Answer",
                        type:"string",
                        maxLength:140
                    }
                },
                incorrectAnswers:{
                    title:"Incorrect Answers",
                    description:"Enter incorrect answer options for this question.  These will be presented to the user in randomized order alongside the correct answer(s) you entered above.",
                    type:"array",
                    items:{
                        title:"Answer",
                        type:"string",
                        maxLength:140
                    }
                },
                responses:{
                    title:"Custom Responses",
                    description:"Enter custom responses for correct answers, incorrect answers, and the response returned on finishing the quiz.",
                    type:"object",
                    properties:{
                        correct:{
                            title:"Correct Answer Response",
                            description:"Response that will be returned to the user on a correct response.",
                            type:"string",
                            maxLength:140
                        },
                        incorrect:{
                            title:"Incorrect Answer Response",
                            description:"Response that will be returned to the user on a incorrect response.",
                            type:"string",
                            maxLength:140
                        },
                        end:{
                            title:"End Quiz Response",
                            description:"The response that will be returned to the user end the end of the quiz if this is the last question",
                            type:"string",
                            maxLength:140
                        }
                    }
                },
                next:{
                    title:"Next Questions",
                    description:"Enter the QID of the next question in the quiz.  If the field is left blank then the quiz will end after this question.",
                    type:"array",
                    items:{
                        title:"nextQuestion",
                        type:"string",
                        maxLength:100
                    }
                },
                r:{
                    title:"Response card",
                    description:"Use these fields to attach images to your question.",
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
                    required:["title","imageUrl"]
                },
                quiz:{
                    type:"string",
                    title:"Quiz ID",
                    description:"ID of the quiz this question is a member of",
                    maxLength:100,
                }
            },
            required:["qid","question","incorrectAnswers","correctAnswers"]
        }
    },
    properties:{
        qid:{
            type:"keyword"
        },
        question:{
            type:"string",
            analyzer:"english"
        },
        incorrectAnswers:{
            type:"text",
            analyzer:"english"
        },
        correctAnswers:{
            type:"text",
            analyzer:"english"
        }
    }
}
