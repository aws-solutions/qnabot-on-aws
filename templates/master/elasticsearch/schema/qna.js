module.exports={
    _meta: {
        schema: {
            properties: {
                qid: {
                    type: "string",
                    title: "Item ID",
                    description: "Assign a unique identifier for this item.",
                    maxLength: 100,
                    propertyOrder: 0
                },
                required: ["qid"]
            }
        },
    },
    properties:{
        qid:{
            type:"keyword"
        },
    }
}
                
