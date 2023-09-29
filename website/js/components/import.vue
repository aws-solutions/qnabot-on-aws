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
span.wrapper
    v-dialog(v-model='error', scrollable, width='auto')
        v-card#error-modal
            v-card-title(primary-title) Error Loading Content
            v-card-text
                li(v-for='error in errorList') {{ error }}
            v-card-actions
                v-spacer
                v-btn.lighten-3(
                    @click='error = false; errorList = []; errorMsg = ""; $refs.file.value = []',
                    :class='{ teal: success }'
                ) close
    v-container#page-import(column, grid-list-md)
        v-layout(column)
            v-flex
                v-card
                    v-card-title.display-1.pa-2 Import
                    v-card-text
                        p  <span v-html=importWarning></span>
                        p.title From File
                        .ml-4.mb-2
                            input#upload-file(type='file', name='file', v-on:change='Getfile', ref='file')
                        p.title From url
                        .d-flex.ml-4
                            v-text-field#url(
                                name='url',
                                label='Type here to import from url',
                                clearable,
                                v-model='url'
                            )
                            v-btn#import-url(@click='Geturl', style='flex: 0', :disabled='url.length === 0') import
            v-flex(v-if='jobs.length > 0')
                v-card#import-jobs
                    v-card-title.headline Import Jobs
                    v-card-text
                        v-list
                            template(v-for='(job, index) in jobs')
                                v-list-tile(:id='"import-job-" + job.id', :data-status='job.status')
                                    v-list-tile-content.job-content
                                        v-list-tile-title {{ job.id }}: {{ job.status }}
                                        v-list-tile-sub-title
                                            v-progress-linear(v-model='job.progress * 100')
                                    v-list-tile-action.job-actions
                                        v-btn(fab, block, icon, @click='deleteJob(index)', :loading='job.loading')
                                            v-icon delete
                                v-divider(v-if='index + 1 < jobs.length')
            v-flex
                v-expansion-panel
                    v-expansion-panel-content
                        p#examples-open.headline(slot='header') Examples/Extensions
                        v-list(two-line)
                            template(v-for='(example, index) in examples')
                                v-divider
                                v-list-tile
                                    v-list-tile-avatar
                                        v-tooltip(bottom)
                                            span(slot='activator')
                                                v-icon.pr-3 info
                                            span.subheading {{ example.text }}
                                    v-list-tile-content
                                        v-list-tile-title.title {{ example.id }}
                                        v-tooltip(bottom)
                                            span(slot='activator')
                                                v-list-tile-sub-title {{ example.text }}
                                            span.subheading {{ example.text }}
                                    v-list-tile-action
                                        v-btn.example(
                                            @click='importExample(example.document.href)',
                                            :id='"example-" + example.id'
                                        ) Load
</template>

<script>
const Promise = require('bluebird');
const parseJson = require('json-parse-better-errors');
const XLSX = require('read-excel-file');
const _ = require('lodash');

