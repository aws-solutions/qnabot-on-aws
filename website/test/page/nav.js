var Promise=require('bluebird')

module.exports=(A)=>class Nav extends A{
    _goTo(name){
        this.client=this.client
        .waitForVisible('#nav-open')
        .executeAsync(function(linkName,done){
            document.querySelector('.navigation-drawer')
                .addEventListener("transitionend",handler)
            document.getElementById('nav-open').click()
            
            function handler(event){
                if(event.propertyName==="transform"){
                    event.target
                    .removeEventListener(event.type, arguments.callee);

                    event.target
                    .addEventListener("transitionend",function(event2){
                        event2.target.removeEventListener(event2.type, arguments.callee);
                        done()
                    })
                    
                    document.querySelector(`#page-link-${linkName}`).click()
                }
            }
        },name)
        return Promise.resolve(this.client)
    }
    goToImport(){
        return this._goTo('import')
    }
    goToExport(){
        return this._goTo('export')
    }
    async goToEdit(){
        await this._goTo('edit')
        this.client=this.client.waitForVisible('#questions-tab')
            .click('#questions-tab')
        return this.client
    }
    async goToTest(){
        await this._goTo('edit')
        this.client=this.client.waitForVisible('#test-tab')
            .click('#test-tab')
        return this.client
    }
    goToAlexa(){
        return this._goTo('alexa')
    }
    goToHooks(){
        return this._goTo('hooks')
    }
    async goToClient(){
        this.client=this.client
        .waitForVisible('#nav-open')
        .executeAsync(function(done){
            document.querySelector('.navigation-drawer')
                .addEventListener("transitionend",handler)
            document.getElementById('nav-open').click()
            
            function handler(event){
                if(event.propertyName==="transform"){
                    event.target.removeEventListener(event.type, arguments.callee);
                    done()
                }
            }
        })
        .execute(function(){
            document.getElementById('page-link-client').click()
        })
        .then(async function(){
            var id=await this.getCurrentTabId()
            var tabs=await this.getTabIds()

            var tab=tabs.filter(x=>x!==id)[0]
            return this.switchTab(tab)
        })
        .waitForVisible('#qna-client',10000)
        return Promise.resolve(this.client)
    }

}
