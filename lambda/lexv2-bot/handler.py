# Creates or updates a Lex V2 QnABot bot by copying an existing Lex V1 QnABot bot
# TODO - add action to delete lexV2 bot

import os
import json
import boto3
import time
from crhelper import CfnResource
helper = CfnResource()
clientLEXV1 = boto3.client('lex-models')
clientLEXV2 = boto3.client('lexv2-models')
clientIAM = boto3.client('iam')


# LEXV1 QNABOT INFO (from Cfn outputs)
BOT_NAME = os.environ["BOTNAME"]
BOT_ALIAS = os.environ["BOTALIAS"]
INTENT = os.environ["INTENT"]
SLOT_TYPE = os.environ["SLOTTYPE"]
FULFILLMENT_LAMBDA_ARN = os.environ["FULFILLMENT_LAMBDA_ARN"]
LEXV2_BOT_DRAFT_VERSION = "DRAFT"
LEXV2_TEST_BOT_ALIAS = "TestBotAlias"
LEXV2_BOT_LOCALE_ID = "en_US"


# Copy utterances from existing V1 bot
def get_qna_V1_slotutterances(slotNameV1):
    utterances = []
    response = clientLEXV1.get_slot_type(
        name=slotNameV1,
        version='$LATEST'
    )
    for enumerationValue in response["enumerationValues"]:
        utterances.append(enumerationValue["value"])
    return utterances
    
def get_qna_V2_slotTypeValues_from_V1(slotNameV1):
    slotTypeValues = []
    utterances = get_qna_V1_slotutterances(slotNameV1)
    for utterance in utterances:
        slotTypeValue = {
            'sampleValue': {
                'value': utterance
            }
        }
        slotTypeValues.append(slotTypeValue)
    return slotTypeValues

def get_slotTypeId(slotTypeName, botId, botVersion, localeId):
    slotTypeId = None
    response = clientLEXV2.list_slot_types(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId,
        filters=[
            {
                'name': 'SlotTypeName',
                'values': [
                    slotTypeName,
                ],
                'operator': 'EQ'
            },
        ],
        maxResults=1000
    )
    if len(response["slotTypeSummaries"]) == 1:
        slotTypeId = response["slotTypeSummaries"][0]["slotTypeId"]
    elif len(response["slotTypeSummaries"]) > 1:
        raise Exception(f"Multiple matching slotTypes for slotTypeName: {slotTypeName}")
    return slotTypeId 

def get_slotId(slotName, intentId, botId, botVersion, localeId):
    slotId = None
    response = clientLEXV2.list_slots(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId,
        intentId=intentId,
        filters=[
            {
                'name': 'SlotName',
                'values': [
                    slotName,
                ],
                'operator': 'EQ'
            },
        ],
        maxResults=1000
    )
    if len(response["slotSummaries"]) == 1:
        slotId = response["slotSummaries"][0]["slotId"]
    elif len(response["slotSummaries"]) > 1:
        raise Exception(f"Multiple matching slots for slotName: {slotName}")
    return slotId 


def get_botId(botName):
    botId = None
    response = clientLEXV2.list_bots(
        filters=[
            {
                'name': 'BotName',
                'values': [
                    botName,
                ],
                'operator': 'EQ'
            }
        ],
        maxResults=1000
    )
    if len(response["botSummaries"]) == 1:
        botId = response["botSummaries"][0]["botId"]
    elif len(response["botSummaries"]) > 1:
        raise Exception(f"Multiple matching bots for botName: {botName}")
    return botId


def get_intentId(intentName, botId, botVersion, localeId):
    intentId = None
    response = clientLEXV2.list_intents(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId,
        filters=[
            {
                'name': 'IntentName',
                'values': [
                    intentName,
                ],
                'operator': 'EQ'
            },
        ],
        maxResults=1000
    )
    if len(response["intentSummaries"]) == 1:
        intentId = response["intentSummaries"][0]["intentId"]
    elif len(response["intentSummaries"]) > 1:
        raise Exception(f"Multiple matching intents for intentName: {intentName}")
    return intentId   


def lexV2_qna_slotTypeValues(slotTypeName, botId, botVersion, localeId):
    slotTypeValues = get_qna_V2_slotTypeValues_from_V1(slotTypeName)
    slotTypeId = get_slotTypeId(slotTypeName, botId, botVersion, localeId)
    slotTypeParams = {
        "slotTypeName": slotTypeName,
        "slotTypeValues": slotTypeValues,
        "valueSelectionSetting": {
            'resolutionStrategy': 'OriginalValue'
        },
        "botId": botId,
        "botVersion": botVersion,
        "localeId": localeId        
    }
    if slotTypeId:
        print(f"Updating SlotType {slotTypeName}")
        clientLEXV2.update_slot_type(slotTypeId=slotTypeId, **slotTypeParams)
    else:
        print(f"Creating SlotType {slotTypeName}")
        clientLEXV2.create_slot_type(**slotTypeParams)       


