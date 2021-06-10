<template lang='pug'>
  span(class="wrapper")
    v-dialog(v-model="error" scrollable width="auto")
        v-card(id="error-modal")
          v-card-title(primary-title) Error Loading Content
          v-card-text
            li(v-for="error in errorList") {{error}}
          v-card-actions
            v-spacer
            v-btn.lighten-3(@click="error=false;errorList=[];errorMsg='';$refs.file.value = [];" :class="{ teal: success}" ) close
    v-container(column grid-list-md id="page-import")
      v-layout(column)
        v-flex
          v-card
            v-card-title.display-1.pa-2 Import
            v-card-text
              p {{importWarning}}
              p.title From File
              div.ml-4.mb-2
                input(
                  type="file"
                  name="file"
                  id="upload-file"
                  v-on:change="Getfile"
                  ref="file"
                )
              p.title From url
              div.d-flex.ml-4
                v-text-field(name="url" label="Type here to import from url" id="url" clearable v-model="url")
                v-btn(@click="Geturl"
                  style="flex:0;"
                  :disabled="url.length===0"
                  id="import-url") import
        v-flex(v-if="jobs.length>0")
          v-card(id="import-jobs")
            v-card-title.headline Import Jobs
            v-card-text
              v-list
                template(v-for="(job,index) in jobs")
                  v-list-tile(:id="'import-job-'+job.id" :data-status="job.status")
                    v-list-tile-content.job-content
                      v-list-tile-title {{job.id}}: {{job.status}}
                      v-list-tile-sub-title
                        v-progress-linear(v-model="job.progress*100")
                    v-list-tile-action.job-actions
                      v-btn(fab block icon @click="deleteJob(index)" :loading="job.loading")
                        v-icon delete
                  v-divider(v-if="index + 1 < jobs.length")
        v-flex
          v-expansion-panel
            v-expansion-panel-content
              p.headline(slot="header" id="examples-open") Examples/Extensions
              v-list(two-line)
                template(v-for="(example,index) in examples")
                  v-divider
                  v-list-tile
                    v-list-tile-avatar
                      v-tooltip(bottom)
                        span(
                          slot="activator"
                        )
                          v-icon.pr-3 info
                        span.subheading {{example.text}}
                    v-list-tile-content
                      v-list-tile-title.title {{example.id}}
                      v-tooltip(bottom)
                        span(
                          slot="activator"
                        )
                          v-list-tile-sub-title(
                          ) {{example.text}}
                        span.subheading {{example.text}}
                    v-list-tile-action
                      v-btn.example(
                        @click="importExample(example.document.href)"
                        :id="'example-'+example.id"
                      ) Load
</template>

<script>
/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

const Vuex = require('vuex')
const Promise = require('bluebird')
const saveAs = require('file-saver').saveAs
const axios = require('axios')
const parseJson = require('json-parse-better-errors')
var XLSX = require("xlsx")
const _ = require('lodash')

