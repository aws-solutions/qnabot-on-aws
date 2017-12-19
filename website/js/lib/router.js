/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var store=require('./store')

module.exports={
    base:'/',
    routes:[
        {   path:'/alexa',
            name:"alexa",
            component:require('../components/alexa/index.vue')
        },
        {   path:'/hooks',
            name:"hooks",
            component:require('../components/hooks/index.vue')
        },
        {   path:'/import',
            name:"import",
            component:require('../components/import.vue')
        },
        {   path:'/export',
            name:"export",
            component:require('../components/export.vue')
        },
        {   path:'/edit',
            name:"edit",
            component:require('../components/designer/index.vue')
        },
        {   path:'/loading',
            component:require('../components/loading.vue')
        }
    ]
}

