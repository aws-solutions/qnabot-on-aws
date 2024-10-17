######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

# Creates or updates a Lex V2 QnABot bot
# Automatically generates locales as specified by environment var LOCALES - from Cfn parameter.

from configparser import DuplicateSectionError
import os
import os.path
import json
import time
import sys
import re
from botocore.config import Config

sdk_config = Config(user_agent_extra = f"AWSSOLUTION/{os.environ['SOLUTION_ID']}/{os.environ['SOLUTION_VERSION']} AWSSOLUTION-CAPABILITY/{os.environ['SOLUTION_ID']}-C002/{os.environ['SOLUTION_VERSION']}")

#for boto3 path from py_modules
root = os.environ["LAMBDA_TASK_ROOT"] + "/py_modules"
sys.path.insert(0, root)
import boto3
from crhelper import CfnResource

helper = CfnResource()
clientLEXV2 = boto3.client('lexv2-models', config=sdk_config)
clientIAM = boto3.client('iam', config=sdk_config)
clientTRANSLATE = boto3.client('translate', config=sdk_config)
s3 = boto3.resource('s3', config=sdk_config)

# LEX QNABOT INFO
FULFILLMENT_LAMBDA_ARN = os.environ["FULFILLMENT_LAMBDA_ARN"]
STACKNAME = os.environ["STACKNAME"]
LEXV2_BOT_LOCALE_IDS = os.environ["LOCALES"].replace(' ','').split(",")
# ensure en_US is always in the list, and that list elements are unique
LEXV2_BOT_LOCALE_IDS.append("en_US")
LEXV2_BOT_LOCALE_IDS = list(dict.fromkeys(LEXV2_BOT_LOCALE_IDS))

INTENT_CONFIDENCE_THRESHOLD = 0.8
BOT_NAME = STACKNAME + "_QnaBot"
QNA_INTENT = "QnaIntent"
QID_INTENT_PREFIX = "QID-INTENT-"
QID_SLOTTYPE_PREFIX = "QID-SLOTTYPE-"
QNA_SLOT_TYPE = "QnaSlotType"
BOT_ALIAS = "live"
LEXV2_BOT_DRAFT_VERSION = "DRAFT"
LEXV2_TEST_BOT_ALIAS = "TestBotAlias"
LEXV2_BOT_LOCALE_VOICES = {
    "ar_AE": [{ #Arabic (AE)
        "voiceId": "Zeina",
        "engine": "standard"
    }],
    "de_AT": [{ #German (AT)
        "voiceId": "Hannah",
        "engine": "neural"
    }],
    "de_DE": [{ #German (DE)
        "voiceId": "Vicki",
        "engine": "neural"
    }],
    "en_AU": [{ #English (AU)
        "voiceId": "Olivia",
        "engine": "neural"
    }],
    "en_GB": [{ #English (GB)
        "voiceId": "Amy",
        "engine": "neural"
    }],
    "en_IN": [{ #English (IN)
        "voiceId": "Kajal",
        "engine": "neural"
    }],
    "en_US": [{ #English (US)
        "voiceId": "Joanna",
        "engine": "neural"
    }],
    "en_ZA": [{ #English (ZA)
        "voiceId": "Ayanda",
        "engine": "neural"
    }],
    "es_419": [{ #Spanish (LATAM)
        "voiceId": "Mia",
        "engine": "neural"
    }],
    "es_ES": [{ #Spanish (ES)
        "voiceId": "Lucia",
        "engine": "neural"
    }],
    "es_US": [{ #Spanish (US)
        "voiceId": "Lupe",
        "engine": "neural"
    }],
    "fi_FI": [{ #Finnish (FI)
        "voiceId": "Suvi",
        "engine": "neural"
    }],
    "fr_CA": [{ #French (CA)
        "voiceId": "Gabrielle",
        "engine": "neural"
    }],
    "fr_FR": [{ #French (FR)
        "voiceId": "Lea",
        "engine": "neural"
    }],
    "hi_IN": [{ #Hindi (IN)
        "voiceId": "Kajal",
        "engine": "neural"
    }],
    "it_IT": [{ #Italian (IT)
        "voiceId": "Bianca",
        "engine": "neural"
    }],
    "ja_JP": [{ #Japan (JP)
        "voiceId": "Takumi",
        "engine": "neural"
    }],
    "ko_KR": [{ #Korean (KR)
        "voiceId": "Seoyeon",
        "engine": "neural"
    }],
    "nl_NL": [{ #Dutch (NL)
        "voiceId": "Laura",
        "engine": "neural"
    }],
    "no_NO": [{ #Norwegian (NO)
        "voiceId": "Ida",
        "engine": "neural"
    }],
    "pl_PL": [{ #Polish (PL)
        "voiceId": "Ola",
        "engine": "neural"
    }],
    "pt_BR": [{ #Portuguese (BR)
        "voiceId": "Camila",
        "engine": "neural"
    }],
    "pt_PT": [{ #Portuguese (PT)
        "voiceId": "Ines",
        "engine": "neural"
    }],
    "sv_SE": [{ #Swedish (SE)
        "voiceId": "Elin",
        "engine": "neural"
    }],
    "zh_HK": [{ #Cantonese (HK)
        "voiceId": "Hiujin",
        "engine": "neural"
    }],
    "zh_CN": [{ #Mandarin (PRC)
        "voiceId": "Zhiyu",
        "engine": "neural"
    }]
}

# if statusFile defined in lambda event, then log build status to specified S3 object
# used by getBot API for bot status checks in Designer
statusFile={}
def status(status):
    if statusFile:
        obj = s3.Object(statusFile["Bucket"], statusFile["Key"])
        result=json.loads(obj.get()["Body"].read())
        result["status"] = status
        obj.put(Body=json.dumps(result))
    print("Status: " + status)

def get_qna_v2_slot_type_values(locale_id, utterances):
    slot_type_values = []
    utterances = translate_list(locale_id, utterances)
    for utterance in utterances:
        slot_type_value = {
            'sampleValue': {
                'value': utterance
            }
        }
        slot_type_values.append(slot_type_value)
    return slot_type_values

def get_qid_v2_slot_type_values(locale_id, slot_type_def):
    resolution_strategy_restrict = slot_type_def.get('resolutionStrategyRestrict',False)
    if not resolution_strategy_restrict:
        print("Restrict slot resolution is False - translate slotType sample values")
    else:
        print("Restrict slot resolution is True - append translated slotType synonyms, do not translate slotType values")
    v2_slot_type_values = []
    for slot_type_value in slot_type_def["slotTypeValues"]:
        v2_slot_type_value = {}
        sample_value = slot_type_value['samplevalue']
        if not resolution_strategy_restrict:
            sample_value = translate_text(locale_id, sample_value)
            v2_slot_type_value = {
                'sampleValue': { 'value': sample_value }
            }
        else:
            synonyms_str = slot_type_value.get('synonyms',"")
            synonym_values = synonyms_str.split(",") if synonyms_str else []
            # append translated synonyms to original and de-dup
            synonym_values = list(set(synonym_values + translate_list(locale_id, synonym_values)))
            if synonym_values == []:
                v2_slot_type_value = {
                    'sampleValue': { 'value': sample_value }
                }
            else:
                v2_slot_type_value = {
                    'sampleValue': { 'value': sample_value },
                    'synonyms' : [ {'value': value} for value in synonym_values]
                }
        v2_slot_type_values.append(v2_slot_type_value)
    return v2_slot_type_values

def get_slot_type_id_v2(slot_type_name, bot_id, bot_version, locale_id):
    slot_type_id = None
    response = clientLEXV2.list_slot_types(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id,
        filters=[
            {
                'name': 'SlotTypeName',
                'values': [
                    slot_type_name,
                ],
                'operator': 'EQ'
            },
        ],
        maxResults=1000
    )
    if len(response["slotTypeSummaries"]) == 1:
        slot_type_id = response["slotTypeSummaries"][0]["slotTypeId"]
    elif len(response["slotTypeSummaries"]) > 1:
        raise Exception(f"Multiple matching slotTypes for slotTypeName: {slot_type_name}")  # NOSONAR The exception message is specific enough for user to debug
    return slot_type_id

def get_slot_id(slot_name, intent_id, bot_id, bot_version, locale_id):
    slot_id = None
    response = clientLEXV2.list_slots(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id,
        intentId=intent_id,
        filters=[
            {
                'name': 'SlotName',
                'values': [
                    slot_name,
                ],
                'operator': 'EQ'
            },
        ],
        maxResults=1000
    )
    if len(response["slotSummaries"]) == 1:
        slot_id = response["slotSummaries"][0]["slotId"]
    elif len(response["slotSummaries"]) > 1:
        raise Exception(f"Multiple matching slots for slotName: {slot_name}")  # NOSONAR The exception message is specific enough for user to debug
    return slot_id

def get_slot_ids(intent_id, bot_id, bot_version, locale_id):
    response = clientLEXV2.list_slots(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id,
        intentId=intent_id,
        maxResults=1000
    )
    slot_ids = [slotSummary["slotId"] for slotSummary in response["slotSummaries"] ]
    return slot_ids

def delete_slots_for_intent(intent_id, bot_id, bot_version, locale_id):
    slot_ids = get_slot_ids(intent_id, bot_id, bot_version, locale_id)
    if slot_ids:
        print(f"Deleting slots {slot_ids} for intent '{intent_id}'")
        for slot_id in slot_ids:
            clientLEXV2.delete_slot(
                slotId=slot_id,
                botId=bot_id,
                botVersion=bot_version,
                localeId=locale_id,
                intentId=intent_id
            )
    else:
        print(f"intent '{intent_id}' has no slots")

def get_bot_id(bot_name):
    bot_id = None
    response = clientLEXV2.list_bots(
        filters=[
            {
                'name': 'BotName',
                'values': [
                    bot_name,
                ],
                'operator': 'EQ'
            }
        ],
        maxResults=1000
    )
    if len(response["botSummaries"]) == 1:
        bot_id = response["botSummaries"][0]["botId"]
    elif len(response["botSummaries"]) > 1:
        raise Exception(f"Multiple matching bots for botName: {bot_name}")  # NOSONAR The exception message is specific enough for user to debug
    return bot_id


def get_intent_id(intent_name, bot_id, bot_version, locale_id):
    intent_id = None
    response = clientLEXV2.list_intents(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id,
        filters=[
            {
                'name': 'IntentName',
                'values': [
                    intent_name,
                ],
                'operator': 'EQ'
            },
        ],
        maxResults=1000
    )
    if len(response["intentSummaries"]) == 1:
        intent_id = response["intentSummaries"][0]["intentId"]
    elif len(response["intentSummaries"]) > 1:
        raise Exception(f"Multiple matching intents for intentName: {intent_name}")  # NOSONAR The exception message is specific enough for user to debug
    return intent_id

def add_spantag_to_slots(utterance):
    slots = re.findall(r'({.*?})',utterance)  # NOSONAR require the specific pattern of regex
    for slot in slots:
        utterance = utterance.replace(slot, f'<span translate="no">{slot}</span>')
    return utterance

