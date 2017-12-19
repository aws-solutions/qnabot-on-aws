var stack=require('../util').stacktest
module.exports={
   "Description": "This template creates dev ElasticSearch Cluster",
   "Resources": {
        "Domain":stack('domain',{})
   },
   "Outputs": {
        "Address":{
            "Value":{"Fn::GetAtt":["Domain","Outputs.ESAddress"]},
            "Export":{
                "Name":"QNA-DEV-ES-ADDRESS"
            }
        },
        "Arn":{
            "Value":{"Fn::GetAtt":["Domain","Outputs.ESArn"]},
            "Export":{
                "Name":"QNA-DEV-ES-ARN"
            }
        },
        "Name":{
            "Value":{"Fn::GetAtt":["Domain","Outputs.ESDomain"]},
            "Export":{
                "Name":"QNA-DEV-ES-NAME"
            }
        },
        "Type":{
            "Value":{"Fn::GetAtt":["Domain","Outputs.Type"]},
            "Export":{
                "Name":"QNA-DEV-TYPE"
            }
        },
        "Index":{
            "Value":{"Fn::GetAtt":["Domain","Outputs.Index"]},
            "Export":{
                "Name":"QNA-DEV-INDEX"
            }
        }

   }
}
