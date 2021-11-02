// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')

module.exports={
    pages(state){
        return Math.ceil(state.total/state.perpage)
    }
}
