var Promise=require('bluebird')

module.exports=(A)=>class Add extends A{
    listQA(){
        this.client=this.client
        .execute(function(){
            var out=[]
            var list=document
                .querySelectorAll('tbody tr:not(.datatable__expand-row)')
                .forEach(x=>out.push(x.id.replace(/^qa-/,'')))
            return out.filter(x=>x)
        })
        return Promise.resolve(this.client)
    }
}
