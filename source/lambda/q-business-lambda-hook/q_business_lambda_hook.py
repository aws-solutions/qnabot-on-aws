######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################
import base64
import json
import os
import random
import string
import uuid
import boto3

AMAZONQ_APP_ID = os.environ.get("AMAZONQ_APP_ID")
AMAZONQ_REGION = os.environ.get("AMAZONQ_REGION") or os.environ["AWS_REGION"]
AMAZONQ_ENDPOINT_URL = os.environ.get("AMAZONQ_ENDPOINT_URL") or f'https://qbusiness.{AMAZONQ_REGION}.api.aws'
print("AMAZONQ_ENDPOINT_URL:", AMAZONQ_ENDPOINT_URL)


def get_amazonq_response(prompt, context, attachments, qbusiness_client):
    print(f"get_amazonq_response: prompt={prompt}, app_id={AMAZONQ_APP_ID}, context={context}")
    input_prompt = {
        "applicationId": AMAZONQ_APP_ID,
        "userMessage": prompt
    }
    if context:
        if context["conversationId"]:
            input_prompt["conversationId"] = context["conversationId"]
        if context["parentMessageId"]:
            input_prompt["parentMessageId"] = context["parentMessageId"]
    else:
        input_prompt["clientToken"] = str(uuid.uuid4())

    if attachments:
        input_prompt["attachments"] = attachments

    print("Amazon Q Input: ", input_prompt)
    try:
        resp = qbusiness_client.chat_sync(**input_prompt)
    except Exception as e:
        print("Amazon Q Exception: ", e)
        resp = {
            "systemMessage": "Amazon Q Error: " + str(e)
        }
    print("Amazon Q Response: ", json.dumps(resp, default=str))
    return resp


def get_settings_from_lambdahook_args(event):
    lambdahook_settings = {}
    lambdahook_args_list = event["res"]["result"].get("args", [])
    print("LambdaHook args: ", lambdahook_args_list)
    if len(lambdahook_args_list):
        try:
            lambdahook_settings = json.loads(lambdahook_args_list[0])
        except Exception as e:
            print(f"Failed to parse JSON:", lambdahook_args_list[0], e)
            print("..continuing")
    return lambdahook_settings


def get_args_from_lambdahook_args(event):
    parameters = {}
    lambdahook_args_list = event["res"]["result"].get("args", [])
    print("LambdaHook args: ", lambdahook_args_list)
    if len(lambdahook_args_list):
        try:
            parameters = json.loads(lambdahook_args_list[0])
        except Exception as e:
            print(f"Failed to parse JSON:", lambdahook_args_list[0], e)
            print("..continuing")
    return parameters


def get_s3_file(s3_path):
    if s3_path.startswith("s3://"):
        s3_path = s3_path[5:]
    s3 = boto3.resource('s3')
    bucket, key = s3_path.split("/", 1)
    obj = s3.Object(bucket, key)
    return obj.get()['Body'].read()


def get_attachments(event):
    user_files_uploaded = event["req"]["session"].get("userFilesUploaded", [])
    attachments = []
    for user_file in user_files_uploaded:
        print(f"getAttachments: userFile={user_file}")
        attachments.append({
            "data": get_s3_file(user_file["s3Path"]),
            "name": user_file["fileName"]
        })
    # delete userFilesUploaded from session
    event["res"]["session"].pop("userFilesUploaded", None)
    return attachments


def format_response(event, amazonq_response):
    # get settings, if any, from lambda hook args
    # e.g: {"Prefix":"<custom prefix heading>", "ShowContext": False}
    lambdahook_settings = get_settings_from_lambdahook_args(event)
    prefix = lambdahook_settings.get("Prefix", "Amazon Q Answer:")
    show_context_text = lambdahook_settings.get("ShowContextText", True)
    show_source_links = lambdahook_settings.get("ShowSourceLinks", True)
    # set plaintext, markdown, & ssml response
    if prefix in ["None", "N/A", "Empty"]:
        prefix = None
    plainttext = amazonq_response["systemMessage"]
    markdown = amazonq_response["systemMessage"]
    ssml = amazonq_response["systemMessage"]
    if prefix:
        plainttext = f"{prefix}\n\n{plainttext}"
        markdown = f"**{prefix}**\n\n{markdown}"
    if show_context_text:
        format_show_context(amazonq_response)
    if show_source_links:
        format_show_source_links(amazonq_response)

    # add plaintext, markdown, and ssml fields to event.res
    event["res"]["message"] = plainttext
    event["res"]["session"]["appContext"] = {
        "altMessages": {
            "markdown": markdown,
            "ssml": ssml
        }
    }
    # preserve conversation context in session
    amazonq_context = {
        "conversationId": amazonq_response.get("conversationId"),
        "parentMessageId": amazonq_response.get("systemMessageId")
    }
    event["res"]["session"]["qnabotcontext"]["amazonq_context"] = amazonq_context
    # TODO - can we determine when Amazon Q has a good answer or not?
    # For now, always assume it's a good answer.
    # QnAbot sets session attribute qnabot_gotanswer True when got_hits > 0
    event["res"]["got_hits"] = 1
    return event

