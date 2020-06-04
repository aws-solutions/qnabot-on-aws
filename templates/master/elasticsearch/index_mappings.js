module.exports={
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
        },
        // quiz type fields
        question:{
            type:"text",
            analyzer:"custom_english"
        },
        incorrectAnswers:{
            type:"text",
            analyzer:"custom_english"
        },
        correctAnswers:{
            type:"text",
            analyzer:"custom_english"
        }
    }
}
                