def lexV2_qna_intent_slot(slotName, intentId, slotTypeId, botId, botVersion, localeId):
    valueElicitationSetting = {
        "promptSpecification": {
            "messageGroups": [
                {
                    "message": {
                        "plainTextMessage": {
                            "value": "What is the question?"
                        }
                    }
                }
            ], 
            "maxRetries": 4
        }, 
        "slotConstraint": "Required"
    }
    slotParams = {
        "slotName": slotName,
        "slotTypeId": slotTypeId,
        "valueElicitationSetting": valueElicitationSetting,
        "botId": botId,
        "botVersion": botVersion,
        "localeId": localeId,
        "intentId": intentId        
    }
    slotId = get_slotId(slotName, intentId, botId, botVersion, localeId)
    if slotId:
        print(f"Updating slot: {slotName}, slotId {slotId}, type {slotTypeId} for intent {intentId}")
        response = clientLEXV2.update_slot(slotId=slotId, **slotParams)
        print(f'Updated slot - Id: {slotId}')        
    else:
        print(f"Creating slot: {slotName}, type {slotTypeId} for intent {intentId}")
        response = clientLEXV2.create_slot(**slotParams)
        slotId = response["slotId"];
        print(f'Created slot - Id: {slotId}')
    return slotId
    

def lexV2_qna_intent(intentName, slotTypeName, botId, botVersion, localeId):
    slotName="qnaslot"
    sampleUtterances = [{f"utterance": f"{{{slotName}}}"}]
    intentParams = {
            "intentName": intentName,
            "sampleUtterances":sampleUtterances,
            "fulfillmentCodeHook": {'enabled': True},
            "botId": botId,
            "botVersion": botVersion,
            "localeId": localeId
    }
    intentId = get_intentId(intentName, botId, botVersion, localeId)
    slotTypeId = get_slotTypeId(slotTypeName, botId, botVersion, localeId)
    if intentId:
        print(f"Updating intent: {intentName}, intentId {intentId}")
        response = clientLEXV2.update_intent(intentId=intentId, **intentParams)
        print(f'Updated intent - Id: {intentId}')        
    else:
        print(f"Creating intent: {intentName}")
        response = clientLEXV2.create_intent(**intentParams)
        intentId = response["intentId"];
        print(f'Created intent - Id: {intentId}')
    slotId = lexV2_qna_intent_slot(slotName, intentId, slotTypeId, botId, botVersion, localeId)
    print(f'Updating intent to add slot priority - intentId: {intentId}, slotId {slotId}')        
    response = clientLEXV2.update_intent(
        **intentParams,
        intentId=intentId,
        slotPriorities=[
            {
                'priority': 1,
                'slotId': slotId
            }
        ]
        )
    intentId = response["intentId"];
    print(f'Updated intent to add slot priority - intentId: {intentId}, slotId {slotId}')        

def lexV2_fallback_intent(botId, botVersion, localeId):
    intentName = "FallbackIntent"
    intentId = get_intentId(intentName, botId, botVersion, localeId)
    intentParams = {
            "intentId": intentId,
            "intentName": intentName,
            "parentIntentSignature": "AMAZON.FallbackIntent",
            "fulfillmentCodeHook": {'enabled': True},
            "botId": botId,
            "botVersion": botVersion,
            "localeId": localeId
    }
    print(f"Updating fallback intent {intentId} to set Lambda for fulfilment.")
    clientLEXV2.update_intent(**intentParams)
    print(f'Updated fallback intent - Id: {intentId}')        


def get_bot_locale_status(botId, botVersion, localeId):
    response = clientLEXV2.describe_bot_locale(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId
    )
    botLocaleStatus = response["botLocaleStatus"]
    print(f"Bot locale status: {botLocaleStatus}")
    return botLocaleStatus    
  
def wait_for_lexV2_qna_locale(botId, botVersion, localeId):
    botLocaleStatus = get_bot_locale_status(botId, botVersion, localeId)
    while botLocaleStatus not in ["NotBuilt","Built"]:
        if botLocaleStatus not in ["Creating","Building","ReadyExpressTesting"]:
            raise Exception(f"Invalid botLocaleStatus: {botLocaleStatus}")
        time.sleep(5)
        botLocaleStatus = get_bot_locale_status(botId, botVersion, localeId)
    return botLocaleStatus

