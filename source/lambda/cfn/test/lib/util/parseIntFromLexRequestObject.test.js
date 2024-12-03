/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { parseIntFromLexRequestObject }  = require('../../../lib/util/parseIntFromLexRequestObject');

test('parses integer properties of object', () => {

    const input = {
      maxAttempts: '1',
      priority: '2' 
    };
  
    parseIntFromLexRequestObject(input);
  
    expect(input.maxAttempts).toEqual(1);
    expect(input.priority).toEqual(2);
  
  });

  test('parses objects in array', () => {

    const input = [
      {
        maxAttempts: '1'
      },
      {
        priority: '2'  
      }
    ];
  
    parseIntFromLexRequestObject(input);
  
    expect(input[0].maxAttempts).toEqual(1);
    expect(input[1].priority).toEqual(2);
  
  });
  
  test('does not parse non-integer string or boolean', () => {

    const input = {
      content: 'abc',
      createVersion: true
    };
  
    parseIntFromLexRequestObject(input);
  
    expect(input.content).toEqual('abc');
    expect(input.createVersion).toEqual(true);
  });
  
  test('ignores missing properties', () => {

    const input = {
      slotVersionId: '1'
    };
  
    parseIntFromLexRequestObject(input);
  
    expect(input.slotVersionId).toEqual('1');
  
  });
  
  test('ignores null/undefined values', () => {

    const input = {
      groupNumber: null
    };
  
    parseIntFromLexRequestObject(input);
  
    expect(input.groupNumber).toBeNull();
  
  });
  
  test('parses in nested arrays', () => {

    const input = [[
      {
        maxAttempts: '1'  
      }
    ]];
  
    parseIntFromLexRequestObject(input);
  
    expect(input[0][0].maxAttempts).toEqual(1);
  
  });

  test('ignores integer properties of object that are already a number', ()  => {

    const input = {
      maxAttempts: 1
    };

    parseIntFromLexRequestObject(input);

    expect(input.maxAttempts).toEqual(1);
  });
  
  test('should parse sample putIntent input params', ()  => {
    const putIntentParams = {
      createVersion: true,
      sampleUtterances: [
        "My age is {Age}",
        "Age is {Age}",
        "It is {Age}",
        "I am {Age}",
        "I am {Age} years old",
        "His age is {Age}",
        "He is {Age}",
        "He is {Age} years old",
        "Her age is {Age}",
        "She is {Age}",
        "She is {Age} years old",
        "{Age}",
      ],
      rejectionStatement: {
        messages: [
          {
            contentType: "PlainText",
            content: "Please let me know the age again.",
          },
        ],
      },
      slots: [
        {
          valueElicitationPrompt: {
            maxAttempts: "2",
            messages: [
              {
                contentType: "PlainText",
                content: "What age?",
              },
            ],
          },
          slotConstraint: "Required",
          slotType: "AMAZON.NUMBER",
          name: "Age",
          priority: "1",
        },
      ],
      conclusionStatement: {
        messages: [
          {
            contentType: "PlainText",
            content: "OK. ",
          },
        ],
      },
      confirmationPrompt: {
        maxAttempts: "1",
        messages: [
          {
            contentType: "PlainText",
            content: "Is {Age} correct (Yes or No)?",
          },
        ],
      },
      name: "testIntent",
      description: "testIntent",
      fulfillmentActivity: {
        type: "ReturnIntent",
      },
    };

    parseIntFromLexRequestObject(putIntentParams);
    
    expect(putIntentParams.slots[0].priority).toEqual(1);
    expect(putIntentParams.slots[0].valueElicitationPrompt.maxAttempts).toEqual(2);
    expect(putIntentParams.confirmationPrompt.maxAttempts).toEqual(1);
  
  });
  
  test('should parse sample putBot input params', ()  => {
    const putBotParams = {
      createVersion: true,
      voiceId : "Joanna",
      intents: [
          {
              intentName: "QNATestIntent",
              intentVersion: "1"
          }
      ],
      clarificationPrompt: {
          maxAttempts: "3",
          messages: [
              {
                  contentType: "PlainText",
                  content: "Please repeat your first and last name?"
              }
          ]
      },
      name: "QNATestBot",
      description: "QNA Test Bot",
      childDirected: false,
      locale: "en-US",
      abortStatement: {
          messages: [
              {
                  contentType: "PlainText",
                  content: "Sorry, I could not understand. Please start again."
              }
          ]
      },
      processBehavior: "BUILD"
    }
    parseIntFromLexRequestObject(putBotParams);
    
    expect(putBotParams.intents[0].intentVersion).toEqual('1');
    expect(putBotParams.childDirected).toEqual(false);
    expect(putBotParams.clarificationPrompt.maxAttempts).toEqual(3);
  
  });

  test('should not parse sample putBotAlias input params', ()  => {
    const putBotAliasParams = {
      botName: "QNAMonthBotTest",
      botVersion: "1",
      checksum: "b11efbbb-1c69-455b-9cbb-09a43777148a",
      createdDate: "2023-11-27T17:22:58.619Z",
      description: "QNA Month Alias - 5.5.0 - v1",
      lastUpdatedDate: "2023-11-27T17:22:58.619Z",
      name: "live"
    }
  
    parseIntFromLexRequestObject(putBotAliasParams);
    
    expect(putBotAliasParams).toEqual({
      botName: "QNAMonthBotTest",
      botVersion: "1",
      checksum: "b11efbbb-1c69-455b-9cbb-09a43777148a",
      createdDate: "2023-11-27T17:22:58.619Z",
      description: "QNA Month Alias - 5.5.0 - v1",
      lastUpdatedDate: "2023-11-27T17:22:58.619Z",
      name: "live"
    });
  });

  test('should not parse sample putSlotType input params', ()  => {
    const putSlotTypeParams = {
      checksum: "8fdc9528-e5fd-440f-8ad0-896a7f6fb289",
      createVersion: true,
      createdDate: "2023-11-27T17:22:45.368Z",
      description: "QNA Yes No Slot Type - 5.5.0 - v1",
      enumerationValues: [
          {
              synonyms: [
                  "no",
                  "nope",
                  "na",
                  "negative",
                  "non",
                  "2",
                  "two"
              ],
              value: "No"
          },
          {
              synonyms: [
                  "yes",
                  "ok",
                  "yeah",
                  "sure",
                  "yep",
                  "affirmative",
                  "aye",
                  "correct",
                  "1",
                  "one"
              ],
              value: "Yes"
          }
      ],
      lastUpdatedDate: "2023-11-27T17:22:45.368Z",
      name: "QNATestSlotType",
      valueSelectionStrategy: "TOP_RESOLUTION",
      version: "1"
    }
  
    const before = JSON.stringify(putSlotTypeParams);
    parseIntFromLexRequestObject(putSlotTypeParams);
    expect(JSON.stringify(putSlotTypeParams)).toEqual(before);
  });