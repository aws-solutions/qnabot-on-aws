var Promise=require('bluebird')

module.exports=(A)=>class Add extends A{
    async deleteAll(){
        var self=this
        await this.waitClick('#select-all')
        await this.waitClick('#delete-all')
        await this.waitClick('#confirm-delete')
        this.client=this.client
        .waitForVisible('#delete-loading',10*1000,true)
        .waitUntil(function(){
            return self.listQA().then(x=>{
                return x.value.length<1
            })
        },2000,"qa were not cleared",100)

        return Promise.resolve(this.client)
    }
    async deleteSelection(){
        //await this.waitClick('#delete-all')
    }
    async deleteId(id){
        //await this.client.execute(function(id){
        //  document.getElementById(`qa-${id}-delete`).click()
        //},did)
        //await this.notExists(id)
    }
}
