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

var parse=function(item,context){
  if(!item.body.r){
    item.body.r={
        title:"",
        imageUrl:""
    }
  }
  return {
    qid:{
      text:item.body.qid,
      tmp:item.body.qid
    },
    answer:{
      text:item.body.a,
      tmp:item.body.a
    },
    card:{
      text:JSON.stringify(item.body.r,null,4) ||"",
      title:{
        text:item.body.r.title ||"",
        tmp:item.body.r.title ||""
      },
      imageUrl:{
        text:item.body.r.imageUrl ||"",
        tmp:item.body.r.imageUrl ||""
      }
    },
    questions:item.body.q.map(Q=>({text:Q,tmp:Q})),
    open:false,
    edit:false,
    select:context.state.selectIds.includes(item.body.qid),
    deleting:false,
    score:item.score || 0 
  }
}

var handle=function(reason){
    var self=this
    return function(err){
        console.log("Error:",err)
        self.commit('setError',reason)
        self.commit('stopLoading')
        return Promise.reject(reason)
    }
}
var load=function(list){
    var self=this 
    self.commit('startLoading') 
    return Promise.resolve(list)
    .get('qa')
    .each(result=>self.commit('addQA',parse(result,self)))
    .then(()=>self.commit('setTotal',self.state.QAs.length))
    .tapCatch(e=>console.log('Error:',e))
    .catchThrow('Failed to load')
    .finally(()=>self.commit('stopLoading'))
}

module.exports={
    setMode(context,mode){
        context.commit('setMode',mode)
        if(mode==='questions'){
            context.dispatch('goToPage',context.state.page.current)
        }else{
        }
    },
    deleteSelected(context){
        var list=context.state.selectIds.map(function(qid){
            return {
                index:context.state.QAs.findIndex(qa=>qa.qid.text===qid),
                qid
            }
        })
        
        return Promise.all(
            list.map(data=>context.dispatch('removeQA',data))
        )
    },
    build(context){
        return context.state.client.build()
        .delay(10*1000)
        .then(function(){
            return new Promise(function(res,rej){
                var next=function(count){
                    context.state.client.status()
                    .tap(console.log)
                    .then(function(stat){
                        console.log("tries:"+count)
                        if(stat==="READY"){
                            res()
                        }else if(stat==="BUILDING"){
                            count>0 ? setTimeout(()=>next(--count),1000) : rej("TimeOut")
                        }else{
                            rej("Error:"+stat.error)
                        }
                    })
                }
                next(100)
            })
        })
        .tapCatch(handle.bind(context)('Failed to Build'))
    },
    setFilter(context,query){
        context.commit('clearQA')
        context.commit('setFilter',query)
        return context.dispatch('get',0)
    },
    goToPage(context,index){
        context.commit('clearQA')
        context.commit('setPage',index)
        context.commit('startLoading')
        return context.dispatch('get',index)
        .tap(()=>context.commit('stopLoading'))
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to Build')
    },
    nextPage(context){
        var index=context.state.page.current+1
        var total=Math.ceil(context.state.page.total/context.state.page.perpage)
        index=index > total-1 ? total-1 : index
        return context.dispatch('goToPage',index)
    },
    previousPage(context){
        var index=context.state.page.current-1
        index=index < 0 ? 0 : index
        return context.dispatch('goToPage',index)
    },
    botinfo(context){
        return context.state.client.botinfo()
        .then(function(data){
            context.commit('setBotInfo',data)
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed get BotInfo')
    },
    download(context){
        return context.state.client.list('all')
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

      return context.state.client.list('all','('+filter+')')
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
                return context.state.client.bulk(data)
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
    },
    search(context,{query}){
      context.commit('clearQA')
      context.commit('startLoading')
      return load.bind(context)(context.state.client.search(query))
      .tapCatch(e=>console.log('Error:',e))
      .catchThrow('Failed to search')
    },
    get(context,page){
        context.commit('startLoading')
        return context.state.client.list(
            page,
            context.state.filter.query,
            context.state.page.perpage)
        .tap(x=>console.log("results",x))
        .tap(result=>{
            return context.state.QAs=context.state.QAs
                        .concat(result.qa.map(x=>parse(x,context)))
            }
        )
        .tap(result=>context.commit('setTotal',result.total))
        .then(result=>result.qa.length)
        .tap(()=>context.commit('stopLoading'))
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to get')
    },
    getAll(context){
        context.commit('clearQA')
        context.commit('startLoading')
         
        return new Promise(function(resolve,reject){
            var next=function(index){
                return context.dispatch('get',index)
                    .then(count=>count < 1 ? resolve() : next(++index))
                    .error(err=>reject(err))
            }
            next(0)
        })
        .tap(()=>context.commit('stopLoading'))
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to getAll')
    },
    update(context,{qa}){
        return context.state.client.update(
            qa.qid.text,
            qa.questions.map(x=>x.text),
            qa.answer.text,
            qa.qid.text,
            JSON.parse(qa.card.text))
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to update')
    },
    add(context,input){
      context.commit('startLoading')
      if(input){
        input.qa.questions.push({text:"",tmp:""})
        context.commit('stopLoading')
      }else{
        context.state.page.total++
        context.commit('addQA',{
            answer:{text:"",tmp:""},
            questions:[{text:"",tmp:""}],
            qid:{text:"",tmp:""},
            card:{
                text:JSON.stringify({}),
                title:{
                    text:"",
                    tmp:""
                },
                imageUrl:{
                    text:"",
                    tmp:""
                }
            },
            open:true,
            edit:true,
            score:0
        })
      }
    },
    removeQ(context,{index,item}){
      context.commit('startLoading')
      
      item.questions.splice(index,1)
      context.dispatch('update',{qa:item})
      .tapCatch(e=>console.log('Error:',e))
      .catchThrow('Failed to remove')
    },
    removeQA(context,{index,qid}){
      context.commit('startLoading')
      console.log(index,qid)
      
      return context.state.client.remove(qid)
      .then(()=>context.commit('delQA',index))
      .tapCatch(e=>console.log('Error:',e))
      .catchThrow('Failed to remove')
    },
    changeId(context,{qa,New}){
        return context.state.client.check(New)
        .tap(console.log)
        .then(val=>val ? Promise.resolve() : Promise.reject('Id:'+New+' already exists'))
        .then(function(){
            var rm=qa.qid.text ? context.state.client.remove(qa.qid.text) :Promise.resolve()
            qa.qid.text=New
            var add=context.state.client.add(
                qa.questions.map(item=>item.text),
                qa.answer.text,
                JSON.parse(qa.card.text),
                qa.qid.text)

            return Promise.join(rm,add)
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to change Id')
    }
}