def lexV2_qna_locale(botId, botVersion, localeId):
    try:
        response = clientLEXV2.create_bot_locale(
            botId=botId,
            botVersion=botVersion,
            localeId=localeId,
            nluIntentConfidenceThreshold=0.40,
            voiceSettings={
                'voiceId': 'Joanna'
            }
        )
    except:
        print(f"Locale {localeId} already exists for botId {botId}")
    wait_for_lexV2_qna_locale(botId, botVersion, localeId)
    return localeId


def get_or_create_lexV2_service_linked_role(botName):
    # Does role already exist?
    rolenamePrefix = "AWSServiceRoleForLexV2Bots"
    rolenameSuffix = botName[0:(63-len(rolenamePrefix))]  # max len 64
    roleName = f"{rolenamePrefix}_{rolenameSuffix}"
    print(roleName)
    try:
        response = clientIAM.get_role(
            RoleName=roleName
        )
        roleArn = response["Role"]["Arn"]
    except:
        response = clientIAM.create_service_linked_role(
            AWSServiceName='lexv2.amazonaws.com',
            Description=f'Service role for QnABot - {botName}',
            CustomSuffix=rolenameSuffix
        )
        roleArn = response["Role"]["Arn"]
    return roleArn

def get_bot_status(botId):
    response = clientLEXV2.describe_bot(botId=botId)
    botStatus = response["botStatus"]
    print(f"Bot status: {botStatus}")
    return botStatus  

def wait_for_lexV2_qna_bot(botId):
    botStatus = get_bot_status(botId)
    while botStatus != 'Available':
        if botStatus not in ["Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {botStatus}")
        time.sleep(5)
        botStatus = get_bot_status(botId)
    return botStatus

def lexV2_qna_bot(botName):
    botId = get_botId(botName)
    if not botId:
        print(f"Creating bot {botName}")
        response = clientLEXV2.create_bot(
            botName=botName,
            description='QnABot Lex V2',
            roleArn=get_or_create_lexV2_service_linked_role(botName),
            dataPrivacy={
                'childDirected': False
            },
            idleSessionTTLInSeconds=300
        )
        botId = response["botId"]
        print(f"Creates bot {botName} with ID {botId}")
    else:
        print(f"Bot {botName} exists with ID {botId}")
    wait_for_lexV2_qna_bot(botId)
    return botId

def get_bot_version_status(botId, botVersion):
    response = clientLEXV2.describe_bot_version(
        botId=botId,
        botVersion=botVersion
    )
    botStatus = response["botStatus"]
    print(f"Bot status: {botStatus}")
    return botStatus 

def wait_for_lexV2_qna_version(botId, botVersion):
    botStatus = get_bot_version_status(botId, botVersion)
    while botStatus != 'Available':
        if botStatus not in ["Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {botStatus}")
        time.sleep(5)
        botStatus = get_bot_version_status(botId, botVersion)
    return botStatus
    
def lexV2_qna_version(botId, botDraftVersion, localeId):
    botVersion = None
    print(f"Creating bot version from {botDraftVersion}")
    response = clientLEXV2.create_bot_version(
        botId=botId,
        botVersionLocaleSpecification={
            localeId: {
                'sourceBotVersion': botDraftVersion
            }
        }
    )
    botVersion = response["botVersion"]
    botStatus = response["botStatus"]
    print(f"Created bot version {botVersion} - {botStatus}")
    time.sleep(5)
    wait_for_lexV2_qna_version(botId, botVersion)
    return botVersion

def get_bot_aliasId(botId, botAliasName):
    botAliasId = None
    response = clientLEXV2.list_bot_aliases(
        botId=botId,
        maxResults=1000
    )
    for alias in response["botAliasSummaries"]:
        if alias["botAliasName"] == botAliasName:
            botAliasId = alias["botAliasId"]
    return botAliasId
    
def get_bot_alias_status(botId, botAliasId):
    response = clientLEXV2.describe_bot_alias(
        botId=botId,
        botAliasId=botAliasId
    )
    botAliasStatus = response["botAliasStatus"]
    print(f"Bot alias status: {botAliasStatus}")
    return botAliasStatus 

def wait_for_lexV2_qna_alias(botId, botAliasId):
    botAliasStatus = get_bot_alias_status(botId, botAliasId)
    while botAliasStatus != 'Available':
        if botAliasStatus not in ["Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {botAliasStatus}")
        time.sleep(5)
        botAliasStatus = get_bot_alias_status(botId, botAliasId)
    return botAliasStatus

