var fs=require('fs');
var resource=require('../util/resource');
var lambda=require('../util/lambda');
var mock=require('../util/mock');
var _=require('lodash');
const util = require('../../../util');

module.exports={
    "Jobs": resource('jobs'),
    "JobsGet":mock({
        auth:'AWS_IAM',
        method:"GET",
        subTemplate:"jobs/info",
        resource:{"Ref":"Jobs"}
    }),
    "testalls": resource('testall',{"Ref":"Jobs"}),
    "testallsList":lambda({
        authorization:"AWS_IAM",
        method:"get",
        lambda:{"Fn::GetAtt":["S3ListLambda","Arn"]},
        subTemplate:fs.readFileSync(__dirname+'/list-testall.vm','utf8'),
        resource:{"Ref":"testalls"},
        parameterLocations:{
            "method.request.querystring.perpage":false,
            "method.request.querystring.token":false
        }
    }),
    "testall": resource('{proxy+}',{"Ref":"testalls"}),
    "testallPut":proxy({
        resource:{"Ref": "testall"},
        auth:"AWS_IAM",
        method:"PUT",
        bucket:{"Ref":"TestAllBucket"},
        path:"/status/{proxy}",
        template:fs.readFileSync(`${__dirname}/testall-start.vm`,'utf-8'),
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "testallGet":proxy({
        resource:{"Ref": "testall"},
        auth:"AWS_IAM",
        method:"GET",
        bucket:{"Ref":"TestAllBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "testallDelete":proxy({
        resource:{"Ref": "testall"},
        auth:"AWS_IAM",
        method:"delete",
        bucket:{"Ref":"TestAllBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "exports": resource('exports',{"Ref":"Jobs"}),
    "exportsList":lambda({
        authorization:"AWS_IAM",
        method:"get",
        lambda:{"Fn::GetAtt":["S3ListLambda","Arn"]},
        subTemplate:fs.readFileSync(__dirname+'/list-export.vm','utf8'),
        resource:{"Ref":"exports"},
        parameterLocations:{
          "method.request.querystring.perpage":false,
          "method.request.querystring.token":false
        }
    }),
    "export": resource('{proxy+}',{"Ref":"exports"}),
    "imports": resource('imports',{"Ref":"Jobs"}),
    "exportPut":proxy({
        resource:{"Ref": "export"},
        auth:"AWS_IAM",
        method:"PUT",
        bucket:{"Ref":"ExportBucket"},
        path:"/status/{proxy}",
        template:fs.readFileSync(`${__dirname}/export-start.vm`,'utf-8'),
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "exportGet":proxy({
        resource:{"Ref": "export"},
        auth:"AWS_IAM",
        method:"GET",
        bucket:{"Ref":"ExportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "exportDelete":proxy({
        resource:{"Ref": "export"},
        auth:"AWS_IAM",
        method:"delete",
        bucket:{"Ref":"ExportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "importsList":lambda({
        authorization:"AWS_IAM",
        method:"get",
        lambda:{"Fn::GetAtt":["S3ListLambda","Arn"]},
        subTemplate:fs.readFileSync(__dirname+'/list.vm','utf8'),
        resource:{"Ref":"imports"},
        parameterLocations:{
          "method.request.querystring.perpage":false,
          "method.request.querystring.token":false
        }
    }),
    "import": resource('{proxy+}',{"Ref":"imports"}),
    "importGet":proxy({
        resource:{"Ref": "import"},
        auth:"AWS_IAM",
        method:"get",
        bucket:{"Ref":"ImportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "importDelete":proxy({
        resource:{"Ref": "import"},
        auth:"AWS_IAM",
        method:"delete",
        bucket:{"Ref":"ImportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "S3ListLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["S3ListLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Api"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "S3ListLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess(),
          {
            "PolicyName" : "S3ListPolicy",
            "PolicyDocument" : {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["S3:List*"],
                  "Resource":["*"]
                }
              ]
            }
          }
        ]
      },
      "Metadata": util.cfnNag(["W11", "W12"])
    },
};

function proxy(opts){
    return {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": opts.auth || "AWS_IAM",
        "HttpMethod":opts.method.toUpperCase(),
        "Integration": _.pickBy({
          "Type": "AWS",
          "IntegrationHttpMethod":opts.method.toUpperCase(),
          "Credentials":{"Fn::GetAtt":["S3AccessRole","Arn"]},
          "Uri": {"Fn::Join": ["",[
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":s3:path/",opts.bucket,
                opts.path
          ]]},
          "RequestParameters":opts.requestParams || {},
          "RequestTemplates": opts.template ? {
                "application/json":{"Fn::Sub":opts.template }
          }:null,
          "IntegrationResponses": [
            {
                "StatusCode":200,
                "ResponseParameters":Object.assign({
                    "method.response.header.content-type":"integration.response.header.Content-Type"
                },
                opts.responseParameters)
            },{
                "StatusCode":404,
                "ResponseTemplates":{
                    "application/xml":JSON.stringify({
                        error:"Job not found"
                    })
                },
                "SelectionPattern":"403"
            }
          ]
        }),
        "RequestParameters":{
            "method.request.path.proxy":false
        },
        "ResourceId":opts.resource,
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseParameters":Object.assign({
                "method.response.header.content-type":false
            },
            _.mapValues(opts.responseParameters || {},x=>false))
          },
          {"StatusCode": 400},
          {"StatusCode": 404}
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
}
