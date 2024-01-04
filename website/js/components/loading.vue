/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
<template lang='pug'>
v-card
    v-progress-linear(indeterminate)
</template>

<script>

require('vuex');

module.exports = {
    data() {
        return {};
    },
    components: {
    },
    created() {
        const self = this;
        this.$store.dispatch('bootstrap')
            .then(() => self.$store.dispatch('user/login'))
            .then(() => self.$router.replace('/edit'))
            .catch((error) => {
                console.log(error);
                self.$router.replace('/error');
            });
    },
    methods: {
    },
};
</script>
