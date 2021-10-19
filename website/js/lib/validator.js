// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports=function(App){
    App.$validator.extend('json', {
        getMessage: field => 'invalid json',
        validate: function(value){
            try {
                var card=JSON.parse(value)
                var v =new  (require('jsonschema').Validator)();
                var valid=v.validate(card,require('./store/api/card-schema.json')).valid
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
