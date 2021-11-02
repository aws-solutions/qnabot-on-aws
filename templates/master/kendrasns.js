const  util = require("../util");

module.exports={
    KendraCrawlerSnsTopic: {
        Type: "AWS::SNS::Topic",
        Metadata: util.cfnNag(["W47"])
    }
}
