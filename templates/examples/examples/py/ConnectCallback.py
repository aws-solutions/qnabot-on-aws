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

import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    #logger.info(event)

    #checking for Lambda Hook Arguments from QnA Bot
    if (event["res"]["result"]["args"]):
        arg_object = json.loads(event["res"]["result"]["args"][0])
        aws_region = arg_object["AWS_region"]
        aws_connect_instance_id = arg_object["AWS_connect_instance_id"]
        aws_connect_contact_flow_id = arg_object["AWS_connect_contact_flow_id"]
        aws_connect_queue_id = arg_object["AWS_connect_queue_id"]
        aws_connect_phone_number = arg_object["AWS_connect_phone_number"]
    else:
        event["res"]["message"] = "Your Lambda hook function in the QnA Bot designer is missing Lambda Hook Arguments. Include the values for the following parameters and values in a JSON string: " \
                                  "AWS Region, AWS Connect Instance ID, AWS Connect Contact Flow ID, AWS Connect Queue ID, and AWS Connect Phone Number."
        return event


    #initialize client object for AWS Connect
    client = boto3.client('connect', region_name=aws_region)

    #store the values of QnA Bot session variables
    qnabot_contact_name = event["res"]["session"]["contact_name"]["FirstName"]
    qnabot_contact_phone_number = event["res"]["session"]["contact_phone_number"]["PhoneNumber"]


    #cleaning up phone number
    qnabot_contact_phone_number.replace(" ","")
    qnabot_contact_phone_number.replace("-","")
    qnabot_contact_phone_number.replace("+","")

    #converting into e.164
    qnabot_contact_phone_number = "+1" + qnabot_contact_phone_number

    #logger.info("Will attempt to call: " + QnaBot_contact_phone_number)

    #Amazon Connect outbound call setup
    try:
        client.start_outbound_voice_contact (
            DestinationPhoneNumber = qnabot_contact_phone_number,
            ContactFlowId = aws_connect_contact_flow_id,
            InstanceId = aws_connect_instance_id,
            SourcePhoneNumber = aws_connect_phone_number,
            QueueId = aws_connect_queue_id,
            Attributes = {
                'callerName': qnabot_contact_name
            }
        )
        #logger.info(response)
        return event
    except Exception as e:
        logger.info(e)
        event['res']['message'] = "Hmmm. I had a problem calling you. Sorry about that."
        return event
