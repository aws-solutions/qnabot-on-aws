module.exports={
   "LexV2CfnCr": {
      "Type": "AWS::Serverless::Application",
      "Properties": {
         "Location": {
            "ApplicationId": "arn:aws:serverlessrepo:us-east-1:777566285978:applications/lex-v2-cfn-cr",
            "SemanticVersion": "0.2.0"
         },
         "Parameters": {
            "LogLevel": "DEBUG"
         }
      }
   }
}
