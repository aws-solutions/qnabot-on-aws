var Promise=require('bluebird')

module.exports=(A)=>class Add extends A{
    importFile(file_path){
        this.client=this.client
        .waitForVisible("#choose-file",3000)
        .click('#choose-file')
        .waitForVisible('#upload-file')
        .chooseFile("#upload-file",file_path)
        .waitForVisible("#import-loading",3000)
        .waitForVisible("#import-success",10000)
        .execute(function(){
            document.getElementById('import-close').click()
        })
        return Promise.resolve(this.client)
    }
}