module.exports = {
    data: function () {
        return {
            importWarning:
                'Warning, Importing will over write existing QnAs with the same ID </br>' +
                'You can import either a JSON file exported from QnABot or a properly </br> ' +
                "formatted Excel file.  For the file format, see <a href='https://github.com/aws-solutions/qnabot-on-aws/tree/main/docs/excel_import#readme'>here</a>.",
            loading: false,
            testing: false,
            url: '',
            error: false,
            errorMsg: '',
            success: '',
            jobs: [],
            examples: [],
            errorList: []
        };
    },
    components: {},
    computed: {},
    created: async function () {
        this.refresh();
        const examples = await this.$store.dispatch('api/listExamples');
        this.examples = examples;
    },
    methods: {
        importExample: function (url) {
            this.url = url;
            this.Geturl();
        },
        close: function () {
            this.loading = false;
            this.error = false;
            this.errorMsg = '';
        },
        deleteJob: function (index) {
            const self = this;
            const job = this.jobs[index];
            job.loading = true;
            this.$store
                .dispatch('api/deleteImport', job)
                .then(() => {
                    self.jobs.splice(index, 1);
                })
                .catch(() => {
                    job.loading = false;
                });
        },
        addJob: function (jobId) {
            const self = this;
            let job;
            if (typeof jobId === 'object') {
                job = jobId;
            } else {
                job = {
                    href: `${this.$store.state.info._links.jobs.href}/imports/${jobId}`,
                    id: jobId,
                    progess: 0,
                    status: 'Submitted'
                };
            }
            self.jobs.splice(0, 0, job);
            self.$store.dispatch('api/waitForImport', { id: jobId.id || jobId }).then(() => poll());

            function poll() {
                self.$store.dispatch('api/getImport', job).then(function (result) {
                    Object.assign(job, result);
                    if (result.status === 'InProgress') {
                        setTimeout(() => poll(), 100);
                    }
                });
            }
        },
        refresh: function (index) {
            const self = this;
            if (index === undefined) {
                self.jobs = [];
                return this.$store.dispatch('api/listImports').then((result) => {
                    result.jobs.forEach((job, index) => {
                        return self.addJob(job);
                    });
                });
            }
        },
        Getfile: function (event) {
            const self = this;
            this.loading = true;
            const rawFiles = self.$refs.file.files;
            const files = [];
            for (const rawFile of rawFiles) {
                files.push(rawFile);
            }
            Promise.all(
                files.map((file) => {
                    return new Promise(function (res, rej) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            try {
                                self.parse(e.target.result).then((data) => {
                                    res({
                                        name: file.name,
                                        data: data
                                    });
                                });
                            } catch (e) {
                                self.error = true;
                                self.addError(e.toLocaleString());
                            }
                        };
                        reader.readAsArrayBuffer(file);
                    });
                })
            )
                .map((result) => self.upload(result.data, result.name))
                .catch((e) => {
                    console.log(e);
                    self.error = true;
                    self.addError(e ? e : 'Unknown error on Getfile');
                });
        },
        Geturl: function () {
            const self = this;
            this.loading = true;
            try {
                const name = new URL(self.url).pathname.split('/').reverse()[0];
                self.$store
                    .dispatch('api/getImport', { href: self.url })
                    .then((data) => {
                        if (data) {
                            self.upload(data, name);
                        } else {
                            self.error = true;
                            self.addError('No data available to update');
                        }
                    })
                    .catch((x) => {
                        self.error = true;
                        if (x.status) {
                            self.addError(
                                `Error for ${name}: ${JSON.stringify({
                                    status: x.status,
                                    message: x.response.error
                                })}`
                            );
                        } else if (x.message) {
                            self.addError(`Error for ${name}: ${x.message}`);
                        } else {
                            self.addError(x);
                        }
                    });
            } catch (e) {
                self.error = true;
                self.addError('Unknown error on url processing');
            }
        },
        upload: function (data, name = 'import') {
            const self = this;
            const id = name.replace(' ', '-');
            if (data) {
                new Promise(function (res, rej) {
                    if (data.qna.length) {
                        const id = name.replace(/[^a-zA-Z0-9-_\.]/g, ''); //removes all non URL safe characters
                        self.$store
                            .dispatch('api/startImport', {
                                qa: data.qna,
                                name: id
                            })
                            .then(res)
                            .catch((e) => {
                                self.error = true;
                                self.addError(e ? e : 'Unknown error on upload dispatch');
                            });
                    } else {
                        self.error = true;
                        self.addError('Invalid or Empty File');
                    }
                })
                    .then(() => {
                        self.addJob(id);
                    })
                    .catch((e) => {
                        self.error = true;
                        self.addError(e ? e : 'Unknown error on upload');
                    });
            } else {
                self.error = true;
                self.addError('No content to upload');
            }
        },
        addError: function (error) {
            if (this.errorMsg) {
                //The error dialog has already been shown. Clear the errorList
                this.errorList = [];
                this.errorMsg = false;
            }
            this.errorList.push(error);
        },
        parseMultivalueFields: function (question, fieldType, arrayMapping, dstField) {
            let i = 0;
            const self = this;
            let keepProcessing = true;
            while (keepProcessing) {
                i++;
                //Validate all of the required fields are available for this entry -- ie sessionAttributeName1,sessionValue1
                let foundColumn = undefined;

                for (const element of arrayMapping) {
                    console.log('Processing ', element);
                    console.log("Processing question ",question)
                    const xlsColumnName = `${element.xlsFieldname}${i}`;
                    console.log(`Value of ${xlsColumnName} is ${question[xlsColumnName]}`);

                    if (question[xlsColumnName] == undefined) {
                        if (!foundColumn) {
                            //Found all of the values for this array.  Stop processing the Excel entry
                            keepProcessing = false;
                            break;
                        } else if (element.required) {
                            self.addError(
                                `Missing required value ${xlsColumnName} for corresponding field ${foundColumn}: Skipping...`
                            );
                            continue;
                        }
                    } else {
                        foundColumn = xlsColumnName;
                    }
                }
                if (!keepProcessing) {
                    break;
                }
                const fmtField = {};
                for (const element of arrayMapping) {
                    const xlsColumnName = `${element.xlsFieldname}${i}`;
                    let xlsColumnValue = question[xlsColumnName] !== undefined ? question[xlsColumnName] : element.default;
                    console.log(`Value2 of ${xlsColumnName} is ${xlsColumnValue}`);

                    if(element.type == "boolean" && typeof xlsColumnValue !== "boolean"){
                      self.addError(
                            `Warning: ${xlsColumnName} must have a value of true or false for  qid:"${question.qid}": defaulting to ${element.default}`
                        );
                         xlsColumnValue= element.default
                        }
                    if (element.maxSize && xlsColumnValue.length > element.maxSize) {
                        self.addError(
                            `Warning: ${xlsColumnName} must be less than or equal to ${xlsColumnValue.length} characters for qid:"${question.qid}"`
                        );
                        continue;
                    }
                    fmtField[element.esFieldname] = xlsColumnValue;
                    console.log(`Adding ${fieldType} ${JSON.stringify(fmtField)}`);
                    delete question[xlsColumnName];
                }
                dstField.push(fmtField);
            }
        },
        parse: async function (content) {
            //this headermap enabled customers to more conveniently
            //map some of the more common fields using a 'friendly' name
            const headerMapping = {
                question: 'q',
                topic: 't',
                markdown: 'alt.markdown',
                answer: 'a',
                'Answer': 'a',
                ssml: 'alt.ssml'
            };
            const self = this;
            try {
                const enc = new TextDecoder('utf-8');
                const jsonText = enc.decode(new Uint8Array((content)));
                return Promise.resolve(parseJson(jsonText));
            } catch (err) {
                try {
                    console.log('File is not a valid JSON file. Trying to parse as CSV file');
                    const sheetNames = await XLSX.readSheetNames(content)
                    const valid_questions = [];
                    for(const sheetName of sheetNames){
                        // Here is your object
                        const rows = await XLSX.default(content, {sheet: sheetName})
                        const headerRow = rows.shift()
                        let excelRowNumber = 1; //excel sheets start at index 1, which for us is the header
                        rows.forEach((question) => {
                            console.log('Processing ' + JSON.stringify(question));
                            excelRowNumber++;

                            //first let's remap the current row entry from an index array
                            //to a key value map for easier processing
                            const questionMap = {}
                            for(let j = 0; j < headerRow.length; j++){
                                questionMap[headerRow[j]] = question[j]
                            }
                            question = questionMap

                            //let's try and map a couple friendly column names into their
                            //actual property names using the header mapping (e.g. 'topic' to 't')
                            for (const property in headerMapping) {
                                const dest_property = headerMapping[property];
                                if (question[dest_property] == undefined) {
                                    console.log('Assigning value for ' + dest_property);
                                    _.set(question, dest_property, question[property]);
                                    delete question[property];
                                }
                            }


                            //lets try to extract all of the user questions
                            question.q = question.q ? [question.q] : []
                            let counter = 1;
                            while (true) {
                                //users can import multiple utterances, be appending sequential numbers to
                                //the column 'question', e.g. question8
                                const userQuestion = question['question' + counter];
                                if(!userQuestion) {
                                    //break on the first instance of missing question number. For example,
                                    //if user has question1 and question3 in their excel file, but no question2
                                    //then we would never look at question3 because question2 is missing
                                    break
                                }
                                question.q.push(userQuestion.replace(/(\r\n|\n|\r)/gm, ' '));
                                delete question['question' + counter];
                                counter++;
                            }

                            //validate mandatory fields of qid, question, and answer
                            //qid must exist
                            if (!question.qid) {
                                self.addError(
                                    `Warning: No QID found for line ${excelRowNumber}. The question will be skipped.`
                                );
                                return;
                            }
                            //must have atleast 1 question
                            if (question.q.length == 0) {
                                self.addError(
                                    'Warning: No questions found for QID: "' +
                                        question.qid +
                                        '". The question will be skipped.'
                                );
                                return;
                            }
                            //answer must exist and include valid characters
                            if (!question.a || question.a.replace(/[^a-zA-Z0-9-_]/g, '').trim().length == 0) {
                                self.addError(
                                    'Warning: No answer found for QID:"' +
                                        question.qid +
                                        '". The question will be skipped.'
                                );
                                return;
                            }

                            console.log('Processing Session Attributes');
                            question.sa = [];
                            let arrayMappings = [
                                {
                                    xlsFieldname: 'attributename',
                                    esFieldname: 'text'
                                },
                                {
                                    xlsFieldname: 'attributevalue',
                                    esFieldname: 'value'
                                },
                                {
                                    xlsFieldname: 'enabletranslation',
                                    esFieldname: 'enableTranslate',
                                    default:true,
                                    type:"boolean"
                                },
                            ];
                            self.parseMultivalueFields(question, 'Session Attribute', arrayMappings, question.sa);

                            if (question['cardtitle']) {
                                console.log('processing response title');
                                question.r = {};
                                question.r.title = question['cardtitle'];
                                delete question['cardtitle'];
                                if (question['imageurl']) {
                                    question.r.imageUrl = question.imageurl;
                                    delete question.imageurl;
                                }
                                if (question['cardsubtitle']) {
                                    question.r.subTitle = question.subtitle;
                                    delete question['cardsubtitle'];
                                }
                                question.r.buttons = [];
                                arrayMappings = [
                                    {
                                        xlsFieldname: 'displaytext',
                                        esFieldname: 'text',
                                        required: true,
                                        maxSize: 80
                                    },
                                    {
                                        xlsFieldname: 'buttonvalue',
                                        esFieldname: 'value',
                                        required: true,
                                        maxSize: 80
                                    }
                                ];
                                self.parseMultivalueFields(question, 'Button', arrayMappings, question.r.buttons);
                            }

                            //properties with a '.' should be treated as nested properties
                            //let's set any that we find into their proper destination within the object
                            //e.g. 'botRouting.specialty_bot' ==> 'botRouting': { 'specialty_bot': value }
                            for (const property in question) {
                                if (property.includes('.')) {
                                    const value = question[property]
                                    //need to delete the property first to ensure lodash treats the property
                                    //variable as a path, and not just as a string key
                                    delete question[property];
                                    if(value != null){
                                        _.set(question, property, value);
                                    }
                                }
                            }

                            //Note that at this point we have stopped processing the excel file and any additional
                            //fields will be left as is. This means that new or more advanced fields can be imported
                            //by directly referencing their schema id (e.g. 'kendraRedirectQueryArgs')
                            console.log('Processed ' + JSON.stringify(question));
                            valid_questions.push(question);
                        });
                    };
                    self.error = self.errorList.length != 0;
                    return {
                        qna: valid_questions
                    };
                } catch (err) {
                    self.addError('Parse error');
                    console.log(err);
                    throw err;
                }
            }
        }
    }
};
</script>

<style lang='scss' scoped>
.job-content {
    flex: 1;
}

.job-actions {
    flex: 0;
    flex-direction: row;
}
</style>