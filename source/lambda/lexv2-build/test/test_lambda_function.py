######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################
import os
import unittest
import boto3
import json
from unittest.mock import patch, MagicMock
from moto import mock_aws

@mock_aws
class TestLambdaFunction(unittest.TestCase):
    def setUp(self):
        self.iam_client = boto3.client("iam")
        self.s3_client = boto3.client('s3')
        self.s3_client.create_bucket(Bucket="test_bucket")
        self.s3_client.put_object(
            Bucket='test_bucket', Key='status.json', Body=json.dumps({"status": ""}))
        patcher = patch('handler.clientLEXV2')
        self.addCleanup(patcher.stop)
        self.lex_client_mock = patcher.start()
        self.lex_client_mock.create_bot.return_value = {"botId": "test_bot_id"}
        self.lex_client_mock.list_bots.return_value = {"botSummaries": [{"botId": "testBotId"}]}
        self.lex_client_mock.describe_bot.return_value = {"botStatus": "Available"}
        self.lex_client_mock.create_intent.side_effect = self.create_intent_mock
        self.lex_client_mock.update_intent.side_effect = self.create_intent_mock
        self.lex_client_mock.list_slots.side_effect = self.list_slots_mock
        self.lex_client_mock.create_bot_version.return_value = {"botVersion": "1", "botStatus": "Available"}
        self.lex_client_mock.describe_bot_version.return_value = {"botStatus": "Available"}
        self.lex_client_mock.create_bot_alias.return_value = {"botAliasId": "live"}
        self.lex_client_mock.describe_bot_alias.return_value = {
            "botAliasStatus": "Available"}
        self.lex_client_mock.list_bot_aliases.return_value = {"botAliasSummaries": [
            {"botAliasName": "live", "botAliasId": "testBotAliasId"}]}
        self.lex_client_mock.list_slot_types.side_effect = self.list_slot_types_mock

    def create_lambda_event(self, request_type):
        return {
            "RequestId": "fakeid",
            "RequestType": request_type,
            "resources": ["arn:aws:events:us-east-1:fakeaccount/FakeRule"],
            "detail": {"name": "test_subreddit"},
            "ResourceProperties": {"utterances": ["dummy utterance"],
                                   "BuildDate": "2023-09-29T21:07:19.945Z",
                                   "localIds": "en_US,es_US,fr_CA",
                                   "description": "QnABot LexV2 Bot5.5.0 - v1"}
        }

    @patch("handler.helper")
    def test_lambda_handler(self, cr_helper_mock):
        import handler
        context = MagicMock()
        handler.handler(self.create_lambda_event("Create"), context)
        cr_helper_mock.assert_called()

    @patch("handler.clientTRANSLATE")
    def test_create_bot_success(self, translate_client_mock):
        import handler
        self.counter = {'en_US': 0, 'es_US': 0, 'fr_CA': 0}
        self.request_type = 'create'
        self.lex_client_mock.list_bots.return_value = {"botSummaries": {}}
        self.lex_client_mock.create_bot_locale.return_value = {}
        self.lex_client_mock.describe_bot_locale.side_effect = self.describe_bot_locale_mock
        self.lex_client_mock.list_intents.side_effect = self.list_intent_mock
        self.lex_client_mock.create_slot.return_value = {"slotId": "testSlotId"}
        translate_client_mock.translate_text.return_value = {
            "TranslatedText": "test translation"}
        
        handler.create_bot(self.create_lambda_event("Create"), MagicMock())
        self.assertEqual(1, self.lex_client_mock.create_bot.call_count)
        self.assertEqual(3, self.lex_client_mock.create_bot_locale.call_count)
        self.assertEqual(6, self.lex_client_mock.create_intent.call_count)
        self.assertEqual(6, self.lex_client_mock.update_intent.call_count)
        self.assertEqual(3, self.lex_client_mock.create_slot_type.call_count)
        self.assertEqual(3, self.lex_client_mock.create_slot.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_alias.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_version.call_count)

    def test_create_bot_invalid_bot_status_exception(self):
        import handler
        self.counter = {'en_US': 0, 'es_US': 0, 'fr_CA': 0}
        self.lex_client_mock.list_bots.return_value = {"botSummaries": {}}
        self.lex_client_mock.describe_bot.return_value = {"botStatus": "InvalidStatus"}
        with self.assertRaises(Exception):
            handler.create_bot(self.create_lambda_event("Create"), MagicMock())

    @patch("handler.clientTRANSLATE")
    def test_create_bot_version_not_found(self, translate_client_mock):
        import handler
        self.counter = {'en_US': 0, 'es_US': 0, 'fr_CA': 0}
        self.request_type = 'create'
        self.lex_client_mock.list_bots.return_value = {"botSummaries": {}}
        self.lex_client_mock.create_bot_locale.return_value = {}
        self.lex_client_mock.describe_bot_locale.side_effect = self.describe_bot_locale_mock
        self.lex_client_mock.list_intents.side_effect = self.list_intent_mock
        self.lex_client_mock.create_slot.return_value = {"slotId": "testSlotId"}
        self.lex_client_mock.describe_bot_version.side_effect = Exception('ResourceNotFoundException')
        translate_client_mock.translate_text.return_value = {
            "TranslatedText": "test translation"}

        with self.assertRaises(Exception):
            handler.create_bot(self.create_lambda_event("Create"), MagicMock())
        self.assertEqual(1, self.lex_client_mock.describe_bot_version.call_count)

    @patch("handler.clientTRANSLATE")
    def test_lambda_not_called_from_CF_success(self, translate_client_mock):
        import handler
        self.request_type = 'update'
        event = {
            "statusFile": {"Bucket": "test_bucket", "Key": "status.json"},
            "items": [
                {"qid": "001", "type": "qna", "qna": {"enableQidIntent": False,
                                                      "q": ["What is QnABot"
                                                            ],  "slots": []}, "slotType": {}
                 }]
        }
        
        self.lex_client_mock.list_intents.side_effect = self.list_intent_mock_update
        self.lex_client_mock.describe_bot_locale.return_value = {
            "botLocaleStatus": "Built"}
        translate_client_mock.translate_text.return_value = {
            "TranslatedText": "test translation"}
        handler.handler(event, MagicMock())
        self.assertEqual(0, self.lex_client_mock.create_bot.call_count)
        self.assertEqual(12, self.lex_client_mock.update_intent.call_count)
        self.assertEqual(0, self.lex_client_mock.create_slot_type.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_alias.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_version.call_count)

    def test_lambda_not_called_from_CF_enable_qid_intent_success(self):
        import handler
        self.request_type = 'update'
        event = {
            "statusFile": {"Bucket": "test_bucket", "Key": "status.json"},
            "items": [
                {"qid": "001", "type": "qna",
                 "qna": {"enableQidIntent": True, "q": ["What is QnABot"],  "slots": []}, "slotType": {}
                 },
                {"qid": "4.CustomIntent.test", "type": "qna", "qna": {"enableQidIntent": True, "q": ["My name is {firstname}"], "slots":[
                    {"slotRequired": True, "slotName": "firstname", "slotType": "AMAZON.FirstName", "slotPrompt": "What is your first name?"}]}},
            ]
        }
        self.lex_client_mock.list_intents.side_effect = self.list_intent_mock_update
        self.lex_client_mock.describe_bot_locale.return_value = {
            "botLocaleStatus": "Built"}
        
        handler.handler(event, MagicMock())
        self.assertEqual(0, self.lex_client_mock.create_bot.call_count)
        self.assertEqual(18, self.lex_client_mock.update_intent.call_count)
        self.assertEqual(6, self.lex_client_mock.create_intent.call_count)
        self.assertEqual(0, self.lex_client_mock.create_slot_type.call_count)
        self.assertEqual(3, self.lex_client_mock.create_slot.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_alias.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_version.call_count)
        self.assertEqual(3, self.lex_client_mock.delete_intent.call_count)

    @patch("handler.clientTRANSLATE")
    def test_lambda_not_called_from_CF_enable_slot_type_success(self, translate_client_mock):
        import handler
        self.request_type = 'update'
        event = {
            "statusFile": {"Bucket": "test_bucket", "Key": "status.json"},
            "items": [
                {"qid": "Course", "type": "slottype", "slotType": {"descr": "Course Name",
                                                                   "resolutionStrategyRestrict": True, "slotTypeValues": [{"samplevalue": "Chemistry", "synonyms": "Chem"}]}}
            ]
        }
        self.lex_client_mock.list_intents.side_effect = self.list_intent_mock_update
        translate_client_mock.translate_text.return_value = {
            "TranslatedText": "test translation"}
        self.lex_client_mock.describe_bot_locale.return_value = {
            "botLocaleStatus": "Built"}
        handler.handler(event, MagicMock())
        self.assertEqual(0, self.lex_client_mock.create_bot.call_count)
        self.assertEqual(12, self.lex_client_mock.update_intent.call_count)
        self.assertEqual(3, self.lex_client_mock.create_slot_type.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_alias.call_count)
        self.assertEqual(1, self.lex_client_mock.create_bot_version.call_count)

    def test_delete_bot(self):
        import handler
        handler.delete_bot(MagicMock(), MagicMock())
        self.assertEqual(1, self.lex_client_mock.delete_bot.call_count)
    
    @patch("handler.helper")
    def test_update_bot(self, cr_helper_mock):
        import handler
        expected_result = {
            "botName": "test_stack_QnaBot",
            "botId": "testBotId",
            "botAlias": "live",
            "botAliasId": "testBotAliasId",
            "botIntent": "QnaIntent",
            "botIntentFallback": "FallbackIntent",
            "botLocaleIds": ",".join(os.environ["LOCALES"].replace(' ','').split(","))
        }
        handler.update_bot(MagicMock(), MagicMock())
        cr_helper_mock.Data.update.assert_called_with(expected_result)

    def list_intent_mock_update(self, **kwargs):
        filter_value = kwargs.get('filters')[0].get('values')[0]
        if 'QID-INTENT-001' in filter_value or 'QID-INTENT-4_dot_CustomIntent_dot_test' in filter_value:
            return {"intentSummaries": []}
        if "QID-INTENT" in filter_value:
            return {"intentSummaries": [{"intentId": "QID-INTENT-003",  "intentName": "QID-INTENT-003"}]}
        return {"intentSummaries": [{"intentId": f"{filter_value}Id"}]}

    def list_intent_mock(self, **kwargs):
        filter_value = kwargs.get('filters')[0].get('values')[0]
        if "QID-INTENT" in filter_value or "QnaIntent" in filter_value or "GenesysInitialIntent" in filter_value:
            return {"intentSummaries": []}
        return {"intentSummaries": [{"intentId": "FALLBCKINT"}]}

    def create_intent_mock(self, **kwargs):
        return {"intentId": f"{kwargs.get('intentName')}Id"}

    def list_slot_types_mock(self, **kwargs):
        if self.request_type == 'create':
            return {"slotTypeSummaries": []}
        filter_value = kwargs.get('filters')[0].get('values')[0]
        if "QID-SLOTTYPE-001" in filter_value or "QID-SLOTTYPE-Course" in filter_value:
            return {"slotTypeSummaries": []} 
        if "QID-SLOTTYPE-" in filter_value:
            return {"slotTypeSummaries": [{"slotTypeId": "QID-SLOTTYPE-003", "slotTypeName": "QID-SLOTTYPE-003"}]}
        return {"slotTypeSummaries": [{"slotTypeId": f"{filter_value}Id"}]}

    def list_slots_mock(self, **kwargs):
        if self.request_type == 'create':
            return {"slotSummaries": []}
        filter_value = kwargs.get('filters', [{}])[0].get('values', [{}])[0]
        if "QID-INTENT-4_dot_CustomIntent_dot_testId" in kwargs.get('intentId'):
            return {"slotSummaries": []}
        if filter_value:
            return {"slotSummaries": [{"slotId": f"{filter_value}Id"}]}
        if "QID-INTENT-001" in kwargs.get('intentId'):
            return {"slotSummaries": [{"slotId": "testSlotId"}]}
        return {"slotSummaries": []}

    def describe_bot_locale_mock(self, **kwargs):
        locale_id = kwargs.get('localeId')
        count = self.counter[locale_id]
        self.counter[locale_id] = count + 1
        if count == 0:
            raise Exception("Locale doesn't exist")
        if count == 1:
            return {"botLocaleStatus": "Creating"}
        if count == 2:
            return {"botLocaleStatus": "NotBuilt"}
        if count == 3:
            return {"botLocaleStatus": "Building"}
        if count == 4:
            return {"botLocaleStatus": "Built"}