/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

module.exports=function(App){
    App.$validator.extend('json', {
        getMessage: field => 'invalid json',
        validate: function(value){
            try {
                var card=JSON.parse(value)
                var v =new  (require('jsonschema').Validator)();
                var valid=v.validate(card,require('./store/api/card-schema')).valid
                return valid
            } catch(e){
                return false
            }
        }
    });
    
    App.$validator.extend('optional', {
        getMessage: field => 'invalid characters',
        validate: function(value){
            try {
                return value.match(/.*/) ? true : false
            } catch(e){
                return false
            }
        }
    });
}
