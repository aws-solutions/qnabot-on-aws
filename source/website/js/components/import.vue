<!-- eslint-disable max-len -->
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang='pug'>
span.wrapper
    v-dialog(v-model='error' scrollable width='70%')
        v-card#error-modal
            v-card-title() Error Loading Content
            v-card-text
                li(v-for='error in errorList') {{ error }}
            v-card-actions
                v-spacer
                v-btn(
                    @click='error = false; errorList = []; errorMsg = ""; $refs.file.value = []',
                    :class='{ teal: success }'
                ) close
    v-container#page-import()
        v-row
            v-col
                v-card
                    v-card-title.text-h4.pa-2 Import
                    v-card-text
                        p.mb-2  <span v-html=importWarning></span>
                        p.text-h6.mb-2 From File
                        .ml-4.mb-2
                            input#upload-file(type='file', name='file', v-on:change='Getfile', ref='file')
                        p.text-h6.mb-2 From url
                        .d-flex.ml-4
                            v-text-field#url(
                                name='url',
                                label='Type here to import from url',
                                clearable,
                                v-model='url',
                                variant="underlined",
                                color="primary",
                                persistent-clear
                            )
                            v-btn#import-url(@click='Geturl', :disabled='url?.length === 0') import
        v-row
            v-col(v-if='jobs.length > 0')
                v-card#import-jobs
                    v-card-title.text-h5 Import Jobs
                    v-card-text
                        v-list
                            template(v-for='(job, index) in jobs' :key="job.id")
                                v-list-item(
                                    :id="'import-job-' + job.id"
                                    :data-status="job.status"
                                    )
                                    v-list-item-title.job-content {{ job.id }}: {{ job.status }}
                                    v-list-item-subtitle
                                        v-progress-linear(v-model="job.progress")
                                    template(v-slot:append)
                                        v-btn(icon="delete" variant="text" @click='deleteJob(index)', :loading='job.loading')
                                v-divider(v-if='index + 1 < jobs.length')
        v-row
            v-col
                v-expansion-panels
                    v-expansion-panel
                        v-expansion-panel-title
                            p#examples-open.text-h5(slot='header') Examples/Extensions
                        v-expansion-panel-text(eager=true)
                            v-list(lines="two")
                                template(v-for='(example, index) in examples')
                                    v-divider
                                    v-list-item
                                        template(v-slot:prepend)
                                            v-tooltip(location="bottom")
                                                template(v-slot:activator="{ props }")
                                                    v-icon.pr-3(v-bind="props") info
                                                span.text-subtitle-1 {{ example.text }}
                                        v-list-item-title.text-h6 {{ example.id }}
                                        v-tooltip(location="bottom")
                                            template(v-slot:activator="{ props }")
                                                v-list-item-subtitle(v-bind="props") {{ example.text }}
                                            span.text-subtitle-1 {{ example.text }}
                                        template(v-slot:append)
                                            v-btn.example(
                                                @click='importExample(example.document.href)',
                                                :id='"example-" + example.id'
                                            ) Load
</template>

<script>
const parseJson = require('json-parse-better-errors');
const XLSX = require('read-excel-file');
const _ = require('lodash');
const { reactive } = require('vue');

