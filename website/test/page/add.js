var Promise=require('bluebird')

module.exports=(A)=>class Add extends A{
    async add(qa){
        await this.waitClick("#add-question-btn")
        await this.client.waitForVisible("#add-question-form")
        await this._set('add',qa) 
        await this.waitClick("#add-question-submit")
        await this.client.waitForExist("#add-success",3000)
        await this.waitClick('#add-close')
        await this.exists(qa.qid)
    }
    async edit(qa){
        //await this.setFilter(id)
        //await this.client.execut(function(id){
        //   document.getElementById(`qa-${id}-edit`).click() 
        //},qa.qid)
        //await this.client.waitForVisible("#edit-form")
        //await set('edit',qa,this.client) 
        //await this.client.click('#edit-submit')
        //await this.client.watiForVisible("#edit-success")
        //await this.waitClick('#edit-close')
    }
    async buildBot(){
        await this.waitClick("#edit-sub-menu")
        await this.waitClick("#lex-rebuild")
        await this.client.waitForVisible("#lex-success",60*1000)
        await this.waitClick("#lex-close")
    }
    async _set(path,object){
        var client=this.client
        var self=this
        if(Array.isArray(object)){
            var count=(await client.execute(function(path,value){
                var count=0
                var nodes=document.querySelectorAll(`[data-path^="${path}["]`)
                nodes.forEach(x=>{
                    if(x.dataset.path.match(RegExp(`^${path}[\\d+]$`))){
                        count++
                    }
                })
                return count 
            },path,object)).value
            console.log(path)
            if(count>object.length){
                for(var i=0;i<count-object.length;i++){ 
                    await client.execute(function(path,done){
                        document.getElementById(`${path}-remove-0`).click()
                        setTimeout(done,500)
                    },path)
                }
            }else if(count<object.length){
                for(var i=0;i<object.length-count;i++){ 
                    await client.execute(function(path,done){
                        document.getElementById(`${path}-add`).click()
                        setTimeout(done,500)
                    },path)
                }
            }
            object.forEach((x,i)=>{
                self._set(`${path}[${i}]`,x)
            })   
        }else if(typeof object==="object"){
            Object.keys(object)
                .forEach(key=>self._set(`${path}.${key}`,object[key]))
        }else if(typeof object==="string"){
            client.setValue(`[data-path="${path}"]`,object)
        }
    }
}







