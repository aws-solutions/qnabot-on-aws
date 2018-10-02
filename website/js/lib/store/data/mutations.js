/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var set=require('vue').set
module.exports={
    close(store){
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
            store.commit('setError',"Please save or cancel your work",{root:true})
            return false
        }else{
            store.QAs.forEach(function(qa){
                qa.open=false
                qa.edit=false
            })
            return true
        }
    },
    selectAll(store,value){
        store.QAs.map(x=>x.select=value)
    },
    setFilter(store,query){
        store.filter=query
    },
    clearFilter(store){
        store.filter=null
    },
    addQA(state,qa){
        set(qa,'selected',false)
        state.QAs.unshift(qa)
    },
    schema(state,schema){
        state.schema=schema
        
        /*.....................qna schema........................*/
        
        //top level schema attribute order 
        state.schema.qna.properties.qid.propertyOrder=0
        state.schema.qna.properties.q.propertyOrder=1
        state.schema.qna.properties.a.propertyOrder=2
        state.schema.qna.properties.alt.propertyOrder=3
        state.schema.qna.properties.t.propertyOrder=4
        state.schema.qna.properties.r.propertyOrder=5
        state.schema.qna.properties.l.propertyOrder=6
        state.schema.qna.properties.args.propertyOrder=7
        state.schema.qna.properties.next.propertyOrder=8
        
        //response card property order
        state.schema.qna.properties.r.properties.title.propertyOrder=0
        state.schema.qna.properties.r.properties.subTitle.propertyOrder=1
        state.schema.qna.properties.r.properties.imageUrl.propertyOrder=2
        state.schema.qna.properties.r.properties.buttons.propertyOrder=3
        
        //response card button property order
        state.schema.qna.properties.r.properties.buttons.items.properties.text.propertyOrder=0
        state.schema.qna.properties.r.properties.buttons.items.properties.value.propertyOrder=1
        
        /*.....................quiz schema........................*/
        state.schema.quiz.properties.qid.propertyOrder=0
        state.schema.quiz.properties.question.propertyOrder=1
        state.schema.quiz.properties.correctAnswers.propertyOrder=2
        state.schema.quiz.properties.incorrectAnswers.propertyOrder=3
        state.schema.quiz.properties.quiz.propertyOrder=4
        state.schema.quiz.properties.responses.propertyOrder=5
        state.schema.quiz.properties.next.propertyOrder=6
        state.schema.quiz.properties.r.propertyOrder=7
        
        //responses property order
        state.schema.quiz.properties.responses.properties.correct.propertyOrder=0
        state.schema.quiz.properties.responses.properties.incorrect.propertyOrder=1
        state.schema.quiz.properties.responses.properties.end.propertyOrder=2
        
        //response card property order
        state.schema.quiz.properties.r.properties.title.propertyOrder=0
        state.schema.quiz.properties.r.properties.subTitle.propertyOrder=1
        state.schema.quiz.properties.r.properties.imageUrl.propertyOrder=2
        state.schema.quiz.properties.r.properties.buttons.propertyOrder=3
        
        //response card button property order
        state.schema.quiz.properties.r.properties.buttons.items.properties.text.propertyOrder=0
        state.schema.quiz.properties.r.properties.buttons.items.properties.value.propertyOrder=1       

    },
    delQA(state,QA){
        var index=state.QAs.findIndex(qa=>qa.qid===QA.qid)
        state.QAs.splice(index,1)
    },
    clearQA(state){
        state.QAs=[]
    },
    results(state,new_results){
        state.results=new_results
    }
}
