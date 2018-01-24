var Promise=require('bluebird')

module.exports=(A)=>class Add extends A{
    async importFile(file_path){
        var file=file_path.split('/').reverse()[0]
        await this.waitClick('#choose-file')
        this.client=this.client
        .waitForVisible('#upload-file')
        .chooseFile("#upload-file",file_path)
        .waitForVisible("#import-loading",3000)
        .waitForVisible("#import-success",10000)
        .execute(function(){
            document.getElementById('import-close').click()
        })
        this.client=wait(this.client,file)
        
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

        this.client=wait(this.client,"url-import")
        return Promise.resolve(this.client)
    }
}

function wait(client,name){
    return client.waitForVisible("#import-jobs",3000)
    .waitForVisible("#import-job-refresh",3000)
    .click("#import-job-refresh")
    .waitForVisible("#import-jobs",3000)
    .waitUntil(function(){
        return this
        .waitForVisible("#import-job-refresh",3000)
        .click("#import-job-refresh")
        .waitForVisible("#import-jobs",3000)
        .execute(function(filename){
            var job=document.getElementById("import-job-"+filename)
            return job ? job.dataset.status==="Complete" : false
        },name).then(x=>x.value)
    },2000,"timeout waiting for job completion",500)
}
