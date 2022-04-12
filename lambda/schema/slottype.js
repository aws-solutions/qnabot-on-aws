module.exports={
    type:"object",
    description:"Quiz documents",
    properties:{
        qid:{
            type:"string",
            title:"Slot type name",
            description:"Assign a unique Slot Type Name. This should not be the same as any other SlotType, QNA, or Quiz item ID.  Valid characters: A-Z, a-z, 0-9, -, _",
            maxLength:100,
            propertyOrder:0
        },
        descr:{
            type:"string",
            title:"Description",
            description:"",
            maxLength:200,
            propertyOrder:1
        },
        resolutionStrategyRestrict:{
            type:"boolean",
            title:"Restrict slot values - use only values provided",
            description:"Check to use only the slot values provided (TopResolution). If not checked, use values as as representative values for training (OriginalValue).",
            propertyOrder:2
        },
        slotTypeValues:{
            title:"Slot type values",
            type:"array",
            description:"List of values used to train the machine learning model to recognize values for a slot.",
            items:{
                type:"object",
                properties:{
                    samplevalue: {
                        title:"Value",
                        type:"string",
                        maxLength:140,
                        propertyOrder: 0,
                    },
                    synonyms: {
                        title:"Synonyms",
                        description: "Optional comma (',') separated list of synonyms, used only when 'Restrict slot values' is selected.",
                        type:"string",
                        maxLength:140,
                        propertyOrder: 1,                       
                    }
                }
            },
            propertyOrder:3
        },
    },
    required:["qid"]
}
