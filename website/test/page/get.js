var Promise=require('bluebird')
var _=require('lodash')

module.exports=(A)=>class Get extends A{
    async select(id){
        //await this.client.execute(function(id){
        //  document.getElementById(`qa-${id}-select`).click()
        //},id)
    }
    async listQA(){
        return await this.client.execute(function(){
            var out=[]
            var list=document
                .querySelectorAll('tbody tr:not(.datatable__expand-row)')
                .forEach(x=>out.push(x.id.replace(/^qa-/,'')))
            return out.filter(x=>x)
        })
    }
    async exists(id){
        //await this.setFilter(id)
        //await this.client.waitUntil(function(){
        //  this.execute(function(id){
        //      return !!document.getElementById(`qa-${id}`)
        //  },id)
        //})
        //await this.setFilter("")
    }
    async notExists(){
        //await this.setFilter(id)
        //await this.client.waitUntil(function(){
        //  this.execute(function(id){
        //      return !document.getElementById(`qa-${id}`)
        //  },id)
        //})
        //await this.setFilter("")

    }
    async setFilter(text){
        //await this.client.execute(function(text){
        //  document.getElementById('#filter'`).value=text
        //},text)
    }
    async get(id){
        //await this.setFilter(id)
        //await this.client.waitUntil(async function(){
        //  var count=await this.listQA()
        //  return count.length===1
        //},2000)
        //var fields=await this.client.execute(funtion(id){
        //  var out=[]
        //  var nodes=document.querySelectorAll(`[data-path^="${id}-"]`)
        //  nodes.forEach(function(node){
        //      out.push({
        //            path:node.dataset['data-path'].match(RegExp(`^${id}-(.*)`)[1],
        //            value:node.innerText
        //        })
        //  })
        //  return out
        //},id)
        //  var out={}
        //  fields.map(x=>_.set(out,x.path,x.value))
        //  await this.setFilter('')
        //  return out
    }
    async test(text,topic){
        //await this.client.execute(function(text,topic){
        //  document.getElementById('query').value=text
        //  document.getElementById('topic').value=topic
        //},text,topic)
        //await this.waitClick('query-test')
    }
}
