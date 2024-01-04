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
v-container()
    v-dialog(v-model="showAlert" scrollable width="70%")
        v-card(id="error-modal")
          v-card-title {{alertTitle}}
          v-card-text {{alertMessage}}
          v-card-actions
            v-spacer
            v-btn(@click="showAlert=false;" ) close
    v-row
      v-col
        v-card
          v-card-title
            h2 Settings
          v-card-text
            h3 For more information about settings, see <a href="https://github.com/aws-solutions/qnabot-on-aws/blob/main/docs/settings.md" target="_blank">here</a>
          v-card-text
            v-list(lines="three")
                v-list-item(v-for="(parameter,index) in mergedSettings" :key="index")
                    v-text-field(
                        :id="index"
                        v-model="settingsHolder[index]"
                        :label="index"
                        variant="underlined"
                        color="primary")
            v-btn.mr-3.my-2(@click="SaveSettings") Save
            //- v-btn Add New parameter
            v-btn.my-2(@click="resetToDefaults" style="margin-right:80px;") Reset to defaults
            v-btn.mr-3.my-2(@click="$refs.fileInput.click()") Import Settings

            v-btn.my-2(@click="ExportSettings" style="margin-right:80px;") Export Settings

            v-btn.my-2(@click="showAddModal = true") Add New Setting
            input(type="file" ref="fileInput" accept="application/json" @change="onFilePicked" style="display: none")

    v-dialog(v-model ="showAddModal")
        v-card
            v-card-title New Setting
            v-card-text
                v-text-field(label="Name" v-model="newKey" variant="underlined" color="primary")
                v-text-field(label="Value" v-model="newValue" variant="underlined" color="primary")
            v-card-actions
                v-spacer
                v-btn(@click="addSetting") Add
                v-btn(@click="closeModal") Cancel

</template>

<script>
const Vuex = require('vuex');
const _ = require('lodash');

module.exports = {
    data() {
        return {
            showAddModal: false,
            mergedSettings: {},
            defaultSettings: {},
            customSettings: {},
            settingsHolder: {},
            importAlert: false,
            newKey: '',
            newValue: '',
            showAlert: false,
            alertMessage: '',
            alertTitle: '',
        };
    },
    components: {},
    computed: {},
    async created() {
        await this._loadSettings();
    },
    methods: {
        _get_custom_settings() {
            // update current customSettings with new values from settingsHolder
            for (const key in this.customSettings) {
                this.customSettings[key] = this.settingsHolder[key];
            }

            // place in customSettings any differences from defaultSettings
            for (const key in this.settingsHolder) {
                if (this.settingsHolder[key] !== this.defaultSettings[key]) {
                    this.customSettings[key] = this.settingsHolder[key];
                }
            }

            // remove any custom settings that are identical to default settings
            for (const key in this.customSettings) {
                if (this.customSettings[key] === this.defaultSettings[key]) {
                    delete this.customSettings[key];
                }
            }

            // clone object to send on api request - no chance of inflight updates from the ui
            return _.clone(this.customSettings);
        },
        async _loadSettings() {
            const settings = await this.$store.dispatch('api/listSettings');
            this.defaultSettings = _.clone(settings[0]);
            this.customSettings = _.clone(settings[1]);
            this.mergedSettings = _.clone(settings[2]);
            this.settingsHolder = _.clone(settings[2]);
        },
        async SaveSettings() {
            const cloned_custom = this._get_custom_settings();
            await this._save_settings(cloned_custom);
            this.showAlert = true;
            this.alertMessage = 'Successfully saved settings!';
            this.alertTitle = 'Success';
        },
        async _save_settings(settings) {
            settings = Object.assign(settings, this.customSettings);
            console.log(`settings ${JSON.stringify(settings)}`);
            const response = await this.$store.dispatch('api/updateSettings', settings);
            if (response) {
                window.scrollTo(0, 0);
            }
        },
        onFilePicked(event) {
            console.log('onFilePicked');
            const { files } = event.target;
            const fileReader = new FileReader();
            fileReader.addEventListener('loadend', (event) => {
                console.log(event.target.result);
                try {
                    this._save_settings(JSON.parse(event.target.result)).then(() => {
                        console.log('settings saved');
                        this._loadSettings();
                    }).then(() => {
                        this.showAlert = true;
                        this.alertMessage = 'Successfully imported settings!';
                        this.alertTitle = 'Success';
                    }).catch((e) => {
                        this.showAlert = true;
                        this.alertMessage = `Upload failed ${JSON.stringify(e)}`;
                        this.alertTitle = 'Error';
                    });
                } catch (e) {
                    this.showAlert = true;
                    this.alertMessage = 'Upload failed. Please ensure that your settings file is properrly formatted JSON.';
                    this.alertTitle = 'Error';
                }
            });
            fileReader.readAsBinaryString(files[0]);
        },
        downloadBlobAsFile: (function closure_shell() {
            const a = document.createElement('a');
            return function downloadBlobAsFile(blob, filename) {
                const object_URL = URL.createObjectURL(blob);
                a.href = object_URL;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(object_URL);
            };
        }()),
        ExportSettings() {
            const settings = this._get_custom_settings();
            this.downloadBlobAsFile(new Blob(
                [JSON.stringify(settings)],
                { type: 'text/json' },
            ), 'settings.json');
            this.showAlert = true;
            this.alertMessage = 'Successfully exported settings.';
            this.alertTitle = 'Success';
        },
        async resetToDefaults() {
            const customOverride = {};
            const response = await this.$store.dispatch('api/updateSettings', customOverride);
            if (response) {
                this.customSettings = {};
                this.settingsHolder = _.clone(this.defaultSettings);
                this.successAlert = true;
                window.scrollTo(0, 0);
            }
        },
        async showModal() {
            this.showAddModal = true;
        },
        async closeModal() {
            this.showAddModal = false;
        },
        async addSetting() {
            if (this.newKey.length >= 1) {
                console.log('hi tom');
                this.mergedSettings[this.newKey] = this.newValue;
                this.customSettings[this.newKey] = this.newValue;
                this.settingsHolder[this.newKey] = this.newValue;
            }
            console.log(this.mergedSettings);

            this.showAddModal = false;
            this.newValue = '';
            this.newKey = '';
        },
    },
};
</script>
