var Promise=require('bluebird')

module.exports=(A)=>class Add extends A{
    async importFile(file_path){
        await this.clickWait('#choose-file')
        
        this.client=this.client
        .waitForVisible('#upload-file')
        .chooseFile("#upload-file",file_path)
        .waitForVisible("#import-loading",3000)
        .waitForVisible("#import-success",10000)
        .execute(function(){
            document.getElementById('import-close').click()
        })
        return Promise.resolve(this.client)
    }
    async importUrl(url){
        this.client=this.client
        .waitForVisible('#url')
        .setValue('#url',url)
        .waitForVisible('#import-url')
        .click('#import-url')
        .waitForVisible('#confirm-import-url')
        .click('#confirm-import-url')
        .waitForVisible("#import-loading",3000)
        .waitForVisible("#import-success",10000)
        .execute(function(){
            document.getElementById('import-close').click()
        })
        return Promise.resolve(this.client)
    }

}
