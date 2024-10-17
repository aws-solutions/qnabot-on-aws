/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

function create() {
    const file = `${__dirname}/`;
    return require(file);
}

it('renders import template correctly', () => {
    const template = create();
    expect(template).toMatchSnapshot({
        Resources: {
            ImportCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
        },
    });
});
