var fs=require('fs')
module.exports={
    "dashboard":{
        "Type" : "AWS::CloudWatch::Dashboard",
        "Properties" : {
            "DashboardName" : {"Ref":"AWS::StackName"},
            "DashboardBody" : {"Fn::Sub":JSON.stringify(require('./body'))}
        }
    }
}





