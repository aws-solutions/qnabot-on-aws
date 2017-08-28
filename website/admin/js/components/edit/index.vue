<template>
  <section>
    <qna-nav></qna-nav>
    <div class='spinner' v-show="!authenticated">
      <i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>
    </div>
    <spinner loading="true" v-if="!authenticated"></spinner>
    <section id="edit" v-if="authenticated">
      <main-menu ></main-menu>
      <spinner v-bind:loading="loading"></spinner>
      <ul class="QAs" v-show="QAlist.length>0">
        <labels></labels>
        <li v-for="index in Math.min(page.perpage,QAlist.length)">
          <QA 
            v-bind:scoreShow='scoreShow' 
            v-bind:index='index-1'
            ></QA>
        </li>
      </ul>
      <div id="empty" v-show="QAlist.length===0 && !$store.state.loading">No items returned</div>
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
var auth=require('../../lib/auth.js')

module.exports={
  data:function(){
    return {
      loading:false,
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
  computed:Object.assign({},
    Vuex.mapState([
        'loaded','page'
    ]),
    Vuex.mapGetters([
      'pages','QAlist','authenticated'
    ])
  ),
  created:function(){
    var self=this
    if(!self.authenticated){
      auth.getCurrent()
      .then(function(result){
        result ? self.init() : self.$router.replace('/login')
      })
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
        self.$store.commit('startLoading')
        self.loading=true

        return self.$store.dispatch('get',0)
        .catch(self.error('failed to load QnA'))
        .finally(function(){
          self.loading=false
          self.$store.commit('stopLoading')
        })
      }
    }
  }
}
</script>
