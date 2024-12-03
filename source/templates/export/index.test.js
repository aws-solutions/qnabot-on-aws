/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

function create() {
    const file = `${__dirname}/`;
    return require(file);
}

it('renders export template correctly', () => {
    const template = create();
    expect(template).toMatchSnapshot({
        Resources: {
            ConnectCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            Deployment: {
                Properties: {
                    buildDate: expect.any(Date),
                },
            },
            ExportCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            GenesysCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            KendraNativeCrawlerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            KendraNativeCrawlerScheduleUpdateCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            KendraNativeCrawlerStatusCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            SyncCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            TranslateCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
        },
    });
});
