######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################


import time
import logging

from helpers.website_model.dom_operator import DomOperator
from helpers.utils.textbox import Textbox

MODAL_XPATH = '//div[@id="add-question-form"]'
EDIT_MODAL_XPATH = '//div[@class="dialog dialog--active"]'

SUB_MENU_ID = 'edit-sub-menu'

ADD_QUESTION_ID = 'add-question-btn'
REFRESH_BUTTON_XPATH = '//button//span[contains(string(), "Refresh")]'

ITEM_ID = 'qid'
QUESTION_ID = 'qna-q'
ANSWER_ID = 'qna-a'
DESCRIPTION_ID = 'slottype-descr'
MARKDOWN_ANSWER_ID = 'qna-alt-markdown'
QNA_RADIO_XPATH = '//input[@type="radio" and @value="qna"]'
QUESTION_ADVANCED_MENU_XPATH = '//button[@class="v-expansion-panel-title" and contains(string(), "Advanced")]'
QUESTION_TOPIC_ID = 't'
QUESTION_CARD_TITLE_ID = 'r-title'
QUESTION_CARD_SUBTITLE_ID = 'r-subTitle'
QUESTION_CARD_URL_ID = 'r-imageUrl'
QUESTION_CARD_ADD_LEX_BUTTON_ID = 'qna.r.buttons-add'
ADD_SA_BUTTON_ID = 'qna.sa-add'
LAMBDA_HOOK_ID = 'l'
LAMBDA_HOOK_ARGS_ID_QNA = 'qna-args'
LAMBDA_HOOK_ARGS_ID = 'args'
CLIENT_FILTER_ID = 'clientFilterValues'
REF_MARKDOWN_ID = 'text-refMarkdown'
TAGS_ID = 'tags'
RP_ID = 'rp'
NEXT_ID = 'next'
BOT_ROUTING_ID = 'qna-botRouting-specialty_bot'
BOT_ROUTING_NAME_ID = 'qna-botRouting-specialty_bot_name'
BOT_ROUTING_ATTRIBUTE_ID = 'qna-botRouting-specialty_bot_session_attributes_to_merge'
KENDRA_REDIRECT_QUERY_ID = 'kendraRedirectQueryText'
KENDRA_REDIRECT_QUERY_ARGS_ID = 'kendraRedirectQueryArgs'
KENDRA_CONFIDENCE_ID = 'kendraRedirectQueryConfidenceThreshold'
CHAINING_ID = 'conditionalChaining'
RESPONSE_HOOK_ID = 'qna-elicitResponse-responsebot_hook'
RESPONSE_ATTRIBUTE_ID = 'qna-elicitResponse-response_sessionattr_namespace'
QUESTION_SUBMIT_ID = 'add-question-submit'
QUESTION_CANCEL_ID = 'add-question-cancel'
ADD_UTTERANCE_ID = 'qna.q-add'
ADD_QUESTION_SUCCESS_ID = 'add-success'
ADD_QUESTION_CLOSE_ID = 'add-close'

# EDIT_QUESTION_SUBMIT_ID = 'edit-submit'
# Cannot use ID due to hidden modals with buttons using same ID
EDIT_QUESTION_SUBMIT_XPATH = EDIT_MODAL_XPATH + '//button[@id="edit-submit"]'
EDIT_QUESTION_SUBMIT_ID = "edit-submit"
EDIT_QUESTION_ADVANCED_MENU_XPATH = '//button[@class="v-expansion-panel-title" and contains(string(), "Advanced")]'
EDIT_QUESTION_CANCEL_ID = 'edit-cancel'
EDIT_QUESTION_SUCCESS_ID = 'edit-success'
EDIT_QUESTION_CLOSE_ID = 'edit-close'

QUIZ_RADIO_XPATH = '//input[@type="radio" and @value="quiz"]'
QUIZ_QUESTION_ID = 'quiz-question'
QUIZ_CORRECT_ANSWER_ID = 'quiz-correctAnswers'
QUIZ_INCORRECT_ANSWER_ID = 'quiz-incorrectAnswers'
QUIZ_ADD_CORRECT_ANSWER_BUTTON_ID = 'quiz.correctAnswers-add'
QUIZ_ADD_INCORRECT_ANSWER_BUTTON_ID = 'quiz.incorrectAnswers-add'

SLOT_RADIO_XPATH = '//input[@type="radio" and @value="slottype"]'
SLOT_TYPE_DESCRIPTION_XPATH = MODAL_XPATH + '//input[@id="slottype-descr"]'
SLOT_TYPE_RESTRICT_VALUES_XPATH = MODAL_XPATH + '//div[@data-path="slottype.resolutionStrategyRestrict"]//input'
SLOT_TYPE_ADD_BUTTON_XPATH = MODAL_XPATH + '//button[@id="slottype.slotTypeValues-add"]'
SLOT_DEDICATED_BOT_CHECKBOX_XPATH = MODAL_XPATH + '//div[@data-path="qna.enableQidIntent"]//input'
SLOT_ADD_SLOT_BUTTON_ID = MODAL_XPATH + '//button[@id="qna.slots-add"]'

