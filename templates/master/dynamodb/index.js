const util = require('../../util');
module.exports={
    "UsersTable": {
        "Type" : "AWS::DynamoDB::Table",
        "Properties" : {
            "BillingMode" : "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled" : true
            },
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
        },
        "Metadata": util.cfnNag(["W74"])
    }
}
