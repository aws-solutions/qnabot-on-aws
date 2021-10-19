// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var bowser=require('bowser')

document.addEventListener('DOMContentLoaded',function(){
    if( !bowser.chrome && !bowser.firefox ){
        alert("Warning: Unsupported Browser, please use Chrome or Firefox")
    }
})
