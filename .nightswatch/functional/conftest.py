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

import pytest
import os
import logging
import string
import secrets
from packaging import version
log = logging.getLogger(__name__)

from helpers.cfn_parameter_fetcher import ParameterFetcher
from helpers.kendra_client import KendraClient
from helpers.lex_client import LexClient
from helpers.iam_client import IamClient
from helpers.s3_client import S3Client
from helpers.translate_client import TranslateClient
from helpers.cloud_watch_client import CloudWatchClient
from helpers.website_model.dom_operator import DomOperator
from helpers.website_model.login_page import LoginPage

def get_password() -> str:
    cognito_special_characters = '^$*.[]{}()?-"!@#%&,><:;|_~+='

    def is_special(c):
        for s in cognito_special_characters:
            if s == c:
                return True
        return False

    alphabet = string.ascii_letters + string.digits + cognito_special_characters
    while True:
        password = ''.join(secrets.choice(alphabet) for i in range(10))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and sum(c.isdigit() for c in password) >= 3
                and any(is_special(c) for c in password)):
            return password

temp_pass = get_password() 
new_pass = get_password() 


@pytest.fixture
def region() -> str:
    return os.environ.get('CURRENT_STACK_REGION')

@pytest.fixture
def stack_name() -> str:
    return os.environ.get('CURRENT_STACK_NAME')

@pytest.fixture
def username() -> str:
    if os.environ.get('USER'):
        return os.environ.get('USER')
    return 'QnaAdmin'

@pytest.fixture
def email() -> str:
    email = os.environ.get("EMAIL", "")
    return email

@pytest.fixture
def temporary_password() -> str:
    return temp_pass

@pytest.fixture
def password() -> str:
    if os.environ.get('PASSWORD'):
        return os.environ.get('PASSWORD')
    return new_pass

@pytest.fixture
def languages() -> list['str']:
    return ['fr', 'es']

@pytest.fixture
def param_fetcher(region: str, stack_name: str) -> ParameterFetcher:
    return ParameterFetcher(region, stack_name)

@pytest.fixture
def kendra_client(region: str, param_fetcher: ParameterFetcher) -> KendraClient:
    return KendraClient(region, param_fetcher.get_kendra_faq_index(), param_fetcher.get_kendra_webpage_index())

@pytest.fixture
def lex_client(region: str) -> LexClient:
    return LexClient(region)

@pytest.fixture
def translate_client(region: str) -> TranslateClient:
    return TranslateClient(region)

@pytest.fixture
def iam_client(region: str) -> IamClient:
    return IamClient(region)

@pytest.fixture
def s3_client(region: str) -> None:
    return S3Client(region)

@pytest.fixture
def app_version(param_fetcher: ParameterFetcher) -> str:
    app_version = param_fetcher.get_deployment_version()
    return app_version

@pytest.fixture(autouse=True)
def skip_if_version_less_than(request, app_version):
    if request.node.get_closest_marker('skipif_version_less_than'):
        marker = request.node.get_closest_marker('skipif_version_less_than')
        expected_version = marker.args[0]
        if version.parse(app_version) < version.parse(expected_version):
            pytest.skip(f'App Version {app_version} is less than expected version {expected_version}. Skipping...')

@pytest.fixture
def cw_client(region: str, param_fetcher: ParameterFetcher) -> CloudWatchClient:
    stack_id = param_fetcher.get_stack_id()
    stack_name = param_fetcher.stack_name
    return CloudWatchClient(region, stack_id, stack_name)

@pytest.fixture(autouse=True)
def dom_operator():
    dom_operator = DomOperator()
    yield dom_operator
    dom_operator.end_session()

@pytest.fixture
def invalid_designer_login(dom_operator: DomOperator, param_fetcher: ParameterFetcher, username: str, password: str):
    designer_url = param_fetcher.get_designer_url()
    login_page = LoginPage(dom_operator, designer_url)
    password = 'invalidPassword'
    return login_page.login(username, password)

@pytest.fixture
def designer_login(dom_operator: DomOperator, param_fetcher: ParameterFetcher, username: str, password: str):
    designer_url = param_fetcher.get_designer_url()
    login_page = LoginPage(dom_operator, designer_url)
    return login_page.login(username, password)

@pytest.fixture
def client_login(dom_operator: DomOperator, param_fetcher: ParameterFetcher, username: str, password: str):
    client_url = param_fetcher.get_client_url()
    login_page = LoginPage(dom_operator, client_url)
    return login_page.login(username, password)

@pytest.fixture
def invalid_client_login(dom_operator: DomOperator, param_fetcher: ParameterFetcher, username: str, password: str):
    client_url = param_fetcher.get_client_url()
    login_page = LoginPage(dom_operator, client_url)
    password = 'invalidPassword'
    return login_page.login(username, password)

@pytest.fixture
def lambda_hook_example_arn(dom_operator: DomOperator, param_fetcher: ParameterFetcher, username: str, password: str) -> str:
    return param_fetcher.get_lambda_hook_example_arn().split(':')[-1]

test_time_flag = os.environ.get('TIMESTAMPS')
if test_time_flag:
    @pytest.fixture(autouse=True, scope='function')
    def log_timestamps(request):
        log.info(f"{request.node.cls} {request.node.name} start.")
        yield
        log.info(f"{request.node.cls} {request.node.name} end.")

@pytest.fixture
def kendra_is_enabled(param_fetcher: ParameterFetcher):
    return param_fetcher.kendra_is_enabled()


@pytest.fixture(autouse=True)
def skip_kendra(request, kendra_is_enabled):
    if request.node.get_closest_marker('skipif_kendra_not_enabled'):
        # if True:
        if not kendra_is_enabled:
            pytest.skip('Kendra is not configured for this environment. Skipping...')

@pytest.fixture
def knowledge_base_is_enabled(param_fetcher: ParameterFetcher):
    return param_fetcher.bedrock_knowledge_base_is_enabled()

@pytest.fixture(autouse=True)
def skip_knowledge_base(request, knowledge_base_is_enabled):
    if request.node.get_closest_marker('skipif_knowledge_base_not_enabled'):
        # if True:
        if not knowledge_base_is_enabled:
            pytest.skip('Knowledge bases are not configured for this environment. Skipping...')

@pytest.fixture
def llm_is_enabled(param_fetcher: ParameterFetcher):
    return param_fetcher.llm_is_enabled()

@pytest.fixture(autouse=True)
def skip_llm(request, llm_is_enabled):
    if request.node.get_closest_marker('skipif_llm_not_enabled'):
        # if True:
        if not llm_is_enabled:
            pytest.skip('An LLM is not configured for this environment. Skipping...')

@pytest.fixture
def embeddings_is_enabled(param_fetcher: ParameterFetcher):
    return param_fetcher.embeddings_is_enabled()

@pytest.fixture(autouse=True)
def skip_embeddings(request, embeddings_is_enabled):
    if request.node.get_closest_marker('skipif_embeddings_not_enabled'):
        # if True:
        if not embeddings_is_enabled:
            pytest.skip('Embeddings is not configured for this environment. Skipping...')


@pytest.fixture
def knowledge_base_model(param_fetcher: ParameterFetcher):
    return param_fetcher.get_bedrock_knowledge_base_model()

@pytest.fixture
def content_designer_output_bucket_name(param_fetcher: ParameterFetcher):
    return param_fetcher.get_content_designer_output_bucket_name()