/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')

module.exports={
    selected(state){
        return state.QAs.map(qa=>qa.select)
    },
    QAlist(state,getters,rootGetters){
        if(rootGetters.page.mode!=='test'){
            return state.QAs.sort(function(a,b){
                if (a.qid.text < b.qid.text)
                    return -1;
                if (a.qid.text > b.qid.text)
                    return 1;
                return 0;
            })
        }else{
            return state.QAs.sort(function(a,b){
                return b.score-a.score
            })
        }
    }
}
