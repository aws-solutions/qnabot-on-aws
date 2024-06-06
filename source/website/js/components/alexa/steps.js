/* eslint-disable max-len */
/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

module.exports = [
    {
        title: 'Sign-in',
        text: `
- Create an Amazon developer account at [Amazon Developer Console](https://developer.amazon.com/home.html)
- Login to the Developer Console and open the "Alexa Skills Kit"
        `,
        image: '../images/alexa_sign-in.png',
    },
    {
        title: 'Create',
        text: `
- Click on the "Create Skill" button
- Follow the instructions to create a skill
        `,
        image: '../images/alexa_create-skill.png',
    },
    {
        title: 'Model',
        text: `
- On the "Experience, Model, Hosting service" tab select: <br/>
&nbsp;&nbsp; - "Other" for type of experience <br/>
&nbsp;&nbsp; - "Custom" for model type <br/>
&nbsp;&nbsp; - "Provision your own" for Hosting services. <br/>
        `,
        image: '../images/alexa_select.png',
    },
    {
        title: 'Template',
        text: `
- On the "Template" tab, select "Start from Scratch".
        `,
        image: '../images/alexa_templates.png',
    },
    {
        title: 'Review',
        text: `
- Review the skill which should match the image below and click "Create Skill".
        `,
        image: '../images/alexa_review.png',
    },
    {
        title: 'Skill Lambda',
        text: `
- Click "COPY LAMBDA ARN" on this page and paste in the "Endpoint" page under "Default Region".
- Click "Save".
        `,
        image: '../images/alexa_lambda-config.png',
        buttons: [
            {
                text: 'COPY LAMBDA ARN',
                id: 'LambdaArn',
                loading: false,
            },
        ],
    },
    {
        title: 'Schema',
        text: `
- Click "COPY SCHEMA" on this page and paste in the "Intents" > "JSON Editor" page. 
- Edit the invocation as needed and take note of it. This is the name that you will use to invoke QnABot through Alexa.
- Click "Build Skill".
        `,
        image: '../images/alexa_schema-config.png',
        buttons: [
            {
                text: 'COPY SCHEMA',
                id: 'Schema',
                loading: false,
            },
        ],
    },
    {
        title: 'Test',
        image: '../images/alexa_enable.png',
        text: `
Congratulations! Your QnABot skill is now ready to be used. 

Enable testing by selecting the "Test" tab and test your new skill. <br/><br/>

### Alexa Device 
<br/>
To access your unpublished skill, register your Alexa device to the same account as your Amazon Developer account.
If you have a device that is not registered to the right account, you can re-register it by following these directions: <a href="https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/testing-an-alexa-skill#h2_register" target="_blank">Registering an Alexa-enabled Device for Testing</a>
Ask questions in the form: *"Alexa, ask q and a, How do I use Q and A Bot?"*  (Assuming your device wake word is 'Alexa' and invocationName is 'q and a'). Alternatively, you could use the invocationName 'q and a' to initiate and then ask questions. 
Publish your skill if you want to make it available for others to use from their own Amazon accounts.
        `,
    },
];