def lexV2_qna_alias(botId, botVersion, botAliasName, botLocaleId, botFullfillmentLambdaArn):
    botAliasId = get_bot_aliasId(botId, botAliasName)
    aliasParams = {
        'botAliasName':botAliasName,
        'botVersion':botVersion,
        'botAliasLocaleSettings':{
            botLocaleId: {
                'enabled': True,
                'codeHookSpecification': {
                    'lambdaCodeHook': {
                        'lambdaARN': botFullfillmentLambdaArn,
                        'codeHookInterfaceVersion': '1.0'
                    }
                }
            }
        },
        'sentimentAnalysisSettings':{
            'detectSentiment': False
        },
        'botId':botId
    }
    if not botAliasId:
        print(f"Creating botAlias {botAliasName} for bot {botId} version {botVersion}")
        response = clientLEXV2.create_bot_alias(**aliasParams)
        botAliasId = response["botAliasId"]
        print(f"Creates bot alias {botAliasName} with ID {botAliasId}")
    else:
        print(f"Updating botAlias {botAliasName} for bot {botId} version {botVersion}")
        response = clientLEXV2.update_bot_alias(**aliasParams, botAliasId=botAliasId)
        botAliasId = response["botAliasId"]
        print(f"Updated bot alias {botAliasName} with ID {botAliasId}")
    wait_for_lexV2_qna_alias(botId, botAliasId)
    return botAliasId

def build_lexV2_qna_bot(botId, botVersion, localeId):
    print("Building bot: {botId}, {botVersion}, {localeId}")
    response = clientLEXV2.build_bot_locale(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId
    )
    wait_for_lexV2_qna_locale(botId, botVersion, localeId)
    
def lexV2_qna_delete_old_versions(botId):
    response = clientLEXV2.list_bot_versions(
        botId=botId,
        sortBy={
            'attribute': 'BotVersion',
            'order': 'Ascending'
        },
        maxResults=1000
    )
    botVersionSummaries = response["botVersionSummaries"]
    if len(botVersionSummaries) > 3:
        botVersionSummariesToDelete = botVersionSummaries[:-3] # keep highest 2 versions
        for botVersionSummary in botVersionSummariesToDelete:
            botVersion = botVersionSummary["botVersion"]
            print(f"Deleting BotVersion: {botVersion}")
            response = clientLEXV2.delete_bot_version(
                botId=botId,
                botVersion=botVersion,
                skipResourceInUseCheck=True
            )


def build_all():
    botId = lexV2_qna_bot(BOT_NAME)
    lexV2_qna_locale(botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_ID)
    lexV2_fallback_intent(botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_ID)
    lexV2_qna_slotTypeValues(SLOT_TYPE, botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_ID)
    lexV2_qna_intent(INTENT, SLOT_TYPE, botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_ID)
    build_lexV2_qna_bot(botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_ID)
    botVersion = lexV2_qna_version(botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_ID)
    lexV2_qna_alias(botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_TEST_BOT_ALIAS, LEXV2_BOT_LOCALE_ID, FULFILLMENT_LAMBDA_ARN)
    botAliasId = lexV2_qna_alias(botId, botVersion, BOT_ALIAS, LEXV2_BOT_LOCALE_ID, FULFILLMENT_LAMBDA_ARN)
    lexV2_qna_delete_old_versions(botId)
    result = {
        "botName": BOT_NAME,
        "botId": botId,
        "botAlias": BOT_ALIAS,
        "botAliasId": botAliasId,
        "botIntent": INTENT,
        "botIntentFallback": "FallbackIntent",
        "botLocaleIds": LEXV2_BOT_LOCALE_ID
    }
    return result

def delete_all():
    response = clientLEXV2.delete_bot(
        botId=BOT_NAME,
        skipResourceInUseCheck=True
    )


# cfnHelper functions
@helper.create
@helper.update
def create_or_update_bot(event, _):
    result = build_all()
    helper.Data.update(result)
@helper.delete
def delete_bot(event, _):
    delete_all()

# handler determines in function if called from CFN, allowing fn to be used
# as either a Cfn custom resource or not. 
def handler(event, context):
    if 'ResourceProperties' in event:
        print("Function called from CloudFormation: " + json.dumps(event))
        helper(event, context)
    else:
        print("Function not called from CloudFormation: " + json.dumps(event))
        result = build_all()
        print("LexV2 bot info: " + json.dumps(result))
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

# for testing on terminal
if __name__ == "__main__":
    result = build_all()
    print(result)