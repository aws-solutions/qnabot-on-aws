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

const { fromEnv } = require('@aws-sdk/credential-providers');
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');
const region = process.env.AWS_REGION || 'us-east-1';
const _ = require('lodash');

function getCredentials() {
  return () => {
      const credentialsProvider = fromEnv();
      return credentialsProvider();
  };
};

const con = _.memoize((address) => {
  const client = new Client({
      ...AwsSigv4Signer({
          region,
          service: 'es',
          getCredentials: getCredentials(),
      }),
      node: address,
  });
  return client;
});

exports.con = con;