TEXT_RADIO_XPATH = '//input[@type="radio" and @value="text"]'
PASSAGE_ID = 'text-passage'

# CONFIRM_DELETE_ID = 'confirm-delete'
# Cannot use ID due to hidden delete buttons sharing same id
CONFIRM_DELETE_XPATH = '//div[@class="v-card-actions"]//button[@id="confirm-delete"]'
CONFIRM_DELETE_CLOSE_XPATH = '//div[@class="v-card-actions"]//button//span[contains(string(), "close")]'
CONFIRM_DELETE_SUCCESS_ID = 'delete-success'

REBUILD_LEX_ID = 'lex-rebuild'
REBUILD_LEX_LOADING_ID = 'lex-loading'
REBUILD_LEX_SUCCESS_ID = 'lex-success'
REBUILD_LEX_CLOSE_ID = 'lex-close'

SYNC_KENDRA_FAQ_ID = 'kendra-sync'
SYNC_KENDRA_STATUS_ID = 'kendra-syncing'
SYNC_KENDRA_SUCCESS_ID = 'success'
SYNC_KENDRA_CLOSE_ID = 'kendra-close'

TEST_TAB_XPATH = '//button[@id="test-tab"]'
TEST_ALL_TAB_XPATH = '//button[@id="testAll-tab"]'
TEST_TAB_QUERY_ID = 'query'
TEST_TAB_QUERY_BUTTON_ID = 'query-test'
TEST_ALL_BUTTON_ID = 'testAll'
TEST_ALL_JOBS_ID = 'test-jobs'

# arbitrary element to wait for; one of the last elements to always load
# need to wait for table to fully load, otherwise auth error thrown on page exit
# if there are no elements in the table then we wait for the timeout, which will throw a warning
PAGE_READINESS_ELEMENT_XPATH = '//table//td//div'