def format_show_context(amazonq_response):
    context_text = ""
    for source in amazonq_response.get("sourceAttributions", []):
        title = source.get("title", "title missing")
        snippet = source.get("snippet", "snippet missing")
        url = source.get("url")
        if url:
            context_text = f'{context_text}<br><a href="{url}">{title}</a>'
        else:
            context_text = f'{context_text}<br><u><b>{title}</b></u>'
        # Returning too large of a snippet can break QnABot by exceeding the event payload size limit
        context_text = f"{context_text}<br>{snippet}\n"[:5000]
    if context_text:
        markdown = f'{markdown}\n<details><summary>Context</summary><p style="white-space: pre-line;">{context_text}</p></details>'

def format_show_source_links(amazonq_response):
    source_links = []
    for source in amazonq_response.get("sourceAttribution", []):
        title = source.get("title", "link (no title)")
        url = source.get("url")
        if url:
            source_links.append(f'<a href="{url}">{title}</a>')
    if len(source_links):
        markdown = f'{markdown}<br>Sources: ' + ", ".join(source_links)

def get_idc_iam_credentials(jwt):
    sso_oidc_client = boto3.client('sso-oidc')
    idc_sso_resp = sso_oidc_client.create_token_with_iam(
        clientId=os.environ.get("IDC_CLIENT_ID"),
        grantType="urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion=jwt,
    )

    print(idc_sso_resp)
    idc_sso_id_token_jwt = json.loads(base64.b64decode(idc_sso_resp['idToken'].split('.')[1] + '==').decode())

    sts_context = idc_sso_id_token_jwt["sts:identity_context"]
    sts_client = boto3.client('sts')
    session_name = "qbusiness-idc-" + "".join(
        random.choices(string.ascii_letters + string.digits, k=32) # NOSONAR
    )
    assumed_role_object = sts_client.assume_role(
        RoleArn=os.environ.get("AMAZONQ_ROLE_ARN"),
        RoleSessionName=session_name,
        ProvidedContexts=[{
            "ProviderArn": "arn:aws:iam::aws:contextProvider/IdentityCenter",
            "ContextAssertion": sts_context
        }]
    )
    creds_object = assumed_role_object['Credentials']

    return creds_object


def lambda_handler(event, context): # NOSONAR Lambda Handler
    print("Received event: %s" % json.dumps(event))
    args = get_args_from_lambdahook_args(event) # NOSONAR args for Lambda Handler
    # prompt set from args, or from the original query if not specified in args.
    user_input = event["req"]["llm_generated_query"]["orig"]
    qnabotcontext = event["req"]["session"].get("qnabotcontext", {})
    amazonq_context = qnabotcontext.get("amazonq_context", {})
    attachments = get_attachments(event)

    # Get the IDC IAM credentials
    # Parse session JWT token to get the jti
    token = (event['req']['session']['idtokenjwt'])
    decoded_token = json.loads(base64.b64decode(token.split('.')[1] + '==').decode())
    jti = decoded_token['jti']

    dynamo_resource = boto3.resource('dynamodb')
    dynamo_table = dynamo_resource.Table(os.environ.get('DYNAMODB_CACHE_TABLE_NAME'))

    kms_client = boto3.client('kms')
    kms_key_id = os.environ.get("KMS_KEY_ID")

    # Check if JTI exists in caching DB
    response = dynamo_table.get_item(Key={'jti': jti})

    if 'Item' in response:
        creds = json.loads((kms_client.decrypt(
            KeyId=kms_key_id,
            CiphertextBlob=response['Item']['Credentials'].value))['Plaintext'])
    else:
        creds = get_idc_iam_credentials(token)
        exp = creds['Expiration'].timestamp()
        creds.pop('Expiration')
        # Encrypt the credentials and store them in the caching DB
        encrypted_creds = \
            kms_client.encrypt(KeyId=kms_key_id,
                               Plaintext=bytes(json.dumps(creds).encode()))['CiphertextBlob']
        dynamo_table.put_item(Item={'jti': jti, 'ExpiresAt': int(exp), 'Credentials': encrypted_creds})

    # Assume the qbusiness role with the IDC IAM credentials to create the qbusiness client
    assumed_session = boto3.Session(
        aws_access_key_id=creds['AccessKeyId'],
        aws_secret_access_key=creds['SecretAccessKey'],
        aws_session_token=creds['SessionToken']
    )

    qbusiness_client = assumed_session.client("qbusiness")
    amazonq_response = get_amazonq_response(user_input, amazonq_context, attachments, qbusiness_client)
    event = format_response(event, amazonq_response)
    print("Returning response: %s" % json.dumps(event))
    return event
