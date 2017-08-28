<template>
  <section id="login">
    <h2>QnABot Content Designer</h2>
    <div id='loginPage'>
      <form @submit.prevent="login">
        <label><input 
          id="username" 
          v-model="name" 
          v-validate="'required'"
          name="username"
          placeholder="username"></label>
        <label><input 
          id="password" 
          v-model="pass" 
          v-validate="'required'"
          name="password"
          placeholder="password" 
          type="password"></label>
        <br>
        <button 
          id="loginButton" 
          v-bind:class="{down:loading}"
          type="submit">
            <span v-show='!loading'>Log in</span>
            <spinner v-show="loading"></spinner>
        </button>
      </form>
    </div>
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

var auth=require('../../lib/auth.js')
var Vuex=require('vuex')
module.exports={
  data:function(){
    return {
      pass:"",
      name:"",
      loading:false
    }
  },
  components:{
    'spinner':require('./spinner.vue')
  },
  methods:{
    login:function(){
      var self=this
      if(!this.$validator.errors.has('username')
      &&!this.$validator.errors.has('password')){
        self.loading=true 
        return auth.login(self.name,self.pass).error(err=>self.error=err)
        .then(()=>self.$router.replace('/'))
        .then(()=>self.$store.commit('setUser',self.name))
        .then(()=>self.error=null)
        .catch(()=>self.$store.commit('setError',"login error"))
        .finally(()=>self.loading=false)
      }else{
        self.$store.commit('setError',"must have username or password")
      }
    }
  }
}
</script>
