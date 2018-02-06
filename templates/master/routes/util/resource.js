module.exports=function(path,parent={"Fn::GetAtt": ["API","RootResourceId"]}){
    return {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "ParentId": parent,
        "PathPart": path,
        "RestApiId": {"Ref": "API"}
      }
    }
}


    
