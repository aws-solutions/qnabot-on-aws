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

module.exports = [
    {
        title: 'Configure Genesys Cloud CX Integration',
        text: `
<br/>Configure LexV2 and Genesys Cloud CX with AppFoundry<br/><br/>
Do step 2 through 4 in the <a href="https://help.mypurecloud.com/articles/amazon-lex-v2-quick-start-guide/">Lex V2 quick start guide.</a> 
<br/>Note: Step 1 is already complete, as QnABot is a Lex bot.
<br/> 
&#8291;Step 1. <b>SKIP STEP 1</b>, QnABot deploys the LexV2 bot<br />
&#8291;Step 2. <b>Grant Genesys Cloud CX the permissions to call the Amazon Lex V2 bot</b><br />
&#8291;Step 3. <b>Obtain the Amazon Lex V2 integration from Genesys AppFoundry</b><br />
&#8291;Step 4. <b>Configure and activate the Lex V2 integration in Genesys Cloud CX</b><br /> 
`,
        image: '../images/genesys-1.png',
    }, {
        title: 'Install  Archy',
        text: `
<br />Install and Configure Archy<br/><br/>
Download, install and configure the Genesys Cloud Architect YAML (Archy) processor. All the instructions are on the Genesys Archy developer website, 
found here:<a href="https://developer.genesys.cloud/devapps/archy/install">https://developer.genesys.cloud/devapps/archy/install</a></b>
<br /><br />High level steps:<br/>
&#8291;1. Download the version of Archy for your operating system<br/>
&#8291;2. Extract or install Archy<br/>
&#8291;3. Run <code>archy setup</code> and configure authentication credentials 
<br/>
    `,
        image: '../images/genesys-2.png',
    },
    {
        title: 'Download Call Flow',
        text: `
<br/>Download Genesys Cloud CX Inbound Call Flow</br><br/>
To begin this step, choose <b>DOWNLOAD INBOUND CALL FLOW</b> below. It will download a YAML inbound call flow file for QnABot.<br/>
    `,
        buttons: [{
            text: 'DOWNLOAD INBOUND CALL FLOW',
            id: 'DownloadInboundCallFlow',
            loading: false,
        }],
    },
    {
        title: 'Import Call Flow',
        text: `
<br />Import Call Flow with Archy<br/><br/>
In the terminal, run <code>archy publish --file QnABotFlow.yaml</code>.  This will create and publish the call flow, which will then appear in Genesys Architect.<br/>
    `,
        image: '../images/genesys-3.png',
    },
    {
        title: 'Configure Call Routing',
        image: '../images/genesys-4.png',
        text: `
<br />Configure Call Routing in Genesys Pure Cloud Admin<br/><br/>
In Genesys Pure Cloud Admin, configure a call route to route to the newly published QnABot inbound call flow.
`,
    },
];
