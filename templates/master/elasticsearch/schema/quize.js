module.exports={
    _meta:{
        schema:{
            type:"object",
            description:"Quize documents",
            properties:{
                qid:{
                    type:"string",
                    title:"Item ID",
                    description:"Assign a unique identifier for this item",
                    maxLength:100
                },
                answers:{
                    title:"Answers",
                    description:"Enter one or more answers",
                    type:"array",
                    items:{
                        title:"Answer",
                        type:"string",
                        maxLength:140
                    }
                },
                question:{
                    type:"string",
                    title:"Question",
                    description:"Enter the question a user is asked",
                    maxLength:8000,
                }
            },
            required:["qid","question","answers"]
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
        answers:{
            type:"text",
            analyzer:"english"
        }
    }
}
                
