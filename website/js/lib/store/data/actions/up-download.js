// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')
var validator = new (require('jsonschema').Validator)();
var axios=require('axios')
var util=require('./util')
var api=util.api

module.exports={
    download(context){
        return api(context,'list',{from:'all'})
        .then(function(result){
            console.log(result)
          var blob = new Blob(
            [JSON.stringify({qna:result.qa},null,3)], 
            {type: "text/plain;charset=utf-8"}
          );
          return blob
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to Download')
    },
    downloadLocal(context){
      var qna=context.state.QAs.map(function(qa){
            return {
                q:qa.questions.map(item=>item.text),
                a:qa.answer.text,
                r:JSON.parse(qa.card.text),
                qid:qa.qid.text
            }
      })
      var blob = new Blob(
        [JSON.stringify({qna:qna},null,3)], 
        {type: "text/plain;charset=utf-8"}
      );
      return Promise.resolve(blob)
    },
    downloadSelect(context){
      var filter=context.state.selectIds.map(function(literal_string) {
          return literal_string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
      }).join('|')

      return api(context,'list',{from:'all',filter:'('+filter+')'})
        .then(function(result){
            console.log(result)
          var blob = new Blob(
            [JSON.stringify({qna:result.qa},null,3)], 
            {type: "text/plain;charset=utf-8"}
          );
          return blob
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to Download')
    },
    upload(context,params){
        var out
        if(params.data){
            out=context.dispatch('uploadProcess',{data:params.data})
        }else if(params.url){
            out=context.dispatch('uploadUrl',{url:params.url})
        }else {
            out=Promise.reject('invalid params')
        }
        return out
        .tapCatch(e=>console.log('Error:',e))
    },
    uploadProcess(context,{data}){
        var v=validator.validate(data,require('./schema.json'))
        
        return Promise.try(function(){
            if(v.valid){
                return api(context,'bulk',data)
            }else{
                console.log(v)
                return Promise.reject('Invalide QnA:'+v.errors.map(err=>err.stack).join(','))
            }
        })
        .then(function(){
            context.commit('clearQA')
        }).delay(2000)
        .then(()=>context.dispatch('get',0))
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to upload')
    },
    uploadUrl(context,{url}){
        return Promise.resolve(axios.get(url))
        .get('data')
        .then(data=>context.dispatch('upload',{data}))
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Error: please check URL and source CORS configuration')
    }
}