def remove_spantag_from_slots(utterance):
    slots = re.findall(r'<span translate="no">({.*?})</span>',utterance)  # NOSONAR require the specific pattern of regex
    for slot in slots:
        utterance = utterance.replace(f'<span translate="no">{slot}</span>', f" {slot} ")
    return utterance

def translate_text(locale_id, text):
    lang_code = locale_id.split("_")[0]
    if len(text) > 1:
        try:
            # don't translate slot names
            text2 = add_spantag_to_slots(text)
            response = clientTRANSLATE.translate_text(
                Text=text2,
                SourceLanguageCode='auto',
                TargetLanguageCode=lang_code
            )
            translated_text = response["TranslatedText"]
            translated_text = remove_spantag_from_slots(translated_text)
        except Exception as e:
            print(f"Auto translation failed for '{text}' - using original. Exception: {e}")
            translated_text = text
    else:
        print(f"Utterance {text} too short to translate - using original.")
        translated_text = text
    print(f"Translated utterance: {text} -> {translated_text}")
    return translated_text

def translate_list(locale_id, utterances):
    translated_utterances = []
    for utterance in utterances:
        translated_utterance = translate_text(locale_id, utterance)
        translated_utterances.append(translated_utterance)
    # deduplicate
    translated_utterances = list(dict.fromkeys(translated_utterances))
    # remove any empty or whitespace only strings
    translated_utterances = [u for u in translated_utterances if u.strip()]
    return translated_utterances


def lex_v2_qna_slot_type(slot_type_name, bot_id, bot_version, locale_id, utterances):
    print(f"SlotType {slot_type_name}")
    slot_type_values = get_qna_v2_slot_type_values(locale_id, utterances)
    slot_type_id = get_slot_type_id_v2(slot_type_name, bot_id, bot_version, locale_id)
    slot_type_params = {
        "slotTypeName": slot_type_name,
        "slotTypeValues": slot_type_values,
        "valueSelectionSetting": {
            'resolutionStrategy': 'OriginalValue'
        },
        "botId": bot_id,
        "botVersion": bot_version,
        "localeId": locale_id
    }
    if slot_type_id:
        print(f"Updating SlotType {slot_type_name}")
        clientLEXV2.update_slot_type(slotTypeId=slot_type_id, **slot_type_params)
    else:
        print(f"Creating SlotType {slot_type_name}")
        clientLEXV2.create_slot_type(**slot_type_params)

def qid_2_slot_type(qid):
    return QID_SLOTTYPE_PREFIX + qid.replace(".", "_dot_")

def slot_type_2_qid(slot_type):
    return slot_type.replace(QID_SLOTTYPE_PREFIX,"").replace("_dot_",".")

def lex_v2_qid_slot_type(qid, bot_id, bot_version, locale_id, slot_type_def):
    slot_type_name = qid_2_slot_type(qid)
    print(f"SlotType '{slot_type_name}' from QID '{qid}'")
    slot_type_values=get_qid_v2_slot_type_values(locale_id, slot_type_def)
    slot_type_id = get_slot_type_id_v2(slot_type_name, bot_id, bot_version, locale_id)
    resolution_strategy_restrict = slot_type_def.get("resolutionStrategyRestrict", False)
    resolution_strategy = 'TopResolution' if resolution_strategy_restrict else 'OriginalValue'
    slot_type_params = {
        "slotTypeName": slot_type_name,
        "description": slot_type_def.get("descr",slot_type_name),
        "slotTypeValues": slot_type_values,
        "valueSelectionSetting": {
            'resolutionStrategy': resolution_strategy
        },
        "botId": bot_id,
        "botVersion": bot_version,
        "localeId": locale_id
    }
    if slot_type_id:
        print(f"Updating SlotType {slot_type_name}")
        clientLEXV2.update_slot_type(slotTypeId=slot_type_id, **slot_type_params)
    else:
        print(f"Creating SlotType {slot_type_name}")
        clientLEXV2.create_slot_type(**slot_type_params)

def get_qid_slot_types_to_delete(slot_types, bot_id, bot_version, locale_id):
    response = clientLEXV2.list_slot_types(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id,
        filters=[
            {
                'name': 'SlotTypeName',
                'values': [
                    QID_SLOTTYPE_PREFIX,
                ],
                'operator': 'CO'
            },
        ],
        maxResults=1000
    )
    slot_types_to_delete = []
    for slot_type_summary in response["slotTypeSummaries"]:
        slot_type_name = slot_type_summary["slotTypeName"]
        slot_type_id = slot_type_summary["slotTypeId"]
        qid = slot_type_2_qid(slot_type_name)
        if qid not in slot_types:
            print(f"QID Slot type '{slot_type_name} : {slot_type_id}' (QID '{qid}') has no corresponding slotType QIDS, and will be deleted.")
            slot_types_to_delete.append(slot_type_id)
    return slot_types_to_delete

def lex_v2_qid_delete_slot_types(slot_types, bot_id, bot_version, bot_locale_id):
    slot_types_to_delete = get_qid_slot_types_to_delete(slot_types, bot_id, bot_version, bot_locale_id)
    for slot_type in slot_types_to_delete:
        clientLEXV2.delete_slot_type(
            slotTypeId=slot_type,
            botId=bot_id,
            botVersion=bot_version,
            localeId=bot_locale_id
        )
        print(f'Deleted slot type - Id: {slot_type}')


