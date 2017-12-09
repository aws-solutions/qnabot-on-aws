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
var validator = new (require('jsonschema').Validator)();
var axios=require('axios')
var _=require('lodash')

exports.api=function(context,name,args){
    return context.dispatch('api/'+name,args,{root:true})
}
exports.parse=function(item,context){
    console.log(item)
    item.body.score=item.score || 0
    _.defaults(item.body,{
        t:'',
        r:{
            title:"",
            imageUrl:""
        },
        select:false
    })
    return item.body
}

exports.handle=function(reason){
    var self=this
    return function(err){
        console.log("Error:",err)
        self.commit('setError',reason,{root:true})
        return Promise.reject(reason)
    }
}
exports.load=function(list){
    var self=this 
    return Promise.resolve(list)
    .get('qa')
    .each(result=>{ 
        self.commit('addQA',exports.parse(result,self))
        self.commit('page/setTotal',self.state.QAs.length,{root:true})
    })
    .tapCatch(e=>console.log('Error:',e))
    .catchThrow('Failed to load')
}