module.exports = {
  data: function () {
    return {
      importWarning: "Warning, Importing will over write existing QnAs with the same ID",
      loading: false,
      testing: false,
      url: "",
      error: false,
      errorMsg: "",
      success: '',
      jobs: [],
      examples: [],
      errorList:[]
    }
  },
  components: {},
  computed: {},
  created: async function () {
    this.refresh()
    const examples = await this.$store.dispatch('api/listExamples')
    this.examples = examples
  },
  methods: {
    importExample: function (url) {
      this.url = url
      this.Geturl()
    },
    close: function () {
      this.loading = false
      this.error = false
      this.errorMsg = '';
    },
    deleteJob: function (index) {
      const self = this
      const job = this.jobs[index]
      job.loading = true
      this.$store.dispatch('api/deleteImport', job)
          .then(() => {
            self.jobs.splice(index, 1)
          })
          .catch(() => {
            job.loading = false
          })
    },
    addJob: function (jobId) {
      const self = this
      let job;
      if (typeof jobId === "object") {
        job = jobId
      } else {
        job = {
          href: `${this.$store.state.info._links.jobs.href}/imports/${jobId}`,
          id: jobId,
          progess: 0,
          status: "Submitted"
        }
      }
      self.jobs.splice(0, 0, job)
      self.$store.dispatch("api/waitForImport", {id: jobId.id || jobId})
          .then(() => poll())

      function poll() {
        self.$store.dispatch('api/getImport', job)
            .then(function (result) {
              Object.assign(job, result)
              if (result.status === "InProgress") {
                setTimeout(() => poll(), 100)
              }
            })
      }
    },
    refresh: function (index) {
      const self = this
      if (index === undefined) {
        self.jobs = []
        return this.$store.dispatch('api/listImports')
            .then(result => {
              result.jobs.forEach((job, index) => {
                return self.addJob(job)
              })
            })
      }
    },
    Getfile: function (event) {
      const self = this
      this.loading = true
      const files_raw = self.$refs.file.files
      const files = []
      for (let i = 0; i < files_raw.length; i++) {
        files.push(files_raw[i])
      }
      Promise.all(files.map(file => {
        return new Promise(function (res, rej) {
          const reader = new FileReader();
          reader.onload = function(e){ 
            try {
              self.parse(e.target.result).then((data) => {
                res({
                  name: file.name,
                  data: data,
                });
              });
            } catch (e) {
              self.error = true;
              self.addError(e.toLocaleString());
            }
          };
          reader.readAsArrayBuffer(file);
        })
      }))
      .map(result => self.upload(result.data, result.name))
      .catch(e => {
        console.log(e);
        self.error = true;
        self.addError(e ? e : 'Unknown error on Getfile');
      })
    },
    Geturl: function (event) {
      const self = this
      this.loading = true
      try {
        const name = (new URL(self.url)).pathname.split('/').reverse()[0];
        self.$store.dispatch('api/getImport', {href: self.url})
            .then(data => {
              if (data) {
                self.upload(data, name)
              } else {
                self.error = true;
                self.addError('No data available to update');
              }
            })
            .catch(x => {
              self.error = true;
              if (x.status) {
                self.addError(`Error for ${name}: ${JSON.stringify({
                  status: x.status,
                  message: x.response.error
                })}`);
              } else if (x.message) {
                self.addError(`Error for ${name}: ${x.message}`);
              } else {
                self.addError(x);
              }
            })
      } catch (e) {
        self.error = true;
        self.addError('Unknown error on url processing');
      }
    },
    upload: function (data, name = "import") {
      const self = this
      const id = name.replace(' ', '-')
      if (data) {
        new Promise(function (res, rej) {
          if (data.qna.length) {
            var id = name.replace(/[^a-zA-Z0-9-_\.]/g, ''); //removes all non URL safe characters
            self.$store.dispatch('api/startImport', {
              qa: data.qna,
              name: id
            })
            .then(res)
            .catch(e=>{
              self.error = true;
              self.addError(e ? e : 'Unknown error on upload dispatch');
            })
          } else {
            self.error = true;
            self.addError('Invalid or Empty File');
          }
        })
        .then(() => {
          self.addJob(id)
        })
        .catch((e)=>{
          self.error = true;
          self.addError(e ? e : 'Unknown error on upload');
        })
      } else {
        self.error = true;
        self.addError('No content to upload');
      }
    },
    addError: function (error){
      if(this.errorMsg == true){ //The error dialog has already been shown. Clear the errorList
        this.errorList = []
        this.errorMsg = false;
      }
      this.errorList.push(error);
    },
    parse: async function (content) {
      var header_mapping = {
        question: "q",
        topic: "t",
        markdown: "alt.markdown",
        answer: "a",
        "Answer": "a",
        ssml: "alt.ssml",
      };
      var self = this;
      try {
        const enc = new TextDecoder('utf-8')
        var jsonText = enc.decode(new Uint8Array(content))
        return Promise.resolve(parseJson(jsonText));
      } catch (err) {
        try {
          console.log(
            "File is not a valid JSON file. Trying to parse as CSV file"
          );
      var workbook = XLSX.read(content, {
        type: 'array'
      });
      var valid_questions = []
      workbook.SheetNames.forEach(function(sheetName) {
        // Here is your object
        var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        var json_object = JSON.stringify(XL_row_object);
        var question_number = 1
        XL_row_object.forEach(question =>{
           console.log("Processing " + JSON.stringify(question))
           for(const property in header_mapping){
             var dest_property = header_mapping[property]
             if(question[dest_property] == undefined){
                _.set(question,dest_property.split("."),question[property])
                console.log("Assigning value for " + dest_property)
                delete question[property]
             }
           }
           question_number++
          if(question["cardtitle"] != undefined){
            console.log("processing response title")
            question.r = {}
            question.r.title = question["cardtitle"]
            if(question["imageurl"] != undefined){
              question.r.imageUrl = question.imageurl
            }
            if(question["cardsubtitle"] != undefined){
              question.r.subTitle = question.subtitle
            }
            question.r.buttons = []
            let i = 1
            while(true){

              console.log("Processing Button"+i)
              var buttonFieldTextName = "displaytext"+i
              var buttonFieldValueName = "buttonvalue"+i
              i++
              var undefinedButtonFieldCount = (question[buttonFieldTextName] == undefined) + (question[buttonFieldValueName] == undefined)
              console.log("ButtonName " + question[buttonFieldTextName] + " ButtonValue " + question[buttonFieldValueName] )
              console.log("Undefined field count " + undefinedButtonFieldCount)

              if(undefinedButtonFieldCount == 2){
                break
              }
              if(undefinedButtonFieldCount == 1){
                self.addError(`Warning:  Both ${buttonFieldTextName} and ${buttonFieldValueName} must be defined for qid: "${question.qid}"`)
                continue;
              }
              console.log("Found two values")
              if(question[buttonFieldValueName].length > 80){
                self.addError(`Warning: ${buttonFieldValueName} must be less than or equal to 80 characters for qid:"${question.qid}"`)
                continue;
              }
              if(question[buttonFieldTextName].length > 80){
                self.addError(`Warning: ${buttonFieldTextName} must be less than or equal to 80 characters for qid:"${question.qid}"`)
                continue;
              }
              var button = {
                  "text":question[buttonFieldTextName],
                  "value":question[buttonFieldValueName]
              }
              console.log("Adding button "+ JSON.stringify(button))
              question.r.buttons.push(button)
             }
           }
           let counter = 1
           question.q = question.q == undefined ? [] : question.q
           while(true){
             var userQuestion = question["question"+counter] 
              if(userQuestion != undefined){
                question.q.push(userQuestion)
                counter++
              }else{
                break;
              }
           }
          if(question.qid  == undefined){
            self.addError(`Warning: No QID found for line ${question_number}. The question will be skipped.`)
            return
          }

           if(question.a == undefined || question.a.replace(/[^a-zA-Z0-9-_]/g, '').trim().length == 0)
           {
             self.addError("Warning: No answer found for QID:\"" + question.qid + "\". The question will be skipped.")
             return
           }
           if(question.q.length == 0){
             self.addError("Warning: No questions found for QID: \"" + question.qid + "\". The question will be skipped.")
             return
           }
           console.log("Processed "+ JSON.stringify(question))
           valid_questions.push(question)

           })

      })
        self.error = self.errorList.length != 0
        return {
          qna: valid_questions
        }
        } catch (err) {
          self.addError("Parse error");
          console.log(err);
          throw err;
        }
      }
    },

  },
};
</script>

<style lang='scss' scoped>
.job-content {
  flex: 1;
}

.job-actions {
  flex: 0;
  flex-direction: row;
}
</style>
