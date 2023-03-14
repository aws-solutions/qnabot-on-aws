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
            type: "nested",
            properties: {
                q: {
                    type: "text",
                    analyzer: "custom_english"
                },
                "q_vector": { 
                    "type": "knn_vector",
                    "dimension": '${EmbeddingsDimensions}', 
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "nmslib"
                    }
                }
            }
        },
        a:{
            type:"text",
            analyzer:"custom_english"
        },
        a_vector: { 
            "type": "knn_vector",
            "dimension": '${EmbeddingsDimensions}', 
            "method": {
                "name": "hnsw",
                "space_type": "cosinesimil",
                "engine": "nmslib"
            }
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
                
