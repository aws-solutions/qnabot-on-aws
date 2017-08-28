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
    setMode(store,mode){
        var check=el=>el.text===el.tmp
        
        var any=store.QAs.map(function(qa){
            return qa.questions.map(check).concat([
                check(qa.answer),
                check(qa.qid),
                check(qa.card.imageUrl),
                check(qa.card.title)
            ]).includes(false)
        }).includes(true)

        if(any){
            store.error="Please save or cancel your work"
        }else{
            store.QAs.forEach(function(qa){
                qa.open=false
                qa.edit=false
            })
            store.mode=mode
        }
    },
    select(store,qa){
        qa.select=!qa.select
        if(qa.select){ 
            store.selectIds.push(qa.qid.text)
        }else{
            var index=store.selectIds.indexOf(qa.qid.text)
            store.selectIds.splice(index,1)
        }
    },
    unselectAll(store){
        store.selectIds=[]
        store.QAs.forEach(qa=>qa.select=false)
    },
    
    setFilter(store,query){
        store.filter.query=query
    },
    clearFilter(store){
        store.filter.query=null
    },
    setPage(store,page){
        store.page.current=page
	},
    setTotal(store,total){
        store.page.total=total
    },
    setBotInfo(store,data){
        store.bot.botname=data.botname
        store.bot.slotutterances=data.utterances
        store.bot.lambdaArn=data.lambdaArn
        store.bot.lambdaName=data.lambdaArn.match(/arn:aws:lambda:.*:.*:function:(.*)/)[1]
    },
    setError(store,message){
        store.error=message
    },
    clearError(store){
        store.error=null
    },
    toggleMode(store,mode){
        for(x in store.mode){
            if(x===mode){
                if(mode==="filter"){
                    store.mode[x].on=!store.mode[x].on
                }else{
                    store.mode[x]=!store.mode[x]
                }
            }else{
                if(x==="filter"){
                    store.mode[x].on=false
                }else{
                    store.mode[x]=false
                }
            }
        }
    },
    toggleSearch(store){
        store.mode.search=!store.mode.search
    },
    toggleFilter(store){
        store.mode.filter=!store.mode.filter
    },
    setUser(store,name){
        store.username=name || 'user'
    },
    startLoading(store){
        store.loading=true
    },
    stopLoading(store){
        store.loading=false
    },
    login(state){
        state.loggedIn=true
    },
    logout(state){
        state.loggedIn=false
    },
    addQA(state,qa){
        state.QAs.unshift(qa)
        state.loaded=true
    },
    delQA(state,index){
        var index_select=state.selectIds.indexOf(state.QAs[index].qid.text)
        state.selectIds.splice(index_select,1)
        state.QAs.splice(index,1)
        state.page.total--
    },
    clearQA(state){
        state.QAs=[]
        state.page.current=0
    },
    results(state,new_results){
        state.results=new_results
    },
    setClient(state,client){
        state.client=client
    },
    setId(state,Id){
        state.Id=Id
    },
    clearClient(state,client){
        state.client=null
    }
}
