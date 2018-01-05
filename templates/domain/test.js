var stack=require('../util').stacktest
module.exports={
  "Resources": {
    "domain":stack('domain',{
        "ElasticSearchArn":{"Fn::ImportValue":"QNA-DEV-ES-ARN"},
        "ElasticSearchAddress":{"Fn::ImportValue":"QNA-DEV-ES-ADDRESS"},
        "ElasticSearchName":{"Fn::ImportValue":"QNA-DEV-ES-NAME"}
    })
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
