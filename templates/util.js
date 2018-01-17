exports.stack=function(name,parameters){
    return {
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" : {"Fn::Join":["/",[
                "https://s3.amazonaws.com",
                {"Ref":"BootstrapBucket"},
                {"Ref":"BootstrapPrefix"},
                "templates/"+name+'.json'
            ]]},
            "Parameters":Object.assign({
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
            },parameters)
        }
    }
}

exports.stacktest=function(name,parameters){
    return {
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" : {"Fn::Join":["/",[
                "https://s3.amazonaws.com",
                {"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
                {"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"},
                "templates/"+name+'.min.json'
            ]]},
            "Parameters":Object.assign({
                "BootstrapBucket":{"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
                "BootstrapPrefix":{"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"}
            },parameters)
        }
    }
}