def lex_v2_intent_slot(slot_name, intent_id, slot_type_id, slot_sample_utterances, bot_id, bot_version, locale_id, slot_required=None, slot_elicitation_prompt=None):
    # if a slotRequired is provided, assume slot is required
    slot_constraint = "Required" if slot_required else "Optional"
    slot_elicitation_prompt = slot_elicitation_prompt or "What is the question?"
    value_elicitation_setting = {
        "promptSpecification": {
            "messageGroups": [
                {
                    "message": {
                        "plainTextMessage": {
                            "value": slot_elicitation_prompt
                        }
                    }
                }
            ],
            "maxRetries": 4
        },
        "slotConstraint": slot_constraint
    }
    if slot_sample_utterances:
        sample_utterances = slot_sample_utterances.split(",")
        value_elicitation_setting["sampleUtterances"] = [ {"utterance": utterance} for utterance in sample_utterances]
    slot_params = {
        "slotName": slot_name,
        "slotTypeId": slot_type_id,
        "valueElicitationSetting": value_elicitation_setting,
        "botId": bot_id,
        "botVersion": bot_version,
        "localeId": locale_id,
        "intentId": intent_id
    }
    slot_id = get_slot_id(slot_name, intent_id, bot_id, bot_version, locale_id)
    if slot_id:
        print(f"Updating slot: {slot_name}, slotId {slot_id}, type {slot_type_id} for intent {intent_id}")
        clientLEXV2.update_slot(slotId=slot_id, **slot_params)
        print(f'Updated slot - Id: {slot_id}')
    else:
        print(f"Creating slot: {slot_name}, type {slot_type_id} for intent {intent_id}")
        response = clientLEXV2.create_slot(**slot_params)
        slot_id = response["slotId"];
        print(f'Created slot - Id: {slot_id}')
    return slot_id


def lex_v2_qna_intent(intent_name, slot_type_name, bot_id, bot_version, locale_id):
    slot_name="qnaslot"
    sample_utterances = [{f"utterance": f"{{{slot_name}}}"}]
    intent_params = {
            "intentName": intent_name,
            "description": f"({locale_id}) Default QnABot intent.",
            "sampleUtterances":sample_utterances,
            "fulfillmentCodeHook": {'enabled': True},
            "botId": bot_id,
            "botVersion": bot_version,
            "localeId": locale_id
    }
    intent_id = get_intent_id(intent_name, bot_id, bot_version, locale_id)
    slot_type_id = get_slot_type_id_v2(slot_type_name, bot_id, bot_version, locale_id)
    slot_sample_utterances = None
    if intent_id:
        print(f"Updating intent: {intent_name}, intentId {intent_id}")
        clientLEXV2.update_intent(intentId=intent_id, **intent_params)
        print(f'Updated intent - Id: {intent_id}')
    else:
        print(f"Creating intent: {intent_name}")
        response = clientLEXV2.create_intent(**intent_params)
        intent_id = response["intentId"];
        print(f'Created intent - Id: {intent_id}')
    slot_id = lex_v2_intent_slot(slot_name, intent_id, slot_type_id, slot_sample_utterances, bot_id, bot_version, locale_id)
    print(f'Updating intent to add slot priority - intentId: {intent_id}, slotId {slot_id}')
    response = clientLEXV2.update_intent(
        **intent_params,
        intentId=intent_id,
        slotPriorities=[
            {
                'priority': 1,
                'slotId': slot_id
            }
        ]
        )
    intent_id = response["intentId"];
    print(f'Updated intent to add slot priority - intentId: {intent_id}, slotId {slot_id}')

def qid_2_intent_name(qid):
    return QID_INTENT_PREFIX + qid.replace(".", "_dot_")

def intent_name_2_qid(intentname):
    return intentname.replace(QID_INTENT_PREFIX,"").replace("_dot_",".")

def lex_v2_qid_intent(qid, utterances, slots, slot_types, bot_id, bot_version, locale_id):
    # make intentName from qid - replace . characters (not allowed in intent name)
    intent_name = qid_2_intent_name(qid)
    print(f"Creating intent: {intent_name} for Qid: {qid}")
    utterances  = translate_list(locale_id, utterances)
    sample_utterances = [{"utterance": q} for q in utterances]
    intent_params = {
            "intentName": intent_name,
            "description": f"({locale_id}) Intent for QnABot QID: '{qid}'",
            "sampleUtterances":sample_utterances,
            "dialogCodeHook": {'enabled': True},
            "fulfillmentCodeHook": {'enabled': True},
            "botId": bot_id,
            "botVersion": bot_version,
            "localeId": locale_id
    }
    intent_id = get_intent_id(intent_name, bot_id, bot_version, locale_id)
    if intent_id:
        print(f"Updating intent: {intent_name}, intentId {intent_id}")
        response = clientLEXV2.update_intent(intentId=intent_id, **intent_params)
        print(f'Updated intent - Id: {intent_id}')
    else:
        print(f"Creating intent: {intent_name}")
        response = clientLEXV2.create_intent(**intent_params)
        intent_id = response["intentId"];
        print(f'Created intent - Id: {intent_id}')
    intent_id = response["intentId"];
    slot_priorities = []
    # delete any/all exiting slots
    delete_slots_for_intent(intent_id,bot_id,bot_version,locale_id)
    # create new slots
    for slot in slots:
        slot_name = slot["slotName"]
        slot_type = slot["slotType"]

        #get slot_required value if exists, otherwise return None
        slot_required = slot.get("slotRequired", None)

        slot_sample_utterances = slot.get("slotSampleUtterances")

        slot_type_id = get_slot_type_id_built_in(qid, slot_types, bot_id, bot_version, locale_id, slot_type)

        prompt = translate_text(locale_id, slot["slotPrompt"])
        slot_id = lex_v2_intent_slot(slot_name, intent_id, slot_type_id, slot_sample_utterances, bot_id, bot_version, locale_id, slot_required=slot_required, slot_elicitation_prompt=prompt)
        slot_priorities.append({
            'priority': len(slot_priorities) + 1,
            'slotId': slot_id
        })
    print(f'Updating intent to add slot priorities - intentId: {intent_id}')
    response = clientLEXV2.update_intent(
        **intent_params,
        intentId=intent_id,
        slotPriorities=slot_priorities
        )
    intent_id = response["intentId"];
    print(f'Updated intent to add slot priorities - intentId: {intent_id}')

def get_slot_type_id_built_in(qid, slot_types, bot_id, bot_version, locale_id, slot_type):
    slot_type_id = None
    if "AMAZON." in slot_type:
            # Built-in type
        slot_type_id = slot_type
    elif slot_type in slot_types:
            # Custom type defined in QnABot Content Designer - look up slotTypeId from qid mapped name.
        slot_type_id = get_slot_type_id_v2(qid_2_slot_type(slot_type), bot_id, bot_version, locale_id)
    else:
            # Custom type not defined in QnABot Content Designer - look up slotTypeId from provided name
        slot_type_id = get_slot_type_id_v2(slot_type, bot_id, bot_version, locale_id)
    if not slot_type_id:
        raise ValueError(f"ERROR: Slot type '{slot_type}' used in Qid '{qid}' is not a built-in or existing custom slot type (locale={locale_id})")
    return slot_type_id


def get_qid_intents_to_delete(intents, bot_id, bot_version, locale_id):
    response = clientLEXV2.list_intents(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id,
        filters=[
            {
                'name': 'IntentName',
                'values': [
                    QID_INTENT_PREFIX,
                ],
                'operator': 'CO'
            },
        ],
        maxResults=1000
    )
    intents_to_delete = []
    for intent_summary in response["intentSummaries"]:
        intentname = intent_summary["intentName"]
        intentid = intent_summary["intentId"]
        qid = intent_name_2_qid(intentname)
        if qid not in intents:
            print(f"QID Intent '{intentname} : {intentid}' (QID '{qid}') has no corresponding lex enabled QIDs, and will be deleted.")
            intents_to_delete.append(intentid)
    return intents_to_delete

def lex_v2_qid_delete_intents(intents, bot_id, bot_version, bot_locale_id):
    intents_to_delete = get_qid_intents_to_delete(intents, bot_id, bot_version, bot_locale_id)
    for intent in intents_to_delete:
        clientLEXV2.delete_intent(
            intentId=intent,
            botId=bot_id,
            botVersion=bot_version,
            localeId=bot_locale_id
        )
        print(f'Deleted intent - Id: {intent}')

def lex_v2_genesys_intent(bot_id, bot_version, locale_id):
    intent_name = "GenesysInitialIntent"
    intent_params = {
        "intentName": intent_name,
        "description": f"({locale_id}) Intent used only by Genesys Cloud CX integration",
        "botId": bot_id,
        "botVersion": bot_version,
        "localeId": locale_id,
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
    intent_id = get_intent_id(intent_name, bot_id, bot_version, locale_id)
    if intent_id:
        print(f"Updating intent: {intent_name}, intentId {intent_id}")
        clientLEXV2.update_intent(intentId=intent_id, **intent_params)
        print(f'Updated intent - Id: {intent_id}')
    else:
        print(f"Creating intent: {intent_name}")
        response = clientLEXV2.create_intent(**intent_params)
        intent_id = response["intentId"];
        print(f'Created intent - Id: {intent_id}')

def lex_v2_fallback_intent(bot_id, bot_version, locale_id):
    intent_name = "FallbackIntent"
    intent_id = get_intent_id(intent_name, bot_id, bot_version, locale_id)
    intent_params = {
            "intentId": intent_id,
            "intentName": intent_name,
            "parentIntentSignature": "AMAZON.FallbackIntent",
            "fulfillmentCodeHook": {'enabled': True},
            "botId": bot_id,
            "botVersion": bot_version,
            "localeId": locale_id
    }
    print(f"Updating fallback intent {intent_id} to set Lambda for fulfilment.")
    clientLEXV2.update_intent(**intent_params)
    print(f'Updated fallback intent - Id: {intent_id}')


def get_bot_locale_status(bot_id, bot_version, locale_id):
    response = clientLEXV2.describe_bot_locale(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id
    )
    bot_locale_status = response["botLocaleStatus"]
    print(f"Bot locale status: {locale_id} => {bot_locale_status}")
    return bot_locale_status

def wait_for_lex_v2_qna_locale(bot_id, bot_version, locale_id):
    bot_locale_status = get_bot_locale_status(bot_id, bot_version, locale_id)
    while bot_locale_status not in ["NotBuilt","Built"]:
        time.sleep(5)
        bot_locale_status = get_bot_locale_status(bot_id, bot_version, locale_id)
        if bot_locale_status not in ["NotBuilt","Built","Creating","Building","ReadyExpressTesting"]:
            raise Exception(f"Invalid botLocaleStatus for locale '{locale_id}'): '{bot_locale_status}'. Check for build errors in LexV2 console for bot '{BOT_NAME}'")   # NOSONAR The exception message is specific enough for user to debug
    print(f"Bot localeId {locale_id}: {bot_locale_status}")
    return bot_locale_status

def locale_id_exists(bot_id, bot_version, locale_id):
    try:
        clientLEXV2.describe_bot_locale(
            botId=bot_id,
            botVersion=bot_version,
            localeId=locale_id
        )
        return True
    except:  # NOSONAR exceptions already handled and logged
        return False

def lex_v2_qna_locale(bot_id, bot_version, locale_id, voice_id, engine):
    if not locale_id_exists(bot_id, bot_version, locale_id):
        clientLEXV2.create_bot_locale(
            botId=bot_id,
            botVersion=bot_version,
            localeId=locale_id,
            nluIntentConfidenceThreshold=INTENT_CONFIDENCE_THRESHOLD,
            voiceSettings={
                'voiceId': voice_id,
                'engine': engine
            }
        )
        wait_for_lex_v2_qna_locale(bot_id, bot_version, locale_id)
    return locale_id


def get_or_create_lex_v2_service_linked_role(bot_name):
    # Does role already exist?
    role_name_prefix = "AWSServiceRoleForLexV2Bots"
    role_name_suffix = bot_name[0:(63-len(role_name_prefix))]  # max len 64
    role_name = f"{role_name_prefix}_{role_name_suffix}"
    print(role_name)
    try:
        response = clientIAM.get_role(
            RoleName=role_name
        )
        role_arn = response["Role"]["Arn"]
    except:  # NOSONAR exceptions already handled and logged
        response = clientIAM.create_service_linked_role(
            AWSServiceName='lexv2.amazonaws.com',
            Description=f'Service role for QnABot - {bot_name}',
            CustomSuffix=role_name_suffix
        )
        role_arn = response["Role"]["Arn"]
    return role_arn

def get_bot_status(bot_id):
    response = clientLEXV2.describe_bot(botId=bot_id)
    bot_status = response["botStatus"]
    print(f"Bot status: {bot_status}")
    return bot_status

def wait_for_lex_v2_qna_bot(bot_id):
    bot_status = get_bot_status(bot_id)
    while bot_status != 'Available':
        time.sleep(5)
        bot_status = get_bot_status(bot_id)
        if bot_status not in ["Available","Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {bot_status}")   # NOSONAR The exception message is specific enough for user to debug
    return bot_status

def lex_v2_qna_bot(bot_name):
    bot_id = get_bot_id(bot_name)
    if not bot_id:
        print(f"Creating bot {bot_name}")
        response = clientLEXV2.create_bot(
            botName=bot_name,
            description='QnABot Lex V2',
            roleArn=get_or_create_lex_v2_service_linked_role(bot_name),
            dataPrivacy={
                'childDirected': False
            },
            idleSessionTTLInSeconds=300
        )
        bot_id = response["botId"]
        print(f"Creating bot {bot_name} with ID {bot_id}")
    else:
        print(f"Bot {bot_name} exists with ID {bot_id}")
    wait_for_lex_v2_qna_bot(bot_id)
    return bot_id

def get_bot_version_status(bot_id, bot_version):
    response = clientLEXV2.describe_bot_version(
        botId=bot_id,
        botVersion=bot_version
    )
    bot_status = response["botStatus"]
    print(f"Bot status: {bot_status}")
    return bot_status

def wait_for_lex_v2_qna_version(bot_id, bot_version):
    bot_status = 'Unknown'
    # Wait for bot version to be available
    time.sleep(5)
    while bot_status != 'Available':
        time.sleep(5)
        try:
            bot_status = get_bot_version_status(bot_id, bot_version)
        except Exception as e:
            print(f'Error getting bot status: {e}')
            bot_status = 'Not Created'
        if bot_status not in ["Available","Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {bot_status}")   # NOSONAR The exception message is specific enough for user to debug
    return bot_status

def lex_v2_qna_version(bot_id, bot_draft_version, bot_locale_ids):
    bot_version = None
    print(f"Creating bot version from {bot_draft_version}")
    bot_version_locale_specification = {}
    for bot_locale_id in bot_locale_ids:
        bot_version_locale_specification[bot_locale_id] = {
            'sourceBotVersion': bot_draft_version
        }
    response = clientLEXV2.create_bot_version(
        botId=bot_id,
        botVersionLocaleSpecification=bot_version_locale_specification
    )
    bot_version = response["botVersion"]
    bot_status = response["botStatus"]
    print(f"Created bot version {bot_version} - {bot_status}")
    wait_for_lex_v2_qna_version(bot_id, bot_version)
    return bot_version

def get_bot_alias_id(bot_id, bot_alias_name):
    bot_alias_id = None
    response = clientLEXV2.list_bot_aliases(
        botId=bot_id,
        maxResults=1000
    )
    for alias in response["botAliasSummaries"]:
        if alias["botAliasName"] == bot_alias_name:
            bot_alias_id = alias["botAliasId"]
    return bot_alias_id

def get_bot_alias_status(bot_id, bot_alias_id):
    response = clientLEXV2.describe_bot_alias(
        botId=bot_id,
        botAliasId=bot_alias_id
    )
    bot_alias_status = response["botAliasStatus"]
    print(f"Bot alias status: {bot_alias_status}")
    return bot_alias_status

def wait_for_lex_v2_qna_alias(bot_id, bot_alias_id):
    bot_alias_status = get_bot_alias_status(bot_id, bot_alias_id)
    while bot_alias_status != 'Available':
        time.sleep(5)
        bot_alias_status = get_bot_alias_status(bot_id, bot_alias_id)
        if bot_alias_status not in ["Available","Creating","Versioning"]:
            raise Exception(f"Invalid botStatus: {bot_alias_status}")   # NOSONAR The exception message is specific enough for user to debug
    return bot_alias_status

def lex_v2_qna_alias(bot_id, bot_version, bot_alias_name, bot_locale_ids, bot_fulfillment_lambda_arn):
    bot_alias_locale_settings = {}
    for bot_locale_id in bot_locale_ids:
        bot_alias_locale_settings[bot_locale_id] = {
                'enabled': True,
                'codeHookSpecification': {
                    'lambdaCodeHook': {
                        'lambdaARN': bot_fulfillment_lambda_arn,
                        'codeHookInterfaceVersion': '1.0'
                    }
                }
            }
    bot_alias_id = get_bot_alias_id(bot_id, bot_alias_name)
    alias_params = {
        'botAliasName':bot_alias_name,
        'botVersion':bot_version,
        'botAliasLocaleSettings': bot_alias_locale_settings,
        'sentimentAnalysisSettings':{
            'detectSentiment': False
        },
        'botId':bot_id
    }
    if not bot_alias_id:
        print(f"Creating botAlias {bot_alias_name} for bot {bot_id} version {bot_version}")
        response = clientLEXV2.create_bot_alias(**alias_params)
        bot_alias_id = response["botAliasId"]
        print(f"Creates bot alias {bot_alias_name} with ID {bot_alias_id}")
    else:
        print(f"Updating botAlias {bot_alias_name} for bot {bot_id} version {bot_version}")
        response = clientLEXV2.update_bot_alias(**alias_params, botAliasId=bot_alias_id)
        bot_alias_id = response["botAliasId"]
        print(f"Updated bot alias {bot_alias_name} with ID {bot_alias_id}")
    wait_for_lex_v2_qna_alias(bot_id, bot_alias_id)
    return bot_alias_id

def build_lex_v2_qna_bot_locale(bot_id, bot_version, locale_id):
    print(f"Building bot: {bot_id}, {bot_version}, {locale_id}")
    clientLEXV2.build_bot_locale(
        botId=bot_id,
        botVersion=bot_version,
        localeId=locale_id
    )

def lex_v2_qna_delete_old_versions(bot_id):
    response = clientLEXV2.list_bot_versions(
        botId=bot_id,
        sortBy={
            'attribute': 'BotVersion',
            'order': 'Ascending'
        },
        maxResults=1000
    )
    bot_version_summaries = response["botVersionSummaries"]
    if len(bot_version_summaries) > 3:
        bot_version_summaries_to_delete = bot_version_summaries[:-3] # keep highest 2 versions
        for bot_version_summary in bot_version_summaries_to_delete:
            bot_version = bot_version_summary["botVersion"]
            print(f"Deleting BotVersion: {bot_version}")
            clientLEXV2.delete_bot_version(
                botId=bot_id,
                botVersion=bot_version,
                skipResourceInUseCheck=True
            )

def batches(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def get_bot_info():
    bot_id = get_bot_id(BOT_NAME)
    bot_alias_id = get_bot_alias_id(bot_id, BOT_ALIAS)
    result = {
        "botName": BOT_NAME,
        "botId": get_bot_id(BOT_NAME),
        "botAlias": BOT_ALIAS,
        "botAliasId": bot_alias_id,
        "botIntent": QNA_INTENT,
        "botIntentFallback": "FallbackIntent",
        "botLocaleIds": ",".join(LEXV2_BOT_LOCALE_IDS)
    }
    return result

def build_all(intents, slot_types={}):
    status("Rebuilding bot")
    bot_id = lex_v2_qna_bot(BOT_NAME)
    # create or update bot for each locale
    # process locales in batches to staty with service limit bot-locale-builds-per-account (default 5)
    bot_locale_id_batches = list(batches(LEXV2_BOT_LOCALE_IDS,5))
    for bot_locale_id_batch in bot_locale_id_batches:
        print("Batch: " + str(bot_locale_id_batch))
        for bot_locale_id in bot_locale_id_batch:
            update_bot_locale(intents, slot_types, bot_id, bot_locale_id)

        #delete slot_types (QID mapped slot types that are not in the current list) after all referenced intents have been deleted.
        for bot_locale_id in bot_locale_id_batch:
            # Delete QID mapped slot types that are not in the current list
            lex_v2_qid_delete_slot_types(slot_types, bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)

        status("Rebuilding bot locales: " + str(LEXV2_BOT_LOCALE_IDS))
        for bot_locale_id in bot_locale_id_batch:
            build_lex_v2_qna_bot_locale(bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)
        # wait for all locales to build
        for bot_locale_id in bot_locale_id_batch:
            wait_for_lex_v2_qna_locale(bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)
    # create new bot version and update alias
    status("Building new bot version")
    bot_version = lex_v2_qna_version(bot_id, LEXV2_BOT_DRAFT_VERSION, LEXV2_BOT_LOCALE_IDS)
    lex_v2_qna_alias(bot_id, LEXV2_BOT_DRAFT_VERSION, LEXV2_TEST_BOT_ALIAS, LEXV2_BOT_LOCALE_IDS, FULFILLMENT_LAMBDA_ARN)
    lex_v2_qna_alias(bot_id, bot_version, BOT_ALIAS, LEXV2_BOT_LOCALE_IDS, FULFILLMENT_LAMBDA_ARN)
    # keep only the most recent bot versions
    status("Deleting old bot version(s)")
    lex_v2_qna_delete_old_versions(bot_id)
    # return bot ids
    result = get_bot_info()
    status("READY")
    return result

def update_bot_locale(intents, slot_types, bot_id, bot_locale_id):
    status("Updating bot locale: " + bot_locale_id)
    lex_v2_qna_locale(bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id, voice_id=LEXV2_BOT_LOCALE_VOICES[bot_locale_id][0]["voiceId"], engine=LEXV2_BOT_LOCALE_VOICES[bot_locale_id][0]["engine"])
    lex_v2_fallback_intent(bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)
    lex_v2_genesys_intent(bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)
    for qid in slot_types:
        lex_v2_qid_slot_type(qid, bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id, slot_type_def=slot_types[qid])
    for qid in intents:
        utterances = intents[qid]["utterances"]
        if qid == QNA_INTENT:
                    # Standard QnABot slot type and intent
            lex_v2_qna_slot_type(QNA_SLOT_TYPE, bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id, utterances=utterances)
            lex_v2_qna_intent(QNA_INTENT, QNA_SLOT_TYPE, bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)
        else:
                    # Custom intent - one intent per Qid
            slots = intents[qid]["slots"] if "slots" in intents[qid] else []
            lex_v2_qid_intent(qid, utterances, slots, slot_types, bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)
            # Delete QID mapped intents that are not in the current list
    lex_v2_qid_delete_intents(intents, bot_id, LEXV2_BOT_DRAFT_VERSION, bot_locale_id)

def delete_all():
    bot_id = get_bot_id(BOT_NAME)
    response = None
    if bot_id:
        response = clientLEXV2.delete_bot(
            botId=bot_id,
            skipResourceInUseCheck=True
        )
    return response

def process_slot_types(items):
    slot_types = {}
    for item in items:
        slot_types[item["qid"]] = item["slotType"]
    return slot_types

def duplicate_utterances(items):
    qna_intent_utterances = {}
    qid_intent_utterances = {}
    dup_utterances = {}
    dups = None
    for item in items:
     replace_with_lex_slot_references(qna_intent_utterances, qid_intent_utterances, item)
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

def replace_with_lex_slot_references(qna_intent_utterances, qid_intent_utterances, item):
    # get processed version of utterance with slot definitions replaced by lex slot references
    for utterance in item["qna"]["q"]:
        utterance = utterance.lower()
        if item["qna"]["enableQidIntent"]:
            if utterance not in qid_intent_utterances:
                qid_intent_utterances[utterance] = [item["qid"]]
            else:
                qid_intent_utterances[utterance].append(item["qid"])
        else:
            if utterance not in qna_intent_utterances:
                qna_intent_utterances[utterance] = [item["qid"]]
            else:
                qna_intent_utterances[utterance].append(item["qid"])

def validate_slots(intents):
    msg = None
    bad_slots = get_bad_slots(intents)
    if bad_slots:
        msg = "Undefined slot reference in QID"
        for qid in bad_slots:
            msg += f", '{qid}' {bad_slots[qid]}"
    return msg

def get_bad_slots(intents):
    bad_slots = {}
    for qid in intents:
        if "slots" in intents[qid]:
            slot_dict = build_slot_dict(intents, qid)
            print(f"{slot_dict}")
            print(f"{intents[qid]}")
            for utterance in intents[qid]["utterances"]:
                slotnames = re.findall(r'{(.*?)}',utterance)
                for slot in slotnames:
                    if slot not in slot_dict:
                        bad_slots[qid] = bad_slots.get(qid,[]) + [slot]
    return bad_slots

def build_slot_dict(intents, qid):
    slot_dict = {}
    for slot in intents[qid]["slots"]:
        slotname = slot["slotName"]
        slot_dict[slotname] = True
    return slot_dict

def process_intents(items):
    # initialise intents dict
    intents = {
        QNA_INTENT: {
            "utterances":set()
        }
    }
    # build intents with set of unique utterances per intent
    for item in items:
        if item["qna"]["enableQidIntent"]:
            # QID gets its own Lex intent
            intents[item["qid"]] = {"utterances":set(item["qna"]["q"])}
            if "slots" in item["qna"]:
                intents[item["qid"]]["slots"] = item["qna"]["slots"]
        else:
            # Add QID utterances to default QnABot intent
            intents[QNA_INTENT]["utterances"].update(item["qna"]["q"])
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
            slot_type_items =  [i for i in items if i["type"]=="slottype"]
            slot_types = process_slot_types(slot_type_items)
            qna_items =  [i for i in items if i["type"]=="qna"]
            intents = process_intents(qna_items)
            result = build_all(intents, slot_types)
            print("LexV2 bot info: " + json.dumps(result))
        except Exception as e:
            result = "FAILED: " + str(e)
            status(result)
            raise

# for testing on terminal
if __name__ == "__main__":
    items = [
        {"qid":QNA_INTENT, "type":"qna", "qna":{"enableQidIntent": True, "q":["what is the capital city of France?", "How great is Q and A bot?"]}},
        {"qid":"1.CustomIntent.test",  "type":"qna", "qna":{"enableQidIntent": True, "q":["What is your address?", "What is your phone number?"]}},
        {"qid":"2.CustomIntent.test",  "type":"qna", "qna":{"enableQidIntent": True, "q":["What is your name?", "What are you called?"]}},
        {"qid":"3.CustomIntent.test", "type":"qna", "qna":{"enableQidIntent": True, "q":["What are your opening hours?", "How do I contact you?"]}},
        {"qid":"4.CustomIntent.test", "type":"qna", "qna":{"enableQidIntent": True, "q":["My name is {firstname}"], "slots":[{"slotRequired": True,"slotName": "firstname","slotType": "AMAZON.FirstName", "slotPrompt": "What is your first name?"}]}},
        {"qid":"5.CustomIntent.test", "type":"qna", "qna":{"enableQidIntent": True, "q":["My course is {coursename}"], "slots":[{"slotRequired": True,"slotName": "coursename","slotType": "Course", "slotPrompt": "What is your course name?"}]}},
        {"qid": "Course", "type":"slottype", "slotType": {"descr": "Course Name","resolutionStrategyRestrict": True,"slotTypeValues": [{"samplevalue": "Chemistry","synonyms": "Chem"}],}},
   ]
    event = {
        "statusFile":None,
        "items": items
    }
    result = handler(event,{})
    print(result)