module.exports = {
    data() {
        return {
            importWarning:
                'Warning, Importing will over write existing QnAs with the same ID </br>'
                + 'You can import either a JSON file exported from QnABot or a properly </br> '
                + 'formatted Excel file.  For the file format, see <a href=\'https://github.com/aws-solutions/qnabot-on-aws/blob/main/source/docs/excel_import/README.md\' target="_blank">here</a>.',
            loading: false,
            testing: false,
            url: '',
            error: false,
            errorMsg: '',
            success: '',
            jobs: [],
            examples: [],
            errorList: [],
        };
    },
    components: {},
    computed: {},
    async created() {
        this.refresh();
        const examples = await this.$store.dispatch('api/listExamples');
        this.examples = examples;
    },
    methods: {
        importExample(url) {
            this.url = url;
            this.Geturl();
        },
        close() {
            this.loading = false;
            this.error = false;
            this.errorMsg = '';
        },
        deleteJob(index) {
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
        addJob(jobId) {
            const self = this;
            let job;
            if (typeof jobId === 'object') {
                job = jobId;
            } else {
                job = {
                    href: `${this.$store.state.info._links.jobs.href}/imports/${jobId}`,
                    id: jobId,
                    progress: 0,
                    status: 'Submitted',
                };
            }
            job = reactive(job);
            self.jobs.splice(0, 0, job);
            self.$store.dispatch('api/waitForImport', { id: jobId.id || jobId }).then(() => poll());

            function poll() {
                self.$store.dispatch('api/getImport', job).then((result) => {
                    result.progress = result.progress * 100;
                    Object.assign(job, result);
                    if (result.status === 'InProgress') {
                        setTimeout(() => poll(), 100);
                    }
                });
            }
        },
        refresh(index) {
            const self = this;
            if (index === undefined) {
                self.jobs = [];
                return this.$store.dispatch('api/listImports').then((result) => {
                    result?.jobs?.forEach((job, index) => self.addJob(job));
                });
            }
        },
        Getfile(event) {
            const self = this;
            this.loading = true;
            const rawFiles = self.$refs.file.files;
            const files = [];
            for (const rawFile of rawFiles) {
                files.push(rawFile);
            }
            Promise.all(
                files.map((file) => new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        try {
                            self.parse(e.target.result).then((data) => {
                                res({
                                    name: file.name,
                                    data,
                                });
                            });
                        } catch (e) {
                            self.error = true;
                            self.addError(e.toLocaleString());
                        }
                    };
                    reader.readAsArrayBuffer(file);
                })),
            )
                .then((results) => {
                    results.forEach((result) => self.upload(result.data, result.name));
                })
                .catch((e) => {
                    console.log(e);
                    self.error = true;
                    self.addError(e || 'Unknown error on Getfile');
                });
        },
        Geturl() {
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
                                    message: x.response.error,
                                })}`,
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
        upload(data, name = 'import') {
            const self = this;
            const id = name.replace(' ', '-');
            for (const [index, question] of data.qna.entries()) {
                self.questionHasErrorsJSON(self, question, index + 1);
            }
            if (self.errorList.length > 0) {
                self.error = true;
                return;
            }
            if (data) {
                new Promise((res, rej) => {
                    if (data.qna.length) {
                        const id = name.replace(/[^a-zA-Z0-9-_\.]/g, ''); // removes all non URL safe characters
                        self.$store
                            .dispatch('api/startImport', {
                                qa: data.qna,
                                name: id,
                            })
                            .then(res)
                            .catch((e) => {
                                self.error = true;
                                self.addError(e || 'Unknown error on upload dispatch');
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
                        self.addError(e || 'Unknown error on upload');
                    });
            } else {
                self.error = true;
                self.addError('No content to upload');
            }
        },
        addError(error) {
            if (this.errorMsg) {
                // The error dialog has already been shown. Clear the errorList
                this.errorList = [];
                this.errorMsg = false;
            }
            this.errorList.push(error);
        },
        validateRequiredFields(self, question, arrayMapping, keepProcessing, i) {
            let foundColumn;

            for (const element of arrayMapping) {
                console.log('Processing ', element);
                console.log('Processing question ', question);
                const xlsColumnName = `${element.xlsFieldname}${i}`;
                console.log(`Value of ${xlsColumnName} is ${question[xlsColumnName]}`);

                if (question[xlsColumnName] == undefined) {
                    if (!foundColumn) {
                        // Found all of the values for this array.  Stop processing the Excel entry
                        keepProcessing = false;
                        break;
                    } else if (element.required) {
                        self.addError(
                            `Missing required value ${xlsColumnName} for corresponding field ${foundColumn}: Skipping...`,
                        );
                        continue;
                    }
                } else {
                    foundColumn = xlsColumnName;
                }
            }
            return keepProcessing;
        },
        parseMultivalueFields(question, fieldType, arrayMapping, dstField) {
            let i = 0;
            const self = this;
            let keepProcessing = true;
            while (keepProcessing) {
                i += 1;
                // Validate all of the required fields are available for this entry -- ie sessionAttributeName1,sessionValue1
                keepProcessing = this.validateRequiredFields(
                    self,
                    question,
                    arrayMapping,
                    keepProcessing,
                    i,
                );
                if (!keepProcessing) {
                    break;
                }
                const fmtField = {};
                for (const element of arrayMapping) {
                    const xlsColumnName = `${element.xlsFieldname}${i}`;
                    let xlsColumnValue = question[xlsColumnName] || element.default;
                    console.log(`Value2 of ${xlsColumnName} is ${xlsColumnValue}`);

                    if (element.type == 'boolean' && typeof xlsColumnValue !== 'boolean') {
                        self.addError(
                            `Warning: ${xlsColumnName} must have a value of true or false for  qid:"${question.qid}": defaulting to ${element.default}`,
                        );
                        xlsColumnValue = element.default;
                    }
                    if (element.maxSize && xlsColumnValue.length > element.maxSize) {
                        self.addError(
                            `Warning: ${xlsColumnName} must be less than or equal to ${xlsColumnValue.length} characters for qid:"${question.qid}"`,
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
        questionHasErrorsXlsx(self, question, excelRowNumber) {
            // Validate mandatory fields of qid, question, and answer.
            // This is done for xlsx format
            // Qid must exist
            if (!question.qid) {
                self.addError(
                    `Warning: No QID found for line ${excelRowNumber}. The question will be skipped.`,
                );
                return true;
            }
            // Qid must have no spaces
            if (/\s/g.test(question.qid)) {
                self.addError(
                    `Warning: QID found for line ${excelRowNumber} must have no spaces. The question will be skipped.`,
                );
                return true;
            }
            // must have at least 1 question
            if (question.q.length == 0) {
                self.addError(
                    `Warning: No questions found for QID: "${question.qid
                    }". The question will be skipped.`,
                );
                return true;
            }
            // Questions must be 140 characters or less
            for (const q of question.q) {
                if (q.length > 140) {
                    self.addError(
                        `Warning: QID: "${question.qid}" has a question that is over 140 characters in length. The question will be skipped.`,
                    )
                }
            }
            // answer must exist and include valid characters
            if (!question.a || question.a.replace(/\s/g, '').length == 0) {
                self.addError(
                    `Warning: No answer found for QID:"${question.qid
                    }". The question will be skipped.`,
                );
                return true;
            }

            return false;
        },
        questionHasErrorsJSON(self, question, questionNumber) {
            // Validate mandatory fields of qid, question, and answer.
            // This is done for JSON format
            // Qid must exist
            if (!question.qid) {
                self.addError(
                    `Error: No QID found for question number: ${questionNumber}. The JSON file will not be imported. Please fix and import the file again.`,
                );
                return true;
            }
            // Qid must have no spaces
            if (/\s/g.test(question.qid)) {
                self.addError(
                    `Error: QID: "${question.qid}", found for question number: ${questionNumber} must have no spaces. The JSON file will not be imported. Please fix and import the file again.`,
                );
                return true;
            }
            // Json only, question.type equals qna
            if (question.type !== 'qna') {
                return false;
            }
            // must have at least 1 question
            if (question.q.length == 0) {
                self.addError(
                    `Error: No questions found for QID: "${question.qid}". The JSON file will not be imported. Please fix and import the file again.`,
                );
                return true;
            }
            // Questions must be 140 characters or less
            for (const q of question.q) {
                if (q.length > 140) {
                    self.addError(
                        `Warning: QID: "${question.qid}" has a question that is over 140 characters in length. The question will be skipped.`,
                    )
                }
            }

            // answer must exist and include valid characters
            if (!question.a || question.a.replace(/\s/g, '').length == 0) {
                self.addError(
                    `Error: No answer found for QID: "${question.qid}". Make sure that it also includes valid characters (/[^a-zA-Z0-9-_]/g). The JSON file will not be imported. Please fix and import the file again.`,
                );
                return true;
            }

            return false;
        },
        extractQuestion(question) {
            // lets try to extract all of the user questions
            const q = question.q ? [question.q] : [];
            let counter = 1;
            while (true) {
                // users can import multiple utterances, be appending sequential numbers to
                // the column 'question', e.g. question8
                const userQuestion = question[`question${counter}`];
                if (!userQuestion) {
                    // break on the first instance of missing question number. For example,
                    // if user has question1 and question3 in their excel file, but no question2
                    // then we would never look at question3 because question2 is missing
                    break;
                }
                q.push(userQuestion.replace(/(\r\n|\n|\r)/gm, ' '));
                delete question[`question${counter}`];
                counter++;
            }
            return q;
        },
        processRow(self, question, excelRowNumber, headerMapping) {
            // let's try and map a couple friendly column names into their
            // actual property names using the header mapping (e.g. 'topic' to 't')
            for (const property in headerMapping) {
                const dest_property = headerMapping[property];
                if (question[dest_property] == undefined) {
                    console.log(`Assigning value for ${dest_property}`);
                    _.set(question, dest_property, question[property]);
                    delete question[property];
                }
            }

            question.q = this.extractQuestion(question);

            if (this.questionHasErrorsXlsx(self, question, excelRowNumber)) {
                console.log(`Aborting load of question: ${JSON.stringify(question)}`);
                return;
            }

            console.log('Processing Session Attributes');
            question.sa = [];
            let arrayMappings = [
                {
                    xlsFieldname: 'attributename',
                    esFieldname: 'text',
                },
                {
                    xlsFieldname: 'attributevalue',
                    esFieldname: 'value',
                },
                {
                    xlsFieldname: 'enabletranslation',
                    esFieldname: 'enableTranslate',
                    default: true,
                    type: 'boolean',
                },
            ];
            self.parseMultivalueFields(question, 'Session Attribute', arrayMappings, question.sa);

            if (question.cardtitle) {
                console.log('processing response title');
                question.r = {};
                question.r.title = question.cardtitle;
                delete question.cardtitle;
                if (question.imageurl) {
                    question.r.imageUrl = question.imageurl;
                    delete question.imageurl;
                }
                if (question.cardsubtitle) {
                    question.r.subTitle = question.cardsubtitle;
                    delete question.cardsubtitle;
                }
                question.r.buttons = [];
                arrayMappings = [
                    {
                        xlsFieldname: 'displaytext',
                        esFieldname: 'text',
                        required: true,
                        maxSize: 80,
                    },
                    {
                        xlsFieldname: 'buttonvalue',
                        esFieldname: 'value',
                        required: true,
                        maxSize: 80,
                    },
                ];
                self.parseMultivalueFields(question, 'Button', arrayMappings, question.r.buttons);
            }

            // properties with a '.' should be treated as nested properties
            // let's set any that we find into their proper destination within the object
            // e.g. 'botRouting.specialty_bot' ==> 'botRouting': { 'specialty_bot': value }
            for (const property in question) {
                if (property.includes('.')) {
                    const value = question[property];
                    // need to delete the property first to ensure lodash treats the property
                    // variable as a path, and not just as a string key
                    delete question[property];
                    if (value != null) {
                        _.set(question, property, value);
                    }
                }
            }
            // Note that at this point we have stopped processing the excel file and any additional
            // fields will be left as is. This means that new or more advanced fields can be imported
            // by directly referencing their schema id (e.g. 'kendraRedirectQueryArgs')
            return question;
        },
        async parseCsv(self, content, headerMapping) {
            try {
                const sheetNames = await XLSX.readSheetNames(content);
                const valid_questions = [];
                for (const sheetName of sheetNames) {
                    // Here is your object
                    const rows = await XLSX.default(content, { sheet: sheetName });
                    const headerRow = rows.shift();
                    let excelRowNumber = 1; // excel sheets start at index 1, which for us is the header
                    rows.forEach((question) => {
                        console.log(`Processing ${JSON.stringify(question)}`);
                        excelRowNumber++;

                        // first let's remap the current row entry from an index array
                        // to a key value map for easier processing
                        const questionMap = {};
                        for (let j = 0; j < headerRow.length; j++) {
                            questionMap[headerRow[j]] = question[j];
                        }
                        const processedQuestion = this.processRow(self, questionMap, excelRowNumber, headerMapping);

                        if (processedQuestion) {
                            valid_questions.push(processedQuestion);
                            console.log(`Processed ${JSON.stringify(processedQuestion)}`);
                        };
                    });
                }
                self.error = self.errorList.length != 0;
                return {
                    qna: valid_questions,
                };
            } catch (err) {
                self.addError('Parse error');
                console.log(err);
                throw err;
            }
        },
        async parse(content) {
            // this headermap enabled customers to more conveniently
            // map some of the more common fields using a 'friendly' name
            const headerMapping = {
                question: 'q',
                topic: 't',
                markdown: 'alt.markdown',
                answer: 'a',
                Answer: 'a',
                ssml: 'alt.ssml',
            };
            const self = this;
            try {
                const enc = new TextDecoder('utf-8');
                const jsonText = enc.decode(new Uint8Array((content)));
                return Promise.resolve(parseJson(jsonText));
            } catch (err) {
                console.log('File is not a valid JSON file. Trying to parse as CSV file');
                return this.parseCsv(self, content, headerMapping);
            }
        },
    },
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