var Promise=require('bluebird')

module.exports=(A)=>class Export extends A{
    async exportAll(){
        await this.waitClick('#export')
        await Promise.delay(1000)
    }
    async exportFilter(filter){
        await this.client.setValue('#filter',filter)
        await this.waitClick('#export')
        await Promise.delay(1000)
    }
}
