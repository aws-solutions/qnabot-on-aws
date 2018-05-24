var fs=require('fs')
module.exports={
    "dashboard":{
        "Type" : "AWS::CloudWatch::Dashboard",
        "Properties" : {
            "DashboardName" : {"Fn::Sub":"${AWS::Region}-${AWS::StackName}"},
            "DashboardBody" : {"Fn::Sub":JSON.stringify(require('./body'))}
        }
    }
}





