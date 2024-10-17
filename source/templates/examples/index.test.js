/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

function create() {
    const file = `${__dirname}/`;
    return require(file);
}

it('renders examples template correctly', () => {
    const template = create();
    expect(template).toMatchSnapshot({
        Resources: {
            CodeVersionCreateRecentTopicsResponse: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            CodeVersionCustomJSHook: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            CodeVersionCustomPYHook: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            EXTUiImportVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            ExampleCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            JsLambdaHookSDKLambdaLayerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
        },
    });
});
