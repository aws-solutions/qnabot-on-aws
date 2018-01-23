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
                    event.target.removeEventListener(event.type, arguments.callee);
                    document.querySelector(`a[href="#/${linkName}"]`).click()
                    done()
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
        this.client=await this._goToEdit('edit')
        return client.waitTillVisible('#questions-tab')
            .click('#questions-tab')
    }
    async goToTest(){
        this.client=await this._goTo('edit')
        return client.waitTillVisible('#test-tab')
            .click('#test-tab')
    }
    goToAlexa(){
        return this._goTo('alexa')
    }
    goToHooks(){
        return this._goTo('hooks')
    }
    goToClient(){
        return this._goTo('client')
    }

}
