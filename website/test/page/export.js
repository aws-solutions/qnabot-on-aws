var Promise=require('bluebird')

module.exports=(A)=>class Export extends A{
    async exportAll(){
        return this.waitClick('#export-all').delay(1000)
    }
    async exportFilter(filter){
        this.client=this.client
            .setValue('#filter',filter)
        return this.waitClick('#export-filter').delay(1000)
    }
}
