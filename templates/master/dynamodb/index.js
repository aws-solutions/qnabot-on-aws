module.exports={
    "UsersTable": {
        "Type" : "AWS::DynamoDB::Table",
        "Properties" : {
            "BillingMode" : "PAY_PER_REQUEST",
            "AttributeDefinitions" : [
                {
                "AttributeName" : "UserId",
                "AttributeType" : "S"   
                },
            ],
            "KeySchema" : [
                {
                "AttributeName" : "UserId",
                "KeyType" : "HASH"
                }
            ]
        }
    }
}
