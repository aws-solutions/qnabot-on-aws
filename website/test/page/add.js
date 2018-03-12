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
    async edit(id,qa){
        await this.setFilter(id)
        await this.waitClick(`#qa-${id.replace('.','\\.')}-edit .btn` )
        await this.client.waitForVisible("#edit-form")
        await this._set('edit',qa) 
        await this.client.debug()
        await this.client.execute(function(id){
           document.querySelector(id).click() 
        },'#edit-submit')
        await this.client.waitForVisible("#edit-success",10000)
        await this.waitClick('#edit-close')
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

            if(count>object.length){
                for(var i=0;i<count-object.length;i++){ 
                    await this.waitClick(`#${path.replace('.','\\.')}-remove-0`)
                    await Promise.delay(500)
                }
            }else if(count<object.length){
                for(var i=0;i<object.length-count;i++){ 
                    await this.waitClick(`#${path.replace('.','\\.')}-add`)
                    await Promise.delay(500)
                }
            }
            await Promise.all(object.map(async (x,i)=>{
                await self._set(`${path}[${i}]`,x)
            }))
        }else if(typeof object==="object"){
            await Promise.all(Object.keys(object)
                .map(async key=>await self._set(`${path}.${key}`,object[key])))
        }else if(typeof object==="string"){
            var backspace=[]
            var current=await client.getValue(`[data-path="${path}"]`)
            for(var i=0;i<current.length;i++)backspace.push("\uE003")

            await client.setValue(`[data-path="${path}"]`,backspace)
            await client.setValue(`[data-path="${path}"]`,object)
            await client.setValue(`[data-path="${path}"]`,[" ","\uE003"])
        }
    }
}







