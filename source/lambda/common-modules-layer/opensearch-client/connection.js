/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