class EditPage:
    """
    A class representing the administrative page that is used for managing questions and answers for Q&A Bot.

    This page provides functionality to create, update, and delete 3 types of questions: QnA, SlotType, and Quiz. 
    Additionally, it has a submenu that triggers the AWS Lex chatbot to rebuild with any updates to the questions 
    and provides functionality to sync AWS Kendra FAQ based on the questions.

    Attributes
    ----------
    operator: DomOperator
        A DomOperator object used to interact with the web page.
    """

    def __init__(self, operator: DomOperator) -> None:
        """
        Initializes EditPage with the provided DomOperator object.

        Parameters
        ----------
        operator : DomOperator
            A DomOperator object used to interact with the web page.
        """

        self.operator = operator
        self.__wait_to_load()

    def __wait_to_load(self):
        """
        A private method to wait for a page to load. Waits for a specific element 
        identified by its ID.
        """

        self.operator.wait_for_element_by_xpath(PAGE_READINESS_ELEMENT_XPATH)
        time.sleep(1)

    def refresh_questions(self):
        """
        Refreshes the question table.
        """
        time.sleep(3)
        self.operator.wait_for_element_by_xpath(REFRESH_BUTTON_XPATH)
        self.operator.select_xpath(REFRESH_BUTTON_XPATH, click=True)
        time.sleep(3)

    def add_question(self, qid: str, type: str, q: list[str]=[], a: str='', descr: str='', _id: str='', l: str='', args: str='', elicitResponse: dict={}, slots: list[dict]=[], r: dict={}, t: str='', question: str='', questions: list[str]=[], correctAnswers: list[str]=[], incorrectAnswers: list[str]=[], slotTypeValues: list[dict]=[], resolutionStrategyRestrict: bool=False, enableQidIntent: bool=False, kendraRedirectQueryText: str='', kendraRedirectQueryConfidenceThreshold: str='', conditionalChaining: str='', sa: list[dict]=[], botRouting: dict={}, passage: str='', alt: dict={}):
        """
        Adds a new question to the bot. The method behavior depends on the type 
        of question being added ('quiz', 'slottype', or "qna"). After adding the question,
        it waits for confirmation of the successful addition.
        """

        self.operator.click_element_by_id(ADD_QUESTION_ID, wait=10)
        self.operator.wait_for_element_by_xpath(QUESTION_ADVANCED_MENU_XPATH)
        self.operator.select_xpath(QUESTION_ADVANCED_MENU_XPATH, click=True)

        if type == 'quiz':
            self.__add_quiz_question(question, correctAnswers, incorrectAnswers)
        elif type == 'slottype':
            self.__add_slot_question(descr, slotTypeValues, resolutionStrategyRestrict)
        elif type == 'text':
            self.__add_text_question(passage)
        else:
            self.__add_qna_question(q, a, l, args, slots, r, t, elicitResponse, kendraRedirectQueryText, kendraRedirectQueryConfidenceThreshold, conditionalChaining, sa, botRouting, alt)

        qid_textbox = Textbox(self.operator.select_id(f"{type}-{ITEM_ID}"))
        qid_textbox.set_value(qid)

        self.operator.click_element_by_id(QUESTION_SUBMIT_ID)
        self.operator.wait_for_element_by_id(ADD_QUESTION_SUCCESS_ID, delay=30)
        self.operator.select_id(ADD_QUESTION_CLOSE_ID, wait= 5,  click=True)
        self.operator.wait_for_element_by_id(ADD_QUESTION_ID)

    def __add_qna_lambda_hook(self, l, l_args):
        """
        A private method that sets a lambda hook for a QnA question. This lambda hook
        can be used to provide dynamic responses.
        """

        l_textbox = Textbox(self.operator.select_id(f"qna-{LAMBDA_HOOK_ID}"))
        l_textbox.set_value(l)

        la_textbox = Textbox(self.operator.select_id(f"{LAMBDA_HOOK_ARGS_ID_QNA}-0"))
        la_textbox.set_value(l_args)

    def __add_qna_slot(self, index, slot):
        """
        A private method that adds a slot to a QnA question. Slots can be used to capture
        and utilize user inputs within the conversation.
        """

        if 'slotRequired' in slot:
            self.operator.select_xpath(f'{MODAL_XPATH}//div[@data-path="qna.slots[{index}].slotRequired"]//input', click=slot['slotRequired'])
        if 'slotCached' in slot:
            self.operator.select_xpath(f'{MODAL_XPATH}//div[@data-path="qna.slots[{index}].slotValueCached"]//i', click=slot['slotCached'])
        
        name_textbox = Textbox(self.operator.select_xpath(f'{MODAL_XPATH}//div[@data-path="qna.slots[{index}].slotName"]//input'))
        name_textbox.set_value(slot['slotName'])
        
        type_textbox = Textbox(self.operator.select_xpath(f'{MODAL_XPATH}//div[@data-path="qna.slots[{index}].slotType"]//input'))
        type_textbox.set_value(slot['slotType'])
        
        prompt_textbox = Textbox(self.operator.select_xpath(f'{MODAL_XPATH}//div[@data-path="qna.slots[{index}].slotPrompt"]//input'))
        prompt_textbox.set_value(slot['slotPrompt'])
        
        if 'slotSampleUtterances' in slot:
            utterances_textbox = Textbox(self.operator.select_xpath(f'{MODAL_XPATH}//div[@data-path="qna.slots[{index}].slotSampleUtterances"]//input'))
            utterances_textbox.set_value(slot['slotSampleUtterances'])

    def __add_qna_card(self, r, type: str='qna'):
        """
        A private method that sets up a response card for a QnA question. Response cards 
        provide additional visual elements for the bot.
        """

        title_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_CARD_TITLE_ID}'))
        title_textbox.set_value(r['title'])

        subtitle_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_CARD_SUBTITLE_ID}'))
        subtitle_textbox.set_value(r['subTitle'])

        url_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_CARD_URL_ID}'))
        url_textbox.set_value(r['imageUrl'])

        for index, button in enumerate(r['buttons']):
            if index > 0:
                    self.operator.select_id(QUESTION_CARD_ADD_LEX_BUTTON_ID, click=True)

            button_display_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="qna.r.buttons[{index}].text"]//input'))
            button_display_textbox.set_value(button['text'])

            button_value_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="qna.r.buttons[{index}].value"]//input'))
            button_value_textbox.set_value(button['value'])

    def __add_qna_question(self, q: list[str], a: str, l: str='', args: str='', slots: list[dict]=[], r: dict={}, t: str='', elicitResponse: dict={}, kendraRedirectQueryText: str='', kendraRedirectQueryConfidenceThreshold: str='', conditionalChaining: str='', sa: list[dict]=[], botRouting: dict={}, alt: dict={}, mode: str= 'add'):
        """
        A private method that adds a QnA question to the bot.
        """
        type = "qna"
        if mode == 'add':
            self.operator.select_xpath(QNA_RADIO_XPATH, click=True)

        for index, utterance in enumerate(q):
            utterance_id = f'{QUESTION_ID}-{index}'

            # if not self.operator.element_exists_by_id(utterance_id):
            if index > 0:
                self.operator.click_element_by_id(ADD_UTTERANCE_ID)

            utterance_textbox = Textbox(self.operator.select_id(utterance_id))
            utterance_textbox.set_value(utterance)

        a_textbox = Textbox(self.operator.select_id(ANSWER_ID))
        a_textbox.set_value(a)

        if alt:
            alt_textbox = Textbox(self.operator.select_id(MARKDOWN_ANSWER_ID))
            alt_textbox.set_value(alt['markdown'])

        if l:
            self.__add_qna_lambda_hook(l, args)

        if slots:
            self.operator.select_xpath(SLOT_DEDICATED_BOT_CHECKBOX_XPATH, click=True)

        for index, slot in enumerate(slots):
            if index > 0:
                self.operator.select_xpath(SLOT_ADD_SLOT_BUTTON_ID, click=True)
            self.__add_qna_slot(index, slot)

        if r:
            self.__add_qna_card(r, 'qna')

        if t:
            topic_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_TOPIC_ID}'))
            topic_textbox.set_value(t)

        if elicitResponse:
            hook_textbox = Textbox(self.operator.select_id(RESPONSE_HOOK_ID))
            hook_textbox.set_value(elicitResponse['responsebot_hook'])

            hook_textbox = Textbox(self.operator.select_id(RESPONSE_ATTRIBUTE_ID))
            hook_textbox.set_value(elicitResponse['response_sessionattr_namespace'])

        if kendraRedirectQueryText:
            kendra_query_textbox = Textbox(self.operator.select_id(f'{type}-{KENDRA_REDIRECT_QUERY_ID}'))
            kendra_query_textbox.set_value(kendraRedirectQueryText)

            kendra_confidence_textbox = Textbox(self.operator.select_id(f'{type}-{KENDRA_CONFIDENCE_ID}'))
            kendra_confidence_textbox.set_value(kendraRedirectQueryConfidenceThreshold)

        if conditionalChaining:
            chaining_textbox = Textbox(self.operator.select_id(f'{type}-{CHAINING_ID}'))
            chaining_textbox.set_value(conditionalChaining)

        for index, attribute in enumerate(sa):
            if index > 0:
                self.operator.select_xpath(ADD_SA_BUTTON_ID, click=True)
            sa_name_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="{type}.sa[{index}].text"]//input'))
            sa_name_textbox.set_value(attribute['text'])

            sa_value_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="{type}.sa[{index}].value"]//textarea'))
            sa_value_textbox.set_value(attribute['value'])

        if botRouting:
            for key, value in botRouting.items():
                if self.operator.element_exists_by_id(f"{type}-botRouting-{key}"):
                    bot_routing_textbox = Textbox(self.operator.select_id(f"{type}-botRouting-{key}"))
                    bot_routing_textbox.set_value(value)

    def __add_quiz_question(self, question: str, correctAnswers: list[str]=[], incorrectAnswers: list[str]=[]):
        """
        A private method that adds a quiz question to the bot. Quiz questions provide multiple
        answers and the bot verifies if the user's answer is correct.
        """

        self.operator.select_xpath(QUIZ_RADIO_XPATH, click=True)

        q_textbox = Textbox(self.operator.select_id(QUIZ_QUESTION_ID))
        q_textbox.set_value(question)
    
        for index, answer in enumerate(correctAnswers):
            answer_id = QUIZ_CORRECT_ANSWER_ID
            answer_id = answer_id + f'-{index}'
            self.operator.select_id(QUIZ_ADD_CORRECT_ANSWER_BUTTON_ID, wait=5, click=True)

            a_textbox = Textbox(self.operator.select_id(answer_id))
            a_textbox.set_value(answer)
    
        for index, answer in enumerate(incorrectAnswers):
            answer_id = QUIZ_INCORRECT_ANSWER_ID
            answer_id = answer_id + f'-{index}'
            self.operator.select_id(QUIZ_ADD_INCORRECT_ANSWER_BUTTON_ID, click=True)

            a_textbox = Textbox(self.operator.select_id(answer_id))
            a_textbox.set_value(answer)

    def __add_slot_question(self, descr: str='', slotTypeValues: list[dict]=[], resolutionStrategyRestrict: bool=False):
        """
        A private method that adds a slot type question to the bot. Slot type questions can
        capture user inputs as slot values for use in the conversation.
        """

        self.operator.select_xpath(SLOT_RADIO_XPATH, click=True)

        description_textbox = Textbox(self.operator.select_xpath(SLOT_TYPE_DESCRIPTION_XPATH))
        description_textbox.set_value(descr)

        self.operator.select_xpath(SLOT_TYPE_RESTRICT_VALUES_XPATH, click=resolutionStrategyRestrict)

        for index, values in enumerate(slotTypeValues):
            if index > 0:
                self.operator.select_xpath(SLOT_TYPE_ADD_BUTTON_XPATH, click=True)

            value_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="slottype.slotTypeValues[{index}].samplevalue"]//input', wait=5))
            value_textbox.set_value(values['samplevalue'])
            synonym_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="slottype.slotTypeValues[{index}].synonyms"]//input', wait=5))
            synonym_textbox.set_value(values['synonyms'])

    def __add_text_question(self, passage):
        """
        A private method that adds a text type question to the bot. Text type questions capture passages used for LLM inference.
        """

        self.operator.select_xpath(TEXT_RADIO_XPATH, click=True)

        passage_textbox = Textbox(self.operator.select_id(PASSAGE_ID))
        passage_textbox.set_value(passage)

    def check_question_exists_by_qid(self, qid: str) -> bool:
        """
        Checks if a question exists by its QID. Returns True if the question exists,
        False otherwise.
        """

        return self.operator.element_exists_by_id(f'qa-{qid}')

    def edit_question_by_qid(self, qid: str, type: str, q: list[str]=[], a: str='', descr: str='', _id: str='', l: str='', args: str='', elicitResponse: dict={}, slots: list[dict]=[], r: dict={}, t: str='', question: str='', questions: list[str]=[], correctAnswers: list[str]=[], incorrectAnswers: list[str]=[], slotTypeValues: list[dict]=[], resolutionStrategyRestrict: bool=False, enableQidIntent: bool=False, kendraRedirectQueryText: str='', kendraRedirectQueryConfidenceThreshold: str='', conditionalChaining: str='', passage: str='', alt: dict={}):
        """
        Edits an existing question identified by its QID. The type of edit performed
        depends on the type of question ('quiz', 'slottype', or "qna").
        """
        logging.info(f"Editing question : {qid}, type : {type}")
        self.operator.select_xpath(f'//span[@id="qa-{qid}-edit"]//descendant::button', wait=1, click=True)
        self.operator.wait_for_element_by_xpath(EDIT_QUESTION_ADVANCED_MENU_XPATH)
        self.operator.select_xpath(EDIT_QUESTION_ADVANCED_MENU_XPATH, click=True)

        if type == 'quiz':
            self.__add_quiz_question(question, correctAnswers, incorrectAnswers)
        elif type == 'slottype':
            self.__add_slot_question(descr, slotTypeValues, resolutionStrategyRestrict)
        elif type == 'text':
            self.__add_text_question(passage)
        else:
            self.__add_qna_question(q, a, l, args, slots, r, t, elicitResponse, kendraRedirectQueryText, kendraRedirectQueryConfidenceThreshold, conditionalChaining, alt, mode='edit')

        self.operator.wait_for_element_by_id(EDIT_QUESTION_SUBMIT_ID)
        self.operator.click_element_by_id(EDIT_QUESTION_SUBMIT_ID)
        self.operator.wait_for_element_by_id(EDIT_QUESTION_SUCCESS_ID)
        self.operator.click_element_by_id(EDIT_QUESTION_CLOSE_ID, wait= 10)
        self.operator.wait_for_element_by_id(ADD_QUESTION_ID)


    def match_question_field_values(
            self,
            qid: str,
            type: str='',
            q: list[str]=[],
            a: str='',
            descr: str='',
            _id: str='',
            l: str='',
            args: str='',
            elicitResponse: dict={},
            slots: list[dict]=[],
            r: dict={},
            t: str='',
            slotTypeValues: list[dict]=[],
            resolutionStrategyRestrict: bool=False,
            enableQidIntent: bool=False,
            kendraRedirectQueryText: str='',
            kendraRedirectQueryConfidenceThreshold: str='',
            conditionalChaining: str='',
            sa: list[dict]=[],
            botRouting: dict={},
            passage: str='',
            alt: dict={},
            clientFilterValues: str='',
            refMarkdown: str='',
            tags: str='',
            kendraRedirectQueryArgs: list[str]=[],
            rp: str='',
            next: str='',
        ) -> bool:

        self.operator.wait_for_element_by_xpath(f'//span[@id="qa-{qid}-edit"]//descendant::button')
        self.operator.select_xpath(f'//span[@id="qa-{qid}-edit"]//descendant::button', click=True)
        self.operator.wait_for_element_by_xpath(EDIT_QUESTION_ADVANCED_MENU_XPATH)
        self.operator.select_xpath(EDIT_QUESTION_ADVANCED_MENU_XPATH, click=True)

        for index, utterance in enumerate(q):
            utterance_id = f'{QUESTION_ID}-{index}'

            utterance_textbox = Textbox(self.operator.select_id(utterance_id))
            if utterance_textbox.get_value() != utterance:
                print(f'Value "{utterance_textbox.get_value()}" does not match expected field value "{utterance=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if a:
            a_textbox = Textbox(self.operator.select_id(ANSWER_ID))
            if a_textbox.get_value() != a:
                print(f'Value "{a_textbox.get_value()}" does not match expected field value "{a=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if alt:
            alt_textbox = Textbox(self.operator.select_id(MARKDOWN_ANSWER_ID))
            if alt_textbox.get_value() != alt['markdown']:
                print(f'Value "{alt_textbox.get_value()}" does not match expected field value "{alt=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if descr:
            descr_textbox = Textbox(self.operator.select_id(DESCRIPTION_ID))
            if descr_textbox.get_value() != descr:
                print(f'Value "{descr_textbox.get_value()}" does not match expected field value "{descr=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if l:
            l_textbox = Textbox(self.operator.select_id(f"{type}-{LAMBDA_HOOK_ID}"))
            if l_textbox.get_value() != l:
                print(f'Value "{l_textbox.get_value()}" does not match expected field value "{l=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False
            
            for index, l_arg in enumerate(args):
                l_arg_id = f'{type}-{LAMBDA_HOOK_ARGS_ID}-{index}'
                arg_textbox = Textbox(self.operator.select_id(l_arg_id))

                if arg_textbox.get_value() != l_arg:
                    print(f'Value "{arg_textbox.get_value()}" does not match expected field value "{l_arg=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False

        if r:
            title_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_CARD_TITLE_ID}'))
            if title_textbox.get_value() != r['title']:
                print(f'Value "{title_textbox.get_value()}" does not match expected field value "{r=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

            if 'subTitle' in r:
                subtitle_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_CARD_SUBTITLE_ID}'))
                if subtitle_textbox.get_value() != r['subTitle']:
                    print(f'Value "{subtitle_textbox.get_value()}" does not match expected field value "{r=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False

            url_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_CARD_URL_ID}'))
            if url_textbox.get_value() != r['imageUrl']:
                print(f'Value "{url_textbox.get_value()}" does not match expected field value "{r=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

            for index, button in enumerate(r['buttons']):

                button_display_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="{type}.r.buttons[{index}].text"]//input[@id="{type}-r-buttons-{index}-text"]'))
                if button_display_textbox.get_value() != button['text']:
                    print(f'Value "{button_display_textbox.get_value()}" does not match expected field value "{button=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False

                button_value_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="{type}.r.buttons[{index}].value"]//input[@id="{type}-r-buttons-{index}-value"]'))
                if button_value_textbox.get_value() != button['value']:
                    print(f'Value "{button_value_textbox.get_value()}" does not match expected field value "{button=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False

        if t:
            topic_textbox = Textbox(self.operator.select_id(f'{type}-{QUESTION_TOPIC_ID}'))
            if topic_textbox.get_value() != t:
                print(f'Value "{topic_textbox.get_value()}" does not match expected field value "{t=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if elicitResponse:
            hook_textbox = Textbox(self.operator.select_id(RESPONSE_HOOK_ID))
            if hook_textbox.get_value() != elicitResponse['responsebot_hook']:
                print(f'Value "{hook_textbox.get_value()}" does not match expected field value "{elicitResponse=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

            if 'response_sessionattr_name' in elicitResponse:
                hook_textbox = Textbox(self.operator.select_id(RESPONSE_ATTRIBUTE_ID))
                if hook_textbox.get_value() != elicitResponse['response_sessionattr_name']:
                    print(f'Value "{hook_textbox.get_value()}" does not match expected field value "{elicitResponse=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False

        if kendraRedirectQueryText:
            kendra_query_textbox = Textbox(self.operator.select_id(f'{type}-{KENDRA_REDIRECT_QUERY_ID}'))
            if kendra_query_textbox.get_value() != kendraRedirectQueryText:
                print(f'Value "{kendra_query_textbox.get_value()}" does not match expected field value "{kendraRedirectQueryText=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

            kendra_confidence_textbox = Textbox(self.operator.select_id(f'{type}-{KENDRA_CONFIDENCE_ID}'))
            if kendra_confidence_textbox.get_value() != kendraRedirectQueryConfidenceThreshold:
                print(f'Value "{kendra_confidence_textbox.get_value()}" does not match expected field value "{kendraRedirectQueryConfidenceThreshold=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if conditionalChaining:
            chaining_textbox = Textbox(self.operator.select_id(f'{type}-{CHAINING_ID}'))
            if chaining_textbox.get_value() != conditionalChaining:
                print(f'Value "{chaining_textbox.get_value()}" does not match expected field value "{conditionalChaining=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        for index, attribute in enumerate(sa):
            sa_name_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="{type}.sa[{index}].text"]//input'))
            if sa_name_textbox.get_value() != attribute['text']:
                print(f'Value "{sa_name_textbox.get_value()}" does not match expected field value "{attribute=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

            sa_value_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="{type}.sa[{index}].value"]//textarea'))
            if sa_value_textbox.get_value() != attribute['value']:
                print(f'Value "{sa_value_textbox.get_value()}" does not match expected field value "{attribute=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if botRouting:
            bot_routing_textbox = Textbox(self.operator.select_id(BOT_ROUTING_ID))
            if bot_routing_textbox.get_value() != botRouting['specialty_bot']:
                print(f'Value "{bot_routing_textbox.get_value()}" does not match expected field value "{botRouting=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

            bot_routing_textbox = Textbox(self.operator.select_id(BOT_ROUTING_NAME_ID))
            if bot_routing_textbox.get_value() != botRouting['specialty_bot_name']: 
                print(f'Value "{bot_routing_textbox.get_value()}" does not match expected field value "{botRouting=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

            bot_routing_textbox = Textbox(self.operator.select_id(BOT_ROUTING_ATTRIBUTE_ID))
            if bot_routing_textbox.get_value() != botRouting['specialty_bot_session_attributes_to_merge']:
                print(f'Value "{bot_routing_textbox.get_value()}" does not match expected field value "{botRouting=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if slots:
            for index, slot in enumerate(slots):
                name_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="qna.slots[{index}].slotName"]//input'))
                if name_textbox.get_value() != slot['slotName']:
                    print(f'Value "{name_textbox.get_value()}" does not match expected field value "{slot=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False
                
                type_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="qna.slots[{index}].slotType"]//input'))
                if type_textbox.get_value() != slot['slotType']:
                    print(f'Value "{type_textbox.get_value()}" does not match expected field value "{slot=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False
                
                prompt_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="qna.slots[{index}].slotPrompt"]//input'))
                if prompt_textbox.get_value() != slot['slotPrompt']:
                    print(f'Value "{prompt_textbox.get_value()}" does not match expected field value "{slot=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False
                
                if 'slotSampleUtterances' in slot:
                    utterances_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="qna.slots[{index}].slotSampleUtterances"]//input'))
                    if utterances_textbox.get_value() != slot['slotSampleUtterances']:
                        print(f'Value "{utterances_textbox.get_value()}" does not match expected field value "{slot=}"')
                        self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                        return False
                    
        if slotTypeValues:
            for index, values in enumerate(slotTypeValues):
                sample_value_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="slottype.slotTypeValues[{index}].samplevalue"]//input'))
                if sample_value_textbox.get_value() != values['samplevalue']:
                    print(f'Value "{sample_value_textbox.get_value()}" does not match expected field value "{values=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False
                synonym_textbox = Textbox(self.operator.select_xpath(f'//div[@data-path="slottype.slotTypeValues[{index}].synonyms"]//input'))
                if synonym_textbox.get_value() != values['synonyms']:
                    print(f'Value "{synonym_textbox.get_value()}" does not match expected field value "{values=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False

        if passage:
            passage_textbox = Textbox(self.operator.select_id(PASSAGE_ID))
            if passage_textbox.get_value() != passage:
                print(f'Value "{passage_textbox.get_value()}" does not match expected field value "{passage=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False

        if clientFilterValues:
            client_filter_textbox = Textbox(self.operator.select_id(f'{type}-{CLIENT_FILTER_ID}'))
            if client_filter_textbox.get_value() != clientFilterValues:
                print(f'Value "{client_filter_textbox.get_value()}" does not match expected field value "{clientFilterValues=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False
            
        if refMarkdown:
            ref_markdown_textbox = Textbox(self.operator.select_id(REF_MARKDOWN_ID))
            if ref_markdown_textbox.get_value() != refMarkdown:
                print(f'Value "{ref_markdown_textbox.get_value()}" does not match expected field value "{refMarkdown=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False
            
        if tags:
            tags_textbox = Textbox(self.operator.select_id(f'{type}-{TAGS_ID}'))
            if tags_textbox.get_value() != tags:
                print(f'Value "{tags_textbox.get_value()}" does not match expected field value "{tags=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False
            
        if kendraRedirectQueryArgs:
            for index, query_arg in enumerate(kendraRedirectQueryArgs):
                query_arg_id = f'{type}-{KENDRA_REDIRECT_QUERY_ARGS_ID}-{index}'
                query_arg_textbox = Textbox(self.operator.select_id(query_arg_id))

                if query_arg_textbox.get_value() != query_arg:
                    print(f'Value "{query_arg_textbox.get_value()}" does not match expected field value "{query_arg=}"')
                    self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                    return False

        if rp:
            rp_textbox = Textbox(self.operator.select_id(f'{type}-{RP_ID}'))
            if rp_textbox.get_value() != rp:
                print(f'Value "{rp_textbox.get_value()}" does not match expected field value "{rp=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False
        
        if next:
            next_textbox = Textbox(self.operator.select_id(f'{type}-{NEXT_ID}'))
            if next_textbox.get_value() != next:
                print(f'Value "{next_textbox.get_value()}" does not match expected field value "{next=}"')
                self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
                return False
        self.operator.select_id(EDIT_QUESTION_CANCEL_ID, click=True)
        return True

    def delete_question_by_qid(self, qid: str):
        """
        Deletes a question identified by its QID. Waits for confirmation of successful
        deletion.
        """

        self.operator.select_xpath(f'//span[@id="qa-{qid}-delete"]//descendant::button', wait=1, click=True)
        
        self.operator.wait_for_element_by_xpath(CONFIRM_DELETE_XPATH)
        self.operator.select_xpath(CONFIRM_DELETE_XPATH, click=True)

        self.operator.wait_for_element_by_id(CONFIRM_DELETE_SUCCESS_ID, delay=20)

        # Delete success modal sometimes does not appear - check to ensure it exists before interacting with button
        if self.operator.element_exists_by_xpath(CONFIRM_DELETE_CLOSE_XPATH):
            self.operator.select_xpath(CONFIRM_DELETE_CLOSE_XPATH, wait=1, click=True)

        # After deleting multiple questions the XPATH points to the wrong QID in the table, so the table is refreshed
        self.refresh_questions()

    def select_question_by_qid(self, qid: str, column: int):
        """
        Selects a question by its QID and column number. Returns the selected question.
        """

        xpath = f'//*[@id="qa-{qid}"]/td[{column}]'

        for i in range(5):
            time.sleep(2 ** i)
            if self.operator.element_exists_by_xpath(xpath):
                break
            print(f'Element {xpath} not ready. Waiting {2 ** (i + 1)}s.')
            self.refresh_questions()

        return self.operator.select_xpath(xpath)

    def select_question_by_row_and_column(self, row: int, column: int):
        """
        Selects a question by its row and column number. Returns the selected question.
        """
        # Even rows are qa/answer content but are hidden, so we need to skip them
        skip_row = row * 2 - 1

        xpath = f'//table//tbody//tr[{skip_row}]/td[{column}]'

        for i in range(5):
            time.sleep(2 ** i)
            if self.operator.element_exists_by_xpath(xpath):
                break
            print(f'Element {xpath} not ready. Waiting {2 ** (i + 1)}s.')

        return self.operator.select_xpath(xpath)

    def select_sub_menu(self) -> None:
        """
        Selects the sub-menu on the current page.
        """

        self.operator.select_id(SUB_MENU_ID, click=True)

    def rebuild_lex(self) -> str:
        """
        Rebuilds the bot and returns the status of the operation.
        """

        self.select_sub_menu()
        self.operator.select_id(REBUILD_LEX_ID, click=True)

        success_status = self.operator.wait_for_element_by_id(REBUILD_LEX_SUCCESS_ID, delay=360).text
        self.operator.select_id(REBUILD_LEX_CLOSE_ID, click=True)
        time.sleep(1)
        return success_status
    
    def sync_kendra_faq(self):
        """
        Synchronizes the Kendra FAQ and returns the status of the operation.
        """

        self.select_sub_menu()
        time.sleep(10)
        self.operator.select_id(SYNC_KENDRA_FAQ_ID, click=True, wait=30)

        success_status = self.operator.wait_for_element_by_id(SYNC_KENDRA_SUCCESS_ID, delay=180).text

        self.operator.select_id(SYNC_KENDRA_CLOSE_ID, click=True)
        return success_status

    def select_test_tab(self):
        """
        Selects the test tab on the edit page
        """
        self.operator.select_xpath(TEST_TAB_XPATH, click=True)
        self.operator.wait_for_element_by_id(TEST_TAB_QUERY_BUTTON_ID)

    def select_test_all_tab(self):
        """
        Selects the test all tab on the edit page
        """
        self.operator.select_xpath(TEST_ALL_TAB_XPATH, click=True)
        self.operator.wait_for_element_by_id(TEST_ALL_JOBS_ID)

    def execute_test_query(self, query: str) -> None:
        """
        Executes a test query on the test tab
        """
        query_textbox = Textbox(self.operator.select_id(TEST_TAB_QUERY_ID))
        query_textbox.set_value(query)
        self.operator.select_id(TEST_TAB_QUERY_BUTTON_ID, click=True)

    def generate_test_report(self) -> str:
        """
        Generates a test report and returns the text content of the job
        """
        self.operator.select_id(TEST_ALL_BUTTON_ID, click=True)
        self.operator.wait_for_element_by_id_text(TEST_ALL_JOBS_ID, 'Completed', delay=300)
        return self.operator.select_id(TEST_ALL_JOBS_ID).text
