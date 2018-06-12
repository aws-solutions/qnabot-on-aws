/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var aws=require('./aws')
var cw=new aws.CloudWatch()
var recycled=false

exports.recycle=function(){
    var out=cw.putMetricData({MetricData: [{
          MetricName: 'lambda-recycle', 
          Dimensions: [
            {
              Name: "function", 
              Value: process.env.AWS_LAMBDA_FUNCTION_NAME
            }
          ],
          StorageResolution: 1,
          Timestamp: new Date() ,
          Value: recycled ? 1 : 0,
          Unit:"Count"
      }],
      Namespace: 'GeoTag' 
    }).promise()
    recycled=true
    return out
}

exports.compression=function(ratio,stage){
    console.log(ratio)
    return cw.putMetricData({MetricData: [{
          MetricName: 'compression', 
          Dimensions: [
            {
              Name: "function", 
              Value: process.env.AWS_LAMBDA_FUNCTION_NAME
            }
          ],
          StorageResolution: 1,
          Timestamp: new Date() ,
          Value: ratio,
          Unit:"Percent"
        }
      ],
      Namespace: 'vmware-demo' 
    }).promise()
}
