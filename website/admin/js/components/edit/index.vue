<template>
  <section>
    <qna-nav></qna-nav>
    <spinner loading="true" v-if="!authenticated"></spinner>
    <section id="edit" v-if="authenticated">
      <main-menu ></main-menu>
      <spinner v-bind:loading="$store.state.api.loading && QAlist.length===0"></spinner>
      <ul class="QAs" v-show="QAlist.length>0">
        <labels></labels>
        <li v-for="index in Math.min(perpage,QAlist.length)">
          <QA 
            v-bind:scoreShow='scoreShow' 
            v-bind:index='index-1'
            ></QA>
        </li>
      </ul>
      <div id="empty" v-show="QAlist.length===0 && !$store.state.api.loading">No items returned</div>
      <paginate v-show="pages>1" ></paginate>
    </section>
  </section>
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
var Promise=require('bluebird')

module.exports={
  data:function(){
    return {
      loading:false,
      loaded:false,
      scoreShow:false,
      timer:null,
      timeout:1000*60*45
    }
  },
  components:{
    'main-menu':require('./menu.vue'),
    'QA':require('./QA.vue'),
    'spinner':require('./spinner.vue'),
    'paginate':require('./paginate.vue'),
    'qna-nav':require('./nav.vue'),
    "labels":require('./labels.vue')
  },
  computed:{
    QAlist:function(){
      return this.$store.getters["data/QAlist"]
    },
    perpage:function(){
      return this.$store.state.page.perpage
    },
    pages:function(){
      return this.$store.getters["page/pages"]
    },
    authenticated:function(){
      return this.$store.state.user.loggedin
    }
  },
  mounted:function(){
    var self=this
    console.log(self)
    if(!self.$store.state.user.loggedin){
      self.$router.replace('/error')
    }else{
      self.init() 
    }
  },
  destroyed:function(){
      clearTimeout(this.timer);
  },
  methods:{
    logout:function(){
      alert("Logging out due to inactivity")
      this.$router.push('/logout')
      location.reload()
    },
    resetTimer:function(){
      clearTimeout(this.timer);
      this.timer = setTimeout(this.logout.bind(this),this.timeout)
    },
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.$store.commit('setError',reason)
      }
    },
    init:function(){
      var self=this
      window.onload =self.resetTimer;
      document.onmousemove =self.resetTimer;
      document.onkeypress =self.resetTimer;
      self.resetTimer()
      if(!self.loaded){
        self.loading=true

        return self.$store.dispatch('data/get',0)
        .catch(self.error('failed to load QnA'))
        .finally(function(){
          self.loading=false
        })
      }
    }
  }
}
</script>
