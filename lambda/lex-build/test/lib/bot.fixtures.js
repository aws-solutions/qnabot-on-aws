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

exports.returnData = function(fulfillment_str, length_gt_1) {
   const data_length_1 = {
       'name': 'test-bot',
       'intents': [
           {
               'intentName': '',
               'intentVersion': ''
           }
       ],
       'status': 'Failed',
       'failureReason': 'timeout',
       'lastUpdatedDate': '12/03/2023',
       'createdDate': '10/27/2023',
       'version': '2.0'
   };

   const data_length_2 = {
       'name': 'test-bot',
       'intents': [
           {
               'intentName': '',
               'intentVersion': ''
           },
           {
               'intentName': '',
               'intentVersion': ''
           }
       ],
       'status': 'Failed',
       'failureReason': 'timeout',
       'lastUpdatedDate': '12/03/2023',
       'createdDate': '10/27/2023',
       'version': '2.0'
   };

   if (fulfillment_str) {
       data_length_1.intents[0].intentName = 'fulfilment_test';
       data_length_2.intents[0].intentName = 'fulfilment_test';
       if (length_gt_1) {
           data_length_2.intents[1].intentName = 'test';
       }
   } else {
       data_length_1.intents[0].intentName = 'test';
       data_length_2.intents[0].intentName = 'test';
       data_length_2.intents[1].intentName = 'fulfilment_test';
   }

   if (length_gt_1 || !fulfillment_str) {
       return data_length_2;
   } else {
       return data_length_1;
   }
}

exports.returnVersionObj = {
        'intent_version': '2.0',
        'intentFallback_version': '1.0'
};

exports.returnNewVersionValue = '3.0';
