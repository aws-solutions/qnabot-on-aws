/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.objectToRedact = {
    accesstokenjwt: "fake-access-token",
    idtokenjwt: "fake-id-token",
    refreshtoken: "fake-refresh-token",
    safeKey: "non-jwt-token",
    nonSafe: "key with bad word"
}
exports.redactedObject = {
    accesstokenjwt: "<token redacted>",
    idtokenjwt: "<token redacted>",
    refreshtoken: "<token redacted>",
    safeKey: "non-jwt-token",
    nonSafe: "key with XXXXXX word"
}

exports.comprehendDetectPIITestObject = {
    "Text": `Hello Zhang Wei, I am John. Your AnyCompany Financial Services, LLC credit card account 1111-0000-1111-0008 has a minimum payment of $24.53 that is due by July 31st.
            Based on your autopay settings, we will withdraw your payment on the due date from your bank account number XXXXXX1111 with the routing number XXXXX0000.
            Customer feedback for Sunshine Spa, 123 Main St, Anywhere. Send comments to Alice at sunspa@example.com.`,
    "LanguageCode": "en"
}
exports.comprehendDetectPIIRedactedTestObject = {
    "Text": `Hello XXXXXX, I am XXXXXX. Your AnyCompany Financial Services, LLC credit card account XXXXXX has a minimum payment of $24.53 that is due by XXXXXX.
            Based on your autopay settings, we will withdraw your payment on the due date from your bank account number XXXXXX with the routing number XXXXXX.
            Customer feedback for Sunshine Spa, XXXXXX, Anywhere. Send comments to XXXXXX at XXXXXX.`,
    "LanguageCode": "en"
}

exports.mockFoundPII = [
    "Zhang Wei",
    "John",
    "1111-0000-1111-0008",
    "July 31st",
    "XXXXXX1111",
    "XXXXX0000",
    "123 Main St",
    "Alice",
    "sunspa@example.com"
]
exports.mockComprehendDetectPIIEmptyResponse = {
    "Entities": []
}
exports.mockComprehendDetectPIIResponse = {
    "Entities": [
        {
            "BeginOffset": 6,
            "EndOffset": 15,
            "Score": 0.9998852014541626,
            "Type": "NAME"
        },
        {
            "BeginOffset": 22,
            "EndOffset": 26,
            "Score": 0.9998780488967896,
            "Type": "NAME"
        },
        {
            "BeginOffset": 88,
            "EndOffset": 107,
            "Score": 0.999022364616394,
            "Type": "CREDIT_DEBIT_NUMBER"
        },
        {
            "BeginOffset": 155,
            "EndOffset": 164,
            "Score": 0.9999754428863525,
            "Type": "DATE_TIME"
        },
        {
            "BeginOffset": 286,
            "EndOffset": 296,
            "Score": 0.9999557733535767,
            "Type": "BANK_ACCOUNT_NUMBER"
        },
        {
            "BeginOffset": 321,
            "EndOffset": 330,
            "Score": 0.9999798536300659,
            "Type": "BANK_ROUTING"
        },
        {
            "BeginOffset": 380,
            "EndOffset": 391,
            "Score": 0.9999191164970398,
            "Type": "ADDRESS"
        },
        {
            "BeginOffset": 420,
            "EndOffset": 425,
            "Score": 0.9989036321640015,
            "Type": "NAME"
        },
        {
            "BeginOffset": 429,
            "EndOffset": 447,
            "Score": 0.9997677206993103,
            "Type": "EMAIL"
        }
    ]
}