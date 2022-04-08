# Creates or updates a Lex V2 QnABot bot
# Automatically generates locales as specified by environment var LOCALES - from Cfn parameter.

from configparser import DuplicateSectionError
import os
import os.path
import json
import time
import sys
import re

#for boto3 path from py_modules
root = os.environ["LAMBDA_TASK_ROOT"] + "/py_modules"
sys.path.insert(0, root)
import boto3
from crhelper import CfnResource

helper = CfnResource()
clientLEXV2 = boto3.client('lexv2-models')
clientIAM = boto3.client('iam')
clientTRANSLATE = boto3.client('translate')
s3 = boto3.resource('s3')

# LEX QNABOT INFO
FULFILLMENT_LAMBDA_ARN = os.environ["FULFILLMENT_LAMBDA_ARN"]
STACKNAME = os.environ["STACKNAME"]
LEXV2_BOT_LOCALE_IDS = os.environ["LOCALES"].replace(' ','').split(",")
# ensure en_US is always in the list, and that list elements are unique
LEXV2_BOT_LOCALE_IDS.append("en_US")
LEXV2_BOT_LOCALE_IDS = list(dict.fromkeys(LEXV2_BOT_LOCALE_IDS))

BOT_NAME = STACKNAME + "_QnaBot"
QNA_INTENT = "QnaIntent"
QID_INTENT_PREFIX = "QID-"
QNA_SLOT_TYPE = "QnaSlotType"
BOT_ALIAS = "live"
LEXV2_BOT_DRAFT_VERSION = "DRAFT"
LEXV2_TEST_BOT_ALIAS = "TestBotAlias"
LEXV2_BOT_LOCALE_VOICES = {
	"de_AT": [{
	    "voiceId": "Vicki",
	    "engine": "neural"
	}], 
	"de_DE": [{
	    "voiceId": "Vicki",
	    "engine": "neural"
	}], 
	"en_AU": [{
	    "voiceId": "Olivia",
	    "engine": "neural"
	}], 
	"en_GB": [{
	    "voiceId": "Amy",
	    "engine": "neural"
	}], 
	"en_IN": [{
	    "voiceId": "Aditi",
	    "engine": "standard"
	}], 
	"en_US": [{
	    "voiceId": "Joanna",
	    "engine": "neural"
	}], 
	"en_ZA": [{
	    "voiceId": "Ayanda",
	    "engine": "neural"
	}], 
	"es_419": [{
	    "voiceId": "Mia",
	    "engine": "standard"
	}], 
	"es_ES": [{
	    "voiceId": "Lucia",
	    "engine": "neural"
	}], 
	"es_US": [{
	    "voiceId": "Lupe",
	    "engine": "neural"
	}], 
	"fr_CA": [{
	    "voiceId": "Gabrielle",
	    "engine": "neural"
	}], 
	"fr_FR": [{
	    "voiceId": "Lea",
	    "engine": "neural"
	}], 
	"it_IT": [{
	    "voiceId": "Bianca",
	    "engine": "neural"
	}], 
	"ja_JP": [{
	    "voiceId": "Takumi", 
	    "engine": "neural"
	}], 
    "ko_KR": [{
	    "voiceId": "Seoyeon", 
	    "engine": "neural"
	}], 
    "pt_BR": [{
	    "voiceId": "Camila", 
	    "engine": "neural"
	}], 
    "pt_PT": [{
	    "voiceId": "Cristiano", 
	    "engine": "standard"
	}], 
    "zh_CN": [{
	    "voiceId": "Zhiyu", 
	    "engine": "standard"
	}]
}

# if statusFile defined in lambda event, then log build status to specified S3 object
# used by getBot API for bot status checks in Designer
statusFile={}
def status(status):
    if statusFile:
        object = s3.Object(statusFile["Bucket"], statusFile["Key"])
        result=json.loads(object.get()["Body"].read())
        result["status"] = status
        object.put(Body=json.dumps(result))
    print("Status: " + status)


def get_qna_V2_slotTypeValues(slotNameV1, utterances):
    slotTypeValues = []
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

def get_slotIds(intentId, botId, botVersion, localeId):
    slotId = None
    response = clientLEXV2.list_slots(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId,
        intentId=intentId,
        maxResults=1000
    )
    slotIds = [slotSummary["slotId"] for slotSummary in response["slotSummaries"] ]
    return slotIds

def delete_slots_for_intent(intentId, botId, botVersion, localeId):
    slotIds = get_slotIds(intentId, botId, botVersion, localeId)
    if slotIds:
        print(f"Deleting slots {slotIds} for intent '{intentId}'")
        for slotId in slotIds:
            response = clientLEXV2.delete_slot(
                slotId=slotId,
                botId=botId,
                botVersion=botVersion,
                localeId=localeId,
                intentId=intentId
            )
    else:
        print(f"intent '{intentId}' has no slots")

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

def add_spantag_to_slots(utterance):
    slots = re.findall(r'({.*?})',utterance)
    for slot in slots:
        utterance = utterance.replace(slot, f'<span translate="no">{slot}</span>')
    return utterance

def remove_spantag_from_slots(utterance):
    slots = re.findall(r'<span translate="no">({.*?})</span>',utterance)
    for slot in slots:
        utterance = utterance.replace(f'<span translate="no">{slot}</span>', f" {slot} ")
    return utterance

def translate_utterances(localeId, utterances):
    translatedUtterances = []
    langCode = localeId.split("_")[0]
    for utterance in utterances:
        if len(utterance) > 1:
            try:
                # don't translate slot names
                span_utterance = add_spantag_to_slots(utterance)
                response = clientTRANSLATE.translate_text(
                    Text=span_utterance,
                    SourceLanguageCode='auto',
                    TargetLanguageCode=langCode
                )
                translatedUtterance = response["TranslatedText"]
                translatedUtterance = remove_spantag_from_slots(translatedUtterance)
            except Exception as e:
                print(f"Auto translation failed for '{utterance}' - using original. Exception: {e}")
                translatedUtterance = utterance
        else:
            print(f"Utterance {utterance} too short to translate - using original.")
            translatedUtterance = utterance
        print(f"Translated utterance: {utterance} -> {translatedUtterance}")
        translatedUtterances.append(translatedUtterance)
    # deduplicate
    translatedUtterances = list(dict.fromkeys(translatedUtterances))
    return translatedUtterances
        
    
def lexV2_qna_slotTypeValues(slotTypeName, botId, botVersion, localeId, utterances):
    print(f"SlotType {slotTypeName}")
    utterances = translate_utterances(localeId, utterances)
    slotTypeValues = get_qna_V2_slotTypeValues(slotTypeName, utterances)
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


def lexV2_intent_slot(slotName, intentId, slotTypeId, botId, botVersion, localeId, slotElicitationPrompt=None):
    # if a prompt is provided, assume slot is required
    slotConstraint = "Required" if slotElicitationPrompt else "Optional"
    slotElicitationPrompt = slotElicitationPrompt or "What is the question?"
    valueElicitationSetting = {
        "promptSpecification": {
            "messageGroups": [
                {
                    "message": {
                        "plainTextMessage": {
                            "value": slotElicitationPrompt
                        }
                    }
                }
            ], 
            "maxRetries": 4
        }, 
        "slotConstraint": slotConstraint
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
            "description": f"({localeId}) Default QnABot intent.",
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
    slotId = lexV2_intent_slot(slotName, intentId, slotTypeId, botId, botVersion, localeId)
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

def qid2intentname(qid):
    return QID_INTENT_PREFIX + qid.replace(".", "_dot_")

def intentname2qid(intentname):
    return intentname.replace(QID_INTENT_PREFIX,"").replace("_dot_",".")

def lexV2_qid_intent(qid, utterances, slots, botId, botVersion, localeId):
    # make intentName from qid - replace . characters (not allowed in intent name)
    intentName = qid2intentname(qid)
    print(f"Creating intent: {intentName} for Qid: {qid}")
    utterances  = translate_utterances(localeId, utterances)
    sampleUtterances = [{"utterance": q} for q in utterances]
    intentParams = {
            "intentName": intentName,
            "description": f"({localeId}) Intent for QnABot QID: '{qid}'",
            "sampleUtterances":sampleUtterances,
            "fulfillmentCodeHook": {'enabled': True},
            "botId": botId,
            "botVersion": botVersion,
            "localeId": localeId
    }
    intentId = get_intentId(intentName, botId, botVersion, localeId)
    if intentId:
        print(f"Updating intent: {intentName}, intentId {intentId}")
        response = clientLEXV2.update_intent(intentId=intentId, **intentParams)
        print(f'Updated intent - Id: {intentId}')        
    else:
        print(f"Creating intent: {intentName}")
        response = clientLEXV2.create_intent(**intentParams)
        intentId = response["intentId"];
        print(f'Created intent - Id: {intentId}')
    intentId = response["intentId"];
    slotPriorities = []
    # delete any/all exiting slots
    delete_slots_for_intent(intentId,botId,botVersion,localeId)
    # create new slots
    for slot in slots:
        slotName = slot["slotName"]
        slotTypeId = slot["slotType"]
        prompt = slot["slotPrompt"]
        slotId = lexV2_intent_slot(slotName, intentId, slotTypeId, botId, botVersion, localeId, prompt)
        slotPriorities.append({
            'priority': len(slotPriorities) + 1,
            'slotId': slotId           
        })
    print(f'Updating intent to add slot priorities - intentId: {intentId}')        
    response = clientLEXV2.update_intent(
        **intentParams,
        intentId=intentId,
        slotPriorities=slotPriorities
        )
    intentId = response["intentId"];
    print(f'Updated intent to add slot priorities - intentId: {intentId}')


def get_qid_intents_to_delete(intents, botId, botVersion, localeId):
    response = clientLEXV2.list_intents(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId,
        filters=[
            {
                'name': 'IntentName',
                'values': [
                    "QID-",
                ],
                'operator': 'CO'
            },
        ],
        maxResults=1000
    )
    intents_to_delete = []
    for intentSummary in response["intentSummaries"]:
        intentname = intentSummary["intentName"]
        intentid = intentSummary["intentId"]
        qid = intentname2qid(intentname)
        if qid not in intents:
            print(f"QID Intent '{intentname} : {intentid}' (QID '{qid}') has no corresponding lex enabled QIDs, and will be deleted.")
            intents_to_delete.append(intentid)          
    return intents_to_delete

def lexV2_qid_delete_intents(intents, botId, botVersion, botLocaleId):
    intents_to_delete = get_qid_intents_to_delete(intents, botId, botVersion, botLocaleId)
    for intent in intents_to_delete:
        response = clientLEXV2.delete_intent(
            intentId=intent,
            botId=botId,
            botVersion=botVersion,
            localeId=botLocaleId
        )
        print(f'Deleted intent - Id: {intent}')        

def lexV2_genesys_intent(botId, botVersion, localeId):
    intentName = "GenesysInitialIntent"
    intentParams = {
        "intentName": intentName,
        "description": f"({localeId}) Intent used only by Genesys Cloud CX integration",
        "botId": botId,
        "botVersion": botVersion,
        "localeId": localeId,
        "intentClosingSetting":{
            'closingResponse': {
                'messageGroups': [
                    {
                        'message': {
                            'ssmlMessage': {
                                'value': '<speak><break time="250ms"/></speak>'
                            },
                        },
                    },
                ],
                'allowInterrupt': True
            },
            'active': True
        },
    }
    intentId = get_intentId(intentName, botId, botVersion, localeId)
    if intentId:
        print(f"Updating intent: {intentName}, intentId {intentId}")
        response = clientLEXV2.update_intent(intentId=intentId, **intentParams)
        print(f'Updated intent - Id: {intentId}')        
    else:
        print(f"Creating intent: {intentName}")
        response = clientLEXV2.create_intent(**intentParams)
        intentId = response["intentId"];
        print(f'Created intent - Id: {intentId}')        

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
    print(f"Bot locale status: {localeId} => {botLocaleStatus}")
    return botLocaleStatus    
  
def wait_for_lexV2_qna_locale(botId, botVersion, localeId):
    botLocaleStatus = get_bot_locale_status(botId, botVersion, localeId)
    while botLocaleStatus not in ["NotBuilt","Built"]:
        time.sleep(5)
        botLocaleStatus = get_bot_locale_status(botId, botVersion, localeId)
        if botLocaleStatus not in ["NotBuilt","Built","Creating","Building","ReadyExpressTesting"]:
            raise Exception(f"Invalid botLocaleStatus for locale '{localeId}'): '{botLocaleStatus}'. Check for build errors in LexV2 console for bot '{BOT_NAME}'")
    print(f"Bot localeId {localeId}: {botLocaleStatus}")
    return botLocaleStatus

def localeIdExists(botId, botVersion, localeId):
    intentId = None
    try:
        response = clientLEXV2.describe_bot_locale(
            botId=botId,
            botVersion=botVersion,
            localeId=localeId
        )
        return True
    except:
        return False

def lexV2_qna_locale(botId, botVersion, localeId, voiceId, engine):
    if not localeIdExists(botId, botVersion, localeId):
        response = clientLEXV2.create_bot_locale(
            botId=botId,
            botVersion=botVersion,
            localeId=localeId,
            nluIntentConfidenceThreshold=0.40,
            voiceSettings={
                'voiceId': voiceId, 
                'engine': engine
            }
        )
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
        time.sleep(5)
        botStatus = get_bot_status(botId)
        if botStatus not in ["Available","Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {botStatus}")
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
        print(f"Creating bot {botName} with ID {botId}")
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
        time.sleep(5)
        botStatus = get_bot_version_status(botId, botVersion)
        if botStatus not in ["Available","Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {botStatus}")
    return botStatus
    
def lexV2_qna_version(botId, botDraftVersion, botLocaleIds):
    botVersion = None
    print(f"Creating bot version from {botDraftVersion}")
    botVersionLocaleSpecification = {}
    for botLocaleId in botLocaleIds:
        botVersionLocaleSpecification[botLocaleId] = {
            'sourceBotVersion': botDraftVersion
        }
    response = clientLEXV2.create_bot_version(
        botId=botId,
        botVersionLocaleSpecification=botVersionLocaleSpecification
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
        time.sleep(5)
        botAliasStatus = get_bot_alias_status(botId, botAliasId)
        if botAliasStatus not in ["Available","Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {botAliasStatus}")
    return botAliasStatus

def lexV2_qna_alias(botId, botVersion, botAliasName, botLocaleIds, botFullfillmentLambdaArn):
    botAliasLocaleSettings = {}
    for botLocaleId in botLocaleIds:
        botAliasLocaleSettings[botLocaleId] = {
                'enabled': True,
                'codeHookSpecification': {
                    'lambdaCodeHook': {
                        'lambdaARN': botFullfillmentLambdaArn,
                        'codeHookInterfaceVersion': '1.0'
                    }
                }
            }
    botAliasId = get_bot_aliasId(botId, botAliasName)
    aliasParams = {
        'botAliasName':botAliasName,
        'botVersion':botVersion,
        'botAliasLocaleSettings': botAliasLocaleSettings,
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

def build_lexV2_qna_bot_locale(botId, botVersion, localeId):
    print(f"Building bot: {botId}, {botVersion}, {localeId}")
    response = clientLEXV2.build_bot_locale(
        botId=botId,
        botVersion=botVersion,
        localeId=localeId
    )
    
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

def batches(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def get_bot_info():
    botId = get_botId(BOT_NAME)
    bot_aliasId = get_bot_aliasId(botId, BOT_ALIAS)
    result = {
        "botName": BOT_NAME,
        "botId": get_botId(BOT_NAME),
        "botAlias": BOT_ALIAS,
        "botAliasId": bot_aliasId,
        "botIntent": QNA_INTENT,
        "botIntentFallback": "FallbackIntent",
        "botLocaleIds": ",".join(LEXV2_BOT_LOCALE_IDS)
    }
    return result 

def build_all(intents):
    status("Rebuilding bot")
    botId = lexV2_qna_bot(BOT_NAME)
    # create or update bot for each locale
    # process locales in batches to staty with service limit bot-locale-builds-per-account (default 5)
    botlocaleIdBatches = list(batches(LEXV2_BOT_LOCALE_IDS,5))
    for botlocaleIdBatch in botlocaleIdBatches:
        print("Batch: " + str(botlocaleIdBatch))
        for botLocaleId in botlocaleIdBatch:
            status("Updating bot locale: " + botLocaleId)
            lexV2_qna_locale(botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId, voiceId=LEXV2_BOT_LOCALE_VOICES[botLocaleId][0]["voiceId"], engine=LEXV2_BOT_LOCALE_VOICES[botLocaleId][0]["engine"])
            lexV2_fallback_intent(botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId)
            lexV2_genesys_intent(botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId)
            for qid in intents:
                utterances = intents[qid]["utterances"]
                if qid == QNA_INTENT:
                    # Standard QnABot slot type and intent
                    lexV2_qna_slotTypeValues(QNA_SLOT_TYPE, botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId, utterances)
                    lexV2_qna_intent(QNA_INTENT, QNA_SLOT_TYPE, botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId)
                else:
                    # Custom intent - one intent per Qid
                    slots = intents[qid]["slots"] if "slots" in intents[qid] else []
                    lexV2_qid_intent(qid, utterances, slots, botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId)
            # Delete QID mapped intents that are not in the current list
            lexV2_qid_delete_intents(intents, botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId)
        status("Rebuilding bot locales: " + str(LEXV2_BOT_LOCALE_IDS))
        for botLocaleId in botlocaleIdBatch:
            build_lexV2_qna_bot_locale(botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId)
        # wait for all locales to build
        for botLocaleId in botlocaleIdBatch:
            wait_for_lexV2_qna_locale(botId, LEXV2_BOT_DRAFT_VERSION, botLocaleId)
    # create new bot version and update alias
    status("Building new bot version")
    botVersion = lexV2_qna_version(botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_IDS)
    lexV2_qna_alias(botId, LEXV2_BOT_DRAFT_VERSION, LEXV2_TEST_BOT_ALIAS, LEXV2_BOT_LOCALE_IDS, FULFILLMENT_LAMBDA_ARN)
    botAliasId = lexV2_qna_alias(botId, botVersion, BOT_ALIAS, LEXV2_BOT_LOCALE_IDS, FULFILLMENT_LAMBDA_ARN)
    # keep only the most recent bot versions
    status("Deleting old bot version(s)")
    lexV2_qna_delete_old_versions(botId)
    # return bot ids
    result = get_bot_info()
    status("READY")
    return result   

def delete_all():
    botId = get_botId(BOT_NAME)
    response = None
    if botId:
        response = clientLEXV2.delete_bot(
            botId=botId,
            skipResourceInUseCheck=True
        )
    return response

def duplicate_utterances(items):
    qna_intent_utterances = {}
    qid_intent_utterances = {}
    dup_utterances = {}
    dups = None
    for item in items:
        for utterance in item["q"]:
            # get processed version of utterance with slot definitions replaced by lex slot references
            utterance = utterance.lower()
            if item["enableQidIntent"]:
                if utterance not in qid_intent_utterances:
                    qid_intent_utterances[utterance] = [item["qid"]]
                else:
                    qid_intent_utterances[utterance].append(item["qid"])
            else: 
                if utterance not in qna_intent_utterances:
                    qna_intent_utterances[utterance] = [item["qid"]]
                else:
                    qna_intent_utterances[utterance].append(item["qid"])           
    # We only care about duplicates in Lex mapped qids. Others are mapped to QNA_INTENT and deduplicated.
    for utterance in qid_intent_utterances:
        if utterance in qna_intent_utterances:
            qid_intent_utterances[utterance].append(qna_intent_utterances[utterance])
        if len(qid_intent_utterances[utterance]) > 1:
            dup_utterances[utterance] = qid_intent_utterances[utterance]
    if dup_utterances:
        dups = "Duplicate questions not allowed in QIDs exported to Lex"
        for dup_utterance in dup_utterances:
            dups += f", '{dup_utterance}' in QIDs {dup_utterances[dup_utterance]}"
    return dups
    
def validate_slots(intents):
    bad_slots = {}
    msg = None
    for qid in intents:
        slot_dict = {}
        if "slots" in intents[qid]:
            for slot in intents[qid]["slots"]:
                slotname = slot["slotName"]
                slot_dict[slotname] = True
            print(f"{slot_dict}")
            print(f"{intents[qid]}")
            for utterance in intents[qid]["utterances"]:
                slotnames = re.findall(r'{(.*?)}',utterance)
                for slot in slotnames:
                    if slot not in slot_dict: 
                        bad_slots[qid] = bad_slots.get(qid,[]) + [slot]
    if bad_slots:
        msg = "Undefined slot reference in QID"
        for qid in bad_slots:
            msg += f", '{qid}' {bad_slots[qid]}"
    return msg

def process_intents(items):
    # initialise intents dict
    intents = {
        QNA_INTENT: {
            "utterances":set()
        }
    }
    # build intents with set of unique utterances per intent
    for item in items:
        if item["enableQidIntent"]:
            # QID gets its own Lex intent
            intents[item["qid"]] = {"utterances":set(item["q"])}
            if "slots" in item:
                intents[item["qid"]]["slots"] = item["slots"]
        else:
            # Add QID utterances to default QnABot intent
            intents[QNA_INTENT]["utterances"].update(item["q"])
    # Need at least 1 utterance for default QNA_INTENT
    if len(intents[QNA_INTENT]["utterances"]) < 1:
        print(f"Intent {QNA_INTENT} has no utterances.. inserting dummy utterance")
        intents[QNA_INTENT]["utterances"] = set(["dummy utterance"])
    # validate slots (if any) for each intent
    dups = duplicate_utterances(items)
    if dups:
        raise ValueError(dups)
    bad_slots = validate_slots(intents)
    if bad_slots:
        raise ValueError(bad_slots)
    return intents

# cfnHelper functions
@helper.create
def create_bot(event, _):
    utterances = event["ResourceProperties"]["utterances"]
    # map all default utterances to standard Qna intent
    intents = {QNA_INTENT: {"utterances":utterances}}
    result = build_all(intents)
    helper.Data.update(result)       

@helper.update
def update_bot(event, _):
    print("Cloudformation update - make no changes to existing bot")
    result = get_bot_info()
    helper.Data.update(result) 

@helper.delete
def delete_bot(event, _):
    delete_all()

# handler determines in function if called from CFN, allowing fn to be used
# as either a Cfn custom resource or not. 
def handler(event, context):
    global statusFile
    if 'ResourceProperties' in event:
        print("Function called from CloudFormation: " + json.dumps(event))
        helper(event, context)
    else:
        print("Function not called from CloudFormation: " + json.dumps(event))
        try:
            statusFile = event["statusFile"]
            items = event["items"]
            intents = process_intents(items)
            result = build_all(intents)
            print("LexV2 bot info: " + json.dumps(result))
        except Exception as e:
            result = "FAILED: " + str(e)
            status(result)
            raise

# for testing on terminal
if __name__ == "__main__":
    items = [
        {"qid":QNA_INTENT,  "enableQidIntent": True, "q":["what is the capital city of France?", "How great is Q and A bot?"]},
        {"qid":"1.CustomIntent.test",  "enableQidIntent": True, "q":["What is your address?", "What is your phone number?"]},
        {"qid":"2.CustomIntent.test",  "enableQidIntent": True, "q":["What is your name?", "What are you called?"]},
        {"qid":"3.CustomIntent.test", "enableQidIntent": True, "q":["What are your opening hours?", "How do I contact you?"]},
        {"qid":"4.CustomIntent.test", "enableQidIntent": True, "q":["My name is {firstname}"], "slots":[{"slotRequired": True,"slotName": "firstname","slotType": "AMAZON.FirstName", "slotPrompt": "What is your first name?"}]},
        #{"qid":"5.CustomIntent.test", "enableQidIntent": True, "q":["My name is <<name|AMAZON.FirstName|prompt>> <<lastname|AMAZON.LastName|prompt>>"]},
    ]
    event = {
        "statusFile":None,
        "items": items
    }
    result = handler(event,{})
    #result = delete_all()
    print(result)