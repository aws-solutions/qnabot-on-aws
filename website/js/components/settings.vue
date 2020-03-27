<template lang='pug'>
  v-container(grid-list-md)
    v-layout(column )
      v-flex
        v-card
          v-card-title 
            h3 Settings
          v-card-text
            v-list(three-line)
                v-list-tile(v-for="(parameter,index) in mergedSettings")
                    v-list-tile-content
                        v-text-field(:label="index"  v-model="settingsHolder[index]" @input="testInput")
            v-btn(@click="SaveSettings") Save
            v-btn Add New parameter
            v-btn Reset to defaults
            
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
var _=require('lodash')

module.exports={
    data:function(){
        var self=this
        return {
            mergedSettings:{},
            defaultSettings:{},
            customSettings: {},
            settingsHolder: {},
        }
    },
    components:{},
    computed:{},
    created:async function(){
      const settings = await this.$store.dispatch('api/listSettings');
      this.defaultSettings = settings[0];
      console.log('default', this.defaultSettings);
      this.customSettings = settings[1];
      console.log('custom', this.customSettings);
      this.mergedSettings = settings[2];
      console.log('merged', this.mergedSettings);
      this.settingsHolder = settings[2];
      console.log('holder', this.settingsHolder);
    },
    methods:{
      SaveSettings: async function(){
        console.log('tom youre not insane');
        // var newCustomSettings = this.settingsHolder;
        // for (var key in newCustomSettings) {
        //   let value = newCustomSettings[key];
        //   console.log("new settings", key, value);
        //   var compare = _.get(this.defaultSettings, key);
        //   console.log("old value", compare);
        // }
      },
      testInput: function(index){
        console.log('default', this.defaultSettings);
        console.log('custom', this.customSettings);
        console.log('merged', this.mergedSettings);
        console.log('holder', this.settingsHolder);
      }
    }
}
</script>