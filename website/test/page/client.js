var Promise=require('bluebird')

module.exports=(A)=>class Client extends A{
    async ask(text){
        //var self=this
        //await this.client.setValue('#text-input',text)
        //await this.client.pressKeyCode('Enter')
        //await this.client.waitUntil(async function(){
        //  var messages=await self._getMessages().reverse()
        //  return messages[0].type==="bot" && messages[1].text===text
        //})
        //return (await this._getMessages()).reverse()[0].text
    } 
    async _getMessages(){
        //await this.client.execute(function(){
        //  var out=[]
        //  document.querySelectorAll('.message')
        //      .forEach(node=>function(node){
        //          out.push({
        //              type:node.classList.contains('message-bot') ? "bot" : "human",
        //              text:node.innerText
        //          })
        //      })
        //  return out
        //})
    }
}
