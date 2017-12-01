/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

module.exports={
    captureHash:function(state){
        state.hash=location.hash.substring(1)
    },
    info:function(state,payload){
        state.info=payload
    },
    setBotInfo(store,data){
        data.lambdaName=data.lambdaArn.match(/arn:aws:lambda:.*:.*:function:(.*)/)[1]
        store.bot=data
    },
    setError(store,message){
        store.error=message
    },
    clearError(store){
        store.error=null
    }
}
