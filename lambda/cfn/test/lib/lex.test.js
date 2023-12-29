/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const originalEnv = process.env;
const lex = require('../../lib/lex');
const { LexModelBuildingServiceClient,
        GetIntentVersionsCommand, 
        GetSlotTypeCommand, 
        DeleteBotAliasCommand,
        PutBotCommand, 
        PutBotAliasCommand, 
        PutIntentCommand, 
        GetSlotTypeVersionsCommand,
        GetBotVersionsCommand,
        GetBotCommand,
        GetBotAliasCommand,
        GetIntentCommand, 
        PutSlotTypeCommand 
    } = require('@aws-sdk/client-lex-model-building-service');
const { IAM, CreateServiceLinkedRoleCommand } = require('@aws-sdk/client-iam');
const { mockClient } = require('aws-sdk-client-mock');
const lexFixtures = require('./lex.fixtures');
const iamMock = mockClient(IAM);
const lexModelBuildingServiceClientMock = mockClient(LexModelBuildingServiceClient);

describe('test lex class', () => {  
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };
        
        jest.resetModules();
        lexModelBuildingServiceClientMock.reset();
        iamMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it("should be able to get checksum for bot type", async () => {
        const lexCut = new lex('Bot');

        lexModelBuildingServiceClientMock.on(GetBotCommand).resolves({ checksum: 'mock_checksum' });

        const result = await lexCut.checksum('mock_bot', 'mock_checksum');
        
        expect(result).toBe('mock_checksum');
    });  

    it("should be able to get checksum for intent or slot type", async () => {
        const lexCut = new lex('Bot');
        
        lexModelBuildingServiceClientMock.on(GetBotCommand).resolves({ checksum: 'mock_checksum' });

        const result = await lexCut.checksumIntentOrSlotType('mock_id', 'mock_version');
        
        expect(result).toBe('mock_checksum');
    });  

    it("should be able to get checksum for bot alias", async () => {
        const lexCut = new lex('Bot');
        
        lexModelBuildingServiceClientMock.on(GetBotCommand).resolves({ checksum: 'mock_checksum' });

        const result = await lexCut.checksumBotAlias('mock_bot_name', 'mock_name');

        expect(result).toBe('mock_checksum');
    });  

    it("should be able to get slot type versions", async () => {
        const lexCut = new lex('Bot');
        const slotTypeObject = lexFixtures.slotTypeObject();
        
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);

        const result = await lexCut.slotTypeVersions('mock_id');

        expect(result).toBe(slotTypeObject);
    });  

    it("should be able to get intent versions", async () => {
        const lexCut = new lex('Bot');
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);

        const result = await lexCut.intentVersions('mock_id');
        
        expect(result).toBe(intentsTypeObject);
    });  

    it("should be able to get map of intent latest versions from an array of intents", async () => {
        const lexCut = new lex('Bot');
        const intentsTypeObject = lexFixtures.intentsObject();
        const expectedMap = new Map ([[ 'mock_intent', 'mock_version' ]]);
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);

        const result = await lexCut.mapForIntentVersions([ intentsTypeObject ]);

        expect(result).toEqual(expectedMap);
    });  
    
    it("should catch error when trying to get map of intent latest versions from an array of intents", async () => {
        const lexCut = new lex('Bot');
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).rejects('mock_error');

        try {
            const result = await lexCut.mapForIntentVersions([ intentsTypeObject ]);
        } catch (error) {
            expect(error.message).toEqual('mock_error');
        }
    });  

    it("should be able to get bot versions", async () => {
        const lexCut = new lex('Bot');
        const botVersionObject = lexFixtures.botVersionObject();
        
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolves({ bots: botVersionObject });

        const result = await lexCut.botVersions('mock_id');

        expect(result).toBe(botVersionObject);
    });  

    it("should be able to get latest bot version", async () => {
        const lexCut = new lex('Bot');
        const botVersionObject = lexFixtures.botVersionObject();
        
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolves( botVersionObject );

        const result = await lexCut.latestBotVersion('mock_id');

        expect(result).toBe('mock_version');
    });  

    it("should error out in getting latest bot version if an error occurs with the internal function", async () => {
        const lexCut = new lex('Bot');
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).rejects('mock_error');
        
        try {
            await lexCut.latestBotVersion('mock_id');
        } catch (error) {
            expect(error.message).toBe('mock_error');
        } 
    });  

    it("should be able to get map of slot types of an array of slots", async () => {
        const lexCut = new lex('Bot');
        const slotTypeObject = lexFixtures.slotTypeObject();
        const expectedMap = new Map ([[ 'mock_slot_type', 'mock_version' ]]);
        
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);

        const result = await lexCut.mapForSlotTypeVersions([slotTypeObject]);

        expect(result).toEqual(expectedMap);
    });  

    it("should catch error when trying to get map of slot types of an array of slots", async () => {
        const lexCut = new lex('Bot');
        const slotTypeObject = lexFixtures.slotTypeObject();
        
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).rejects('mock_error');

        try {
            await lexCut.mapForSlotTypeVersions([slotTypeObject]);
        } catch (error) {
            expect(error.message).toBe('mock_error');
        }
    });  

    it("should be able to get name of bot alias with name defined", async () => {
        const lexCut = new lex('BotAlias');
        
        const result = await lexCut.name({ name:'mock_name' });

        expect(result).toEqual('mock_name');
    });  

    it("should be able to get generated name of bot", async () => {
        const lexCut = new lex('Bot');

        const result = await lexCut.name({ name:'mock_name' });

        expect(result).toHaveLength(14); // length of mock_name + 5 randomly generated id
    });  

    it("should be able to create bot alias with a name not specified", async () => {
        const lexCut = new lex('BotAlias');
        const botAliasObject = JSON.parse(JSON.stringify(lexFixtures.botAliasObject())); // Deep copy
        botAliasObject.name = '';
        const botVersionObject = lexFixtures.botVersionObject();
        
        lexModelBuildingServiceClientMock.on(PutBotAliasCommand).resolves(botAliasObject);
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolves(botVersionObject);

        const callback = (error, result, extraResult) => {
            expect(result).toBeDefined();
            expect(error).toBeNull();
        };
        
        await lexCut.Create(botAliasObject, callback);
    });  

    it("should be able to create bot alias", async () => {
        const lexCut = new lex('BotAlias');
        const botAliasObject = lexFixtures.botAliasObject();
        const botVersionObject = lexFixtures.botVersionObject();
        
        lexModelBuildingServiceClientMock.on(PutBotAliasCommand).resolves(botAliasObject);
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolves(botVersionObject);

        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_name');
        };
        
        await lexCut.Create(botAliasObject, callback);
    });  

    it("should be able to create intent", async () => {
        const lexCut = new lex('Intent');
        const intentObject = lexFixtures.intentObject();
        const slotTypeObject = lexFixtures.slotTypeObject();

        lexModelBuildingServiceClientMock.on(PutIntentCommand).resolves(intentObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);
        
        const callback = (error, result, extraResult) => {
            expect(result.startsWith('mock_intent')).toBe(true);
        };

        await lexCut.Create(intentObject, callback);
    });  

    it("should be able to create bot", async () => {
        const lexCut = new lex('Bot');
        const botObject = lexFixtures.botObject();
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);

        const callback = (error, result, extraResult) => {
            expect(result.startsWith('mock_bot_name')).toBeTruthy();
        };
        
        await lexCut.Create(botObject, callback);
    });  

    it("should be able to create bot with no intents defined", async () => {
        const lexCut = new lex('Bot');
        const botObject = JSON.parse(JSON.stringify(lexFixtures.botObject())); // Deep copy
        botObject.intents = '';
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);
        iamMock.on(CreateServiceLinkedRoleCommand).resolves({});
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves({ name:'mock_bot_name' });

        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_bot_name');
        };
        
        await lexCut.Create(botObject, callback);
    });  

    it("should catch error when trying to create bot and creating IAM service linked role fails", async () => {
        const lexCut = new lex('Bot');
        const botObject = lexFixtures.botObject();
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);
        iamMock.on(CreateServiceLinkedRoleCommand).rejects('mock_error');

        const callback = (error, result, extraResult) => {};
        
        try {
            await lexCut.Create(botObject, callback);
        } catch (error) {
            expect(error.message).toBe('mock_error');
        }
    });  

    it("should catch error when trying to create bot and creating IAM service linked role fails and intents are not defined", async () => {
        const lexCut = new lex('Bot');
        const botObject = JSON.parse(JSON.stringify(lexFixtures.botObject())); // Deep copy
        botObject.intents = '';
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);
        lexModelBuildingServiceClientMock.on(PutBotCommand).rejects({ name:'mock_error' });

        const callback = (error, result, extraResult) => {
            expect(error).toBe('mock_error:');
        };
        
        try {
            await lexCut.Create(botObject, callback);
        } catch (error) {
            expect(error.message).toBe('mock_error');
        }
    });
    
    it("should catch error when trying to create bot and getting the intent version map fails", async () => {
        const lexCut = new lex('Bot');
        const botObject = lexFixtures.botObject();
        
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).rejects('mock_error');

        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('mock_error');
        };
        
        await lexCut.Create(botObject, callback);
    });  
    
    // TODO: The function 'createGeneric' that this test will hit appears to never be intended to pass the
    // resolve case, as it will always fail in the private 'run' function due to lex[fnc] not being a function.
    // Consider checking this and verifying, then probably just remove the createGeneric method completely (unless
    // this is actually missing an intended use case) and instead have the errors caught/rejected in the else
    // case of the method 'Create'. 
    it("should fail on trying to create non-supported types", async () => {
        const lexCut = new lex('NotAcceptedType');
        const botObject = lexFixtures.botObject();
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);

        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('lex[fnc] is not a function');
        };
        
        await lexCut.Create(botObject, callback);
    });  

    it("should not update an alias", async () => {
        const lexCut = new lex('Alias');

        // No mocks needed because this is a passthrough case that simply returns the ID passed in.
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };
        
        await lexCut.Update('mock_id', {}, {}, callback);
    });  

    it("should update a bot", async () => {
        const lexCut = new lex('Bot');
        const intentsTypeObject = lexFixtures.intentsObject();
        const botObject = lexFixtures.botObject();
        
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);
        lexModelBuildingServiceClientMock.on(GetBotCommand).resolves({ checksum: 'mock_checksum' });
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);

        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };
        
        await lexCut.Update('mock_id', botObject, {}, callback);
    });  

    it("should catch failure when updating a bot when getting maps for intent versions", async () => {
        const lexCut = new lex('Bot');
        const botObject = lexFixtures.botObject();
        
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);
        lexModelBuildingServiceClientMock.on(GetBotCommand).resolves({ checksum: 'mock_checksum' });
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).rejects('mock_error');

        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('mock_error');
        };
        
        await lexCut.Update('mock_id', botObject, {}, callback);
    });  

    it("should catch failure when updating a bot when getting checksum", async () => {
        const lexCut = new lex('Bot');
        const intentsTypeObject = lexFixtures.intentsObject();
        const botObject = lexFixtures.botObject();
        
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);
        lexModelBuildingServiceClientMock.on(GetBotCommand).rejects('mock_error');
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);

        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('mock_error');
        };
        
        await lexCut.Update('mock_id', botObject, {}, callback);
    });  

    it("should update an intent", async () => {
        const lexCut = new lex('Intent');
        const intentObject = lexFixtures.intentObject();
        const slotTypeObject = lexFixtures.slotTypeObject();

        lexModelBuildingServiceClientMock.on(PutIntentCommand).resolves(intentObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);
        lexModelBuildingServiceClientMock.on(GetIntentCommand).resolves({ checksum: 'mock_checksum' });
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };
        
        await lexCut.Update('mock_id', intentObject, {}, callback);
    });  

    it("should update an intent when no slots are specified", async () => {
        const lexCut = new lex('Intent');
        const intentObject = JSON.parse(JSON.stringify(lexFixtures.intentObject())); // Deep copy
        intentObject.slots = '';
        const slotTypeObject = lexFixtures.slotTypeObject();

        lexModelBuildingServiceClientMock.on(PutIntentCommand).resolves(intentObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);
        lexModelBuildingServiceClientMock.on(GetIntentCommand).resolves({ checksum: 'mock_checksum' });
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };
        
        await lexCut.Update('mock_id', intentObject, {}, callback);
    });  

    it("should catch failure when updating an intent when getting checksums", async () => {
        const lexCut = new lex('Intent');
        const intentObject = lexFixtures.intentObject();
        const slotTypeObject = lexFixtures.slotTypeObject();

        lexModelBuildingServiceClientMock.on(PutIntentCommand).resolves(intentObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);
        lexModelBuildingServiceClientMock.on(GetIntentCommand).rejects('mock_error');
        
        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('mock_error');
        };
        
        await lexCut.Update('mock_id', intentObject, {}, callback);
    });  

    it("should update a slot type", async () => {
        const lexCut = new lex('SlotType');
        const slotTypeObject = lexFixtures.slotTypeObject();

        lexModelBuildingServiceClientMock.on(PutSlotTypeCommand).resolves(slotTypeObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeCommand).resolves({ checksum: 'mock_checksum' });
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };
        
        await lexCut.Update('mock_id', slotTypeObject, {}, callback);
    });  

    it("should catch failure when updating a slot type when getting checksums", async () => {
        const lexCut = new lex('SlotType');
        const slotTypeObject = lexFixtures.slotTypeObject();

        lexModelBuildingServiceClientMock.on(PutSlotTypeCommand).resolves(slotTypeObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeVersionsCommand).resolves(slotTypeObject);
        lexModelBuildingServiceClientMock.on(GetSlotTypeCommand).rejects('mock_error');
        
        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('mock_error');
        };
        
        await lexCut.Update('mock_id', slotTypeObject, {}, callback);
    });  

    it("should update a bot alias", async () => {
        const lexCut = new lex('BotAlias');
        const botAlias = lexFixtures.botAliasObject();
        const botVersionObject = lexFixtures.botVersionObject();
        
        lexModelBuildingServiceClientMock.on(PutBotAliasCommand).resolves(botAlias);
        lexModelBuildingServiceClientMock.on(GetBotAliasCommand).resolves({ checksum: 'mock_checksum' });
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolvesOnce({ bots: botVersionObject });
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolvesOnce( botVersionObject );
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_name');
        };
        
        await lexCut.Update('mock_id', botAlias, {}, callback);
    });  
    
    it("should catch failure when updating a bot alias when getting checksums", async () => {
        const lexCut = new lex('BotAlias');
        const botAlias = lexFixtures.botAliasObject();
        const botVersionObject = lexFixtures.botVersionObject();
        
        lexModelBuildingServiceClientMock.on(PutBotAliasCommand).resolves(botAlias);
        lexModelBuildingServiceClientMock.on(GetBotAliasCommand).rejects('mock_error');
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolvesOnce({ bots: botVersionObject });
        lexModelBuildingServiceClientMock.on(GetBotVersionsCommand).resolvesOnce( botVersionObject );
        
        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('mock_error');
        };
        
        await lexCut.Update('mock_id', botAlias, {}, callback);
    });  
    
    // TODO: The function 'updateGeneric' that this test will hit appears to never be intended to pass the
    // resolve case, as it will always fail in the private 'run' function due to lex[fnc] not being a function.
    // Consider checking this and verifying, then probably just remove the updateGeneric method completely (unless
    // this is actually missing an intended use case) and instead have the errors caught/rejected in the else
    // case of the method 'Update'. 
    it("should fail on trying to update non-supported types", async () => {
        const lexCut = new lex('NotAcceptedType');
        const botObject = lexFixtures.botObject();
        const intentsTypeObject = lexFixtures.intentsObject();
        
        lexModelBuildingServiceClientMock.on(GetIntentVersionsCommand).resolves(intentsTypeObject);
        lexModelBuildingServiceClientMock.on(PutBotCommand).resolves(botObject);

        const callback = (error, result, extraResult) => {
            expect(error.message).toBe('lex[fnc] is not a function');
        };
        
        await lexCut.Update('mock_id', botObject, {}, callback);
    });  

    it("should delete a lex object", async () => {
        const lexCut = new lex('BotAlias');
        const botAliasObject = lexFixtures.botAliasObject();
        
        lexModelBuildingServiceClientMock.on(DeleteBotAliasCommand).resolves(botAliasObject);
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_name');
        };
        
        await lexCut.Delete('mock_id', botAliasObject, callback);
    });  

    it("should reply with an id if deleting an object fails due to not being found", async () => {
        const lexCut = new lex('BotAlias');
        const botAliasObject = lexFixtures.botAliasObject();
        
        lexModelBuildingServiceClientMock.on(DeleteBotAliasCommand).rejects('NotFoundException');

        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };
        
        await lexCut.Delete('mock_id', botAliasObject, callback);
    });  

    it("should receieve an error if deleting an object fails", async () => {
        const lexCut = new lex('BotAlias');
        const botAliasObject = lexFixtures.botAliasObject();
        
        lexModelBuildingServiceClientMock.on(DeleteBotAliasCommand).rejects('mock_error');
        const callback = (error, result, extraResult) => {
            expect(error.endsWith('mock_error')).toBeTruthy();
        };
        
        await lexCut.Delete('mock_id', botAliasObject, callback);
    });  
});