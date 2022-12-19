// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AWS = require("aws-sdk");

exports.handler = async function(event, context) {
  try {
    console.log(event);
    if (event["requestContext"]["path"] == "/" + event["requestContext"]["stage"] + "/translate/list") {
      let translate = new AWS.Translate();
      let result = await translate.listTerminologies({}).promise();
      console.log(JSON.stringify(result));
      let mappedResult = result.TerminologyPropertiesList.map((data) => {
        return {
          Name: data.Name,
          Description: data.Description,
          SourceLanguage: data.SourceLanguageCode,
          TargetLanguageCodes: data.TargetLanguageCodes,
          TermCount: data.TermCount,
        };
      });
      return {
        statusCode: 200,
        body: JSON.stringify(mappedResult),
        headers: {},
        isBase64Encoded: false,
      };
    }
    if (event["requestContext"]["path"] == "/" + event["requestContext"]["stage"] + "/translate/import") {
      let body = JSON.parse(event["body"]);

      let translate = new AWS.Translate();

      console.log(body["file"]);
      let csvFile = Buffer.from(body["file"], "base64").toString("ascii");
      let response = await translate.importTerminology({
          Name: body["name"],
          MergeStrategy: "OVERWRITE",
          Description: body["description"],
          TerminologyData: {
            File: csvFile,
            Format: "CSV",
          },
      }).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
            Status:"Success",
            Error:"",
            Response: response
        }),
        headers: {},
        isBase64Encoded: false,
      };
    }
    return {
        statusCode: 404,
        headers: {},
        isBase64Encoded: false,
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 200,
      body:JSON.stringify( {Status:"Failed",Error:e.message}),
      headers: {},
      isBase64Encoded: false,
    };
  }

};
