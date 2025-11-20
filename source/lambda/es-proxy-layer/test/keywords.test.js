/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { Comprehend } = require('@aws-sdk/client-comprehend');
const { TranslateClient } = require('@aws-sdk/client-translate');
const qnabot = require('qnabot/logging');
const keywords = require('../lib/keywords');

jest.mock('@aws-sdk/client-comprehend');
jest.mock('@aws-sdk/client-translate');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');


describe('keywords', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('filters question keywords', async () => {
        const params = {
            question: 'QnA Bot is great',
            use_keyword_filters: true,
        };

        const detectSyntaxMock = jest.fn().mockImplementation(async () => {
            return {
                // used for testing purposes
                SyntaxTokens: [ 
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "DET"
                       },
                       "Text": "QnA",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 0.1,
                          "Tag": "NOUN"
                       },
                       "Text": "bot",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "INTJ"
                       },
                       "Text": "is",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "VERB"
                       },
                       "Text": "great",
                       "TokenId": 1
                    },
                 ]
            }
        });
        
        Comprehend.mockImplementation(() => {
            return {detectSyntax: detectSyntaxMock};
        });

        const response = await keywords(params);
        expect(detectSyntaxMock).toBeCalledWith({
            LanguageCode: 'en',
            Text: 'QnA Bot is great',
        });
        expect(response).toBe('great ');
    });

    test('no keywords case', async () => {
        const params = {
            question: 'QnA Bot is great',
            use_keyword_filters: true,
        };

        const detectSyntaxMock = jest.fn().mockImplementation(async () => {
            return {
                // used for testing purposes
                SyntaxTokens: [ 
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "DET"
                       },
                       "Text": "QnA",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 0.1,
                          "Tag": "NOUN"
                       },
                       "Text": "bot",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "INTJ"
                       },
                       "Text": "is",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 0,
                          "Tag": "VERB"
                       },
                       "Text": "great",
                       "TokenId": 1
                    },
                 ]
            }
        });
        
        Comprehend.mockImplementation(() => {
            return {detectSyntax: detectSyntaxMock};
        });

        const response = await keywords(params);
        expect(response).toBe('');
    });

    test('filters question keywords for non-Supported Language', async () => {
      const params = {
          question: 'उत्तरी अमेरिका की सबसे ऊंची इमारत कौन सी है?',
          use_keyword_filters: true,
          settings: {
            NATIVE_LANGUAGE : 'Hindi',
            BACKUP_LANGUAGE : 'English'
          },
          QuestionInBackupLanguage: 'What is the tallest building in Northern America?',
          localeIdentified: 'hi'
      };

      const detectSyntaxMock = jest.fn().mockImplementation(async () => {
         return {
             // used for testing purposes
               SyntaxTokens: [
                   {
                       "TokenId": 1,
                       "Text": "What",
                       "BeginOffset": 0,
                       "EndOffset": 4,
                       "PartOfSpeech": {
                           "Tag": "PRON",
                           "Score": 1.0
                       }
                   },
                   {
                       "TokenId": 2,
                       "Text": "is",
                       "BeginOffset": 5,
                       "EndOffset": 7,
                       "PartOfSpeech": {
                           "Tag": "VERB",
                           "Score": 0.9999994039535522
                       }
                   },
                   {
                       "TokenId": 3,
                       "Text": "the",
                       "BeginOffset": 8,
                       "EndOffset": 11,
                       "PartOfSpeech": {
                           "Tag": "DET",
                           "Score": 1.0
                       }
                   },
                   {
                       "TokenId": 4,
                       "Text": "tallest",
                       "BeginOffset": 12,
                       "EndOffset": 19,
                       "PartOfSpeech": {
                           "Tag": "ADJ",
                           "Score": 1.0
                       }
                   },
                   {
                       "TokenId": 5,
                       "Text": "building",
                       "BeginOffset": 20,
                       "EndOffset": 28,
                       "PartOfSpeech": {
                           "Tag": "NOUN",
                           "Score": 0.9999995231628418
                       }
                   },
                   {
                       "TokenId": 6,
                       "Text": "in",
                       "BeginOffset": 29,
                       "EndOffset": 31,
                       "PartOfSpeech": {
                           "Tag": "ADP",
                           "Score": 1.0
                       }
                   },
                   {
                       "TokenId": 7,
                       "Text": "Northern",
                       "BeginOffset": 32,
                       "EndOffset": 40,
                       "PartOfSpeech": {
                           "Tag": "PROPN",
                           "Score": 1.0
                       }
                   },
                   {
                       "TokenId": 8,
                       "Text": "America",
                       "BeginOffset": 41,
                       "EndOffset": 48,
                       "PartOfSpeech": {
                           "Tag": "PROPN",
                           "Score": 1.0
                       }
                   },
                   {
                       "TokenId": 9,
                       "Text": "?",
                       "BeginOffset": 48,
                       "EndOffset": 49,
                       "PartOfSpeech": {
                           "Tag": "PUNCT",
                           "Score": 1.0
                       }
                   }
               ]}});

            Comprehend.mockImplementation(() => {
                  return {detectSyntax: detectSyntaxMock};
            });

            const translateTextMock = jest.fn().mockImplementation(() => {
                return {
                    TranslatedText: 'इमारत उत्तरी अमेरिका '
                }
            });

            TranslateClient.mockImplementation(() => {
                return {send: translateTextMock};
            });

            const response = await keywords(params);
            expect(response).toBe("इमारत उत्तरी अमेरिका ");
   });

   test('filters question keywords for non-Supported Language that did not go through Fulfillment Lambda', async () => {
    const params = {
        question: 'उत्तरी अमेरिका की सबसे ऊंची इमारत कौन सी है?',
        use_keyword_filters: true,
        settings: {
          NATIVE_LANGUAGE : 'Hindi',
          BACKUP_LANGUAGE : 'English'
        }
    };

    const response = await keywords(params);
    expect(response).toBe("");
    
 });

    test('expand contractions', async () => {
        const params = {
            question: 'I can\'t believe it!',
            es_expand_contractions: JSON.stringify({"can't":"cannot"}),
            use_keyword_filters: true,
        };

        const detectSyntaxMock = jest.fn().mockImplementation(async () => {
            return {
                // used for testing purposes
                SyntaxTokens: [ 
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "'I",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "cannot",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "believe",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "it!",
                       "TokenId": 1
                    },
                 ]
            }
        });
        
        Comprehend.mockImplementation(() => {
            return {detectSyntax: detectSyntaxMock};
        });

        const response = await keywords(params);
        expect(detectSyntaxMock).toBeCalledWith({
            LanguageCode: 'en',
            Text: 'I cannot believe it!',
        });
        expect(response).toBe('cannot believe it! ');
    });

    test('does not call comprehend if use keyword filter is false', async () => {
        const params = {
            question: 'I can\'t believe it!',
            es_expand_contractions: JSON.stringify({"can't":"cannot"}),
            use_keyword_filters: false,
        };

        const detectSyntaxMock = jest.fn().mockImplementation(async () => {
            return {
                // used for testing purposes
                SyntaxTokens: [ 
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "'I",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "cannot",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "believe",
                       "TokenId": 1
                    },
                    { 
                       "PartOfSpeech": { 
                          "Score": 1,
                          "Tag": "NOUN"
                       },
                       "Text": "it!",
                       "TokenId": 1
                    },
                 ]
            }
        });
        
        Comprehend.mockImplementation(() => {
            return {detectSyntax: detectSyntaxMock};
        });

        const response = await keywords(params);
        expect(detectSyntaxMock).not.toHaveBeenCalled();
        expect(response).toBe('');
    });
});
