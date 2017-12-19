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
        store.mode=mode
    },
    setPage(store,page){
        store.current=page
	},
    setTotal(store,total){
        store.total=total
    },
    incrementTotal(store,count){
        var x= count || 1
        store.page+=x
    },
    decrementTotal(store,count){
        var x= count || 1
        store.page-=x
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
    }
}
