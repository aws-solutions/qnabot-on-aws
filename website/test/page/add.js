var Promise=require('bluebird')

module.exports=(A)=>class Add extends A{
    async add(qa){
        //await this.waitClick("#add-question-btn")
        //await this.client.waitForVisible("#add-question-form")
        //await set('add',qa,this.client) 
        //await this.waitClick("#add-question-submit")
        //await this.client.watiForVisible("#add-success")
        //await this.waitClick('#add-close')
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
        //await this.waitClick("#lex-rebuild")
        //await this.client.waitForVisible("#lex-success",60*1000)
        //await this.waitClick("#lex-close")
    }
}

async function set(path,object,client){
    if(Array.isArray(object)){
        var count=await client.execute(function(path,value){
            var count=0
            var nodes=document.querySelector(`input[data-path^="${path}["]`)
            nodes.forEach(x=>{
                if(x.dataset['data-path'].match(RegExp(`^${path}[\d+]$`))){
                    count++
                }
            })
            return count 
        },path,object)

        if(count>object.length){
            for(i=0;i<count-object.length;i++){ 
                await client.execute(function(path,done){
                    document.querySelector(`[data-path="${path}-remove-0`)
                    setTimeout(done,500)
                })
            }
        }else if(count<object.length){
            for(i=0;i<object.length-count;i++){ 
                await client.execute(function(path,done){
                    document.querySelector(`[data-path="${path}-add`)
                    setTimeout(done,500)
                })
            }
        }
        object.forEach((x,i)=>{
            set(`${path}[${i}]`,x)
        })   
    }else if(typeof object==="object"){
        Object.keys(object)
            .forEach(key=>set(`${path}.${key}`,object[key]))
    }else if(typeof object==="string"){
        client.execute(function(path,value){
            document.querySelector(`input[data-path="${path}"]`).value=value
        },path,object)
    }
}





