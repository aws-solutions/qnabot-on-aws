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
                incorrectAnswers:{
                    title:"Incorrect Answers",
                    description:"Enter the incorrect answer options that the user will choose from.  These will be presented to the user alongside the correct answers you enter below.",
                    type:"array",
                    items:{
                        title:"Answer",
                        type:"string",
                        maxLength:140
                    }
                },
                correctAnswers:{
                    title:"Correct Answers",
                    type:"array",
                    description:"Enter the answer options that the quiz should grade as correct if the user selects one of them.  These will be presented to the user alongside the incorrect answers you entered above.",
                    items:{
                        title:"Correct Answer",
                        type:"string",
                        maxLength:140
                    }
                },
                next:{
                    title:"Next Questions",
                    description:"Enter the QID of the next question in the quiz into the first field.  If the first field is blank then the quiz will end after this question.  Be careful; if you set this field to an earlier question in the quiz, you might make your quiz loop forever, which would not be fun!  You can add more QIDs after the first, but they won't do anything at the moment.",
                    type:"array",
                    items:{
                        title:"nextQuestion",
                        type:"string",
                        maxLength:100
                    }
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
                
