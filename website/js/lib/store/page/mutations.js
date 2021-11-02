// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
