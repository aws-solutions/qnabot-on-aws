<template>
  <div id="main-menu" v-bind:class="{open:open}">
    <div id='tabs'>
      <div class="tab" 
        v-bind:class="{active:mode==='questions',inactive:mode!=='questions'}"
        v-on:click="$store.dispatch('setMode','questions')"><h1>Questions</h1></div>
      <div class="tab" 
        v-bind:class="{active:mode==='test',inactive:mode!=='test'}"
        v-on:click="$store.dispatch('setMode','test')"><h1>Test</h1></div>
    </div>
    <div class="controls">
      <div v-show="mode==='questions'">
        <div class="buttons">
          <dropdown title1="Lex" title2="Alexa" id="lex-alexa">
            <div class="button" id="alexa-build" 
              v-on:click="alexaModal=true">Alexa Instructions</div>
            <div class="button" id="build-div" 
              v-on:click="build">Rebuild Lex Bot</div>  
          </dropdown>
          <button v-on:click="add" >Add</button>
          <dropdown title1="Import" title2="Export" 
            v-bind:class="{four:selectIds.length <= 0,five:selectIds.length > 0}">
              <div class="button" v-on:click="downloadAll">Export All</div>
              <div class="button" v-on:click="downloadLocal">Export Filtered</div>
              <div class="button" v-on:click="downloadSelected" 
                v-show="selectIds.length > 0">Export Selected</div>
              <div class="button" v-on:click="uploadLocal">Import Local</div>
              <div class="button" v-on:click="uploadUrl">Import Url</div>
          </dropdown>
        </div>
        <sift></sift>
      </div>
      <div v-show="mode==='test'">
        <search></search>
      </div>
      <div class="modal alexaModal" v-show="alexaModal" v-on:click.self="alexaModal=false">
        <div class="modal-card">
          <button v-on:click="alexaModal=false">close</button>
          <alexa v-if="alexaModal"></alexa>
          <button v-on:click="alexaModal=false">close</button>
        </div>
      </div> 
      <div class="modal" v-show="importExportModal">
        <div class="modal-card">
          <p v-show="!(success || importing)">
            Warning: Existing QnA items will be overwritten by any imported items with the same ID!
          </p>
          <div v-show="importMode==='local' && !importing">
            <input 
              type="file" 
              v-validate="'ext:json,yaml'"
              name="file"
              id="upload-file" 
              style="display:none;" 
              v-on:change="upload">
            <button><label for='upload-file'>Continue</label></button>
            <button v-on:click="importExportModal=false">Cancel</button>
          </div>
          <div v-show="importMode==='url' && !importing">
            <input 
                v-model="url"
                type="text" 
                name="url"
                placeholder="Type your url here" 
            >
            <button v-on:click="upload">Continue</button>
            <button v-on:click="reset">Cancel</button>
          </div>
          <div v-show="success">
            <p>Upload Success</p>
            <icon name="check"></icon>
            <button v-on:click="reset">Continue</button>
          </div>
          <div v-show="importing && !success">
            <p>Importing Document</p>
            <icon name="spinner" class="fa-pulse"></icon>
          </div>
        </div>
      </div>
      <div class="modal" v-show="buildModal">
        <div class="modal-card">
          <div v-show="building">
            <p>Building Bot</p>
            <icon name="spinner" class="fa-pulse"></icon>
          </div>
          <div v-show="buildSuccess && !building">
            <p>Build Success</p>
            <icon name="check"></icon>
          </div>
        </div>
      </div>
    </div>
  </div>
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

var Vuex=require('vuex')
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')

module.exports={
  data:function(){
    return {
      new_id:"",
      building:false,
      buildSuccess:false,
      buildModal:false,
      alexaModal:false,
      open:false,
      dropdown:false,
      exportingAll:false,
      exportingLocal:false,
      exportingSelect:false,
      importingLocal:false,
      importingUrl:false,
      success:false,
      url:"",
      importMode:"",
      importExportModal:false
    }
  },
  components:{
    search:require('./search.vue'),
    sift:require('./filter.vue'),
    alexa:require('./alexa.vue'),
    'spin-button':require('./spinner-button.vue'),
    dropdown:require('./dropdown.vue')
  },
  computed:Object.assign({},
    Vuex.mapState(["mode","selectIds"]),
    {
      importing:function(){
        return this.importingLocal || this.importingUrl
      }
    }
  ),
  methods:{
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.building=false
        self.buildSuccess=false
        self.importExportModal=false
        self.buildModal=false
        self.$store.commit('setError',reason || error)
      }
    },
    add:function(){
      var self=this
      return this.$store.dispatch('add')
      .catch(self.error('failed to add'))
    },
    close:function(){
      var self=this
      self.building=false
      self.buildModal=false
    },
    build:function(){
      var self=this
      self.building=true
      self.buildModal=true
      self.$store.dispatch('build')
      .then(function(){
        self.building=false
        self.buildSuccess=true
      })
      .delay(2000)
      .then(()=>self.buildModal=false)
      .catch(self.error('failed to build'))
    },
    uploadLocal:function(){
      var self=this
      self.importExportModal=true
      self.importMode="local"
    },
    uploadUrl:function(){
      var self=this
      self.importExportModal=true
      self.importMode="url"
    },
    upload:function(x){
      var self=this 
      var action
      if(self.url){
        self.importingUrl=true
        action=self.$store.dispatch('upload',{url:self.url})
      }else if(!this.$validator.errors.has('file')){
        self.importingLocal=true
        var file=x.srcElement.files[0]
        var reader = new FileReader();
        action=new Promise(function(res,rej){
          reader.onload = function(e) { 
            try {
              res(JSON.parse(e.srcElement.result))
            } catch(e) {
              rej("invalid JSON")
            }
          };
          reader.readAsText(file);
        })
        .then(function(data){
            return self.$store.dispatch('upload',{data})
        })
      }else{
        action=Promise.reject('invalid file')
      }

      return action.then(function(){
        self.success=true 
      })
      .catch(self.error())
      .finally(function(){
        self.importMode=""
        self.importingUrl=false
        self.importingLocal=false
        self.url=null
      })
    },
    reset:function(){
      var self=this
      self.success=false
      self.importExportModal=false
    },
    downloadAll:function(){
      var self=this
      self.exportingAll=true
      this.$store.dispatch('download')
      .then(blob=>Promise.resolve(saveAs(blob,"qna.json")))
      .catch(self.error('failed to Download All'))
      .finally(()=>self.exportingAll=false)
    },
    downloadLocal:function(){
      var self=this
      self.exportingLocal=true
      this.$store.dispatch('downloadLocal')
      .then(blob=>Promise.resolve(saveAs(blob,"qna.json")))
      .catch(self.error('failed to Download Local'))
      .finally(()=>self.exportingLocal=false)
    },
    downloadSelected:function(){
      var self=this
      self.exportingSelect=true
      this.$store.dispatch('downloadSelect')
      .then(blob=>Promise.resolve(saveAs(blob,"qna.json")))
      .catch(self.error('failed to Download Local'))
      .finally(()=>self.exportingSelect=false)

    }
  }
}
</script>
