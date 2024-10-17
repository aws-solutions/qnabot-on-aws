/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

function create() {
    const file = `${__dirname}/`;
    return require(file);
}

it('renders sagemaker-embeddings template correctly', () => {
    const template = create('sagemaker-embeddings');
    expect(template).toMatchSnapshot({
        Resources: {
            QnABotEmbeddingModel: {
                Properties: {
                    ExecutionRoleArn:  {
                                   "Fn::GetAtt":  [
                                     "QnABotEmbeddingModelExecutionRole",
                                     "Arn",
                                   ],
                                 },
                    
                },
            },
        },
    });
});
