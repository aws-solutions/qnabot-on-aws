import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    #logger.info(event)

    #checking for Lambda Hook Arguments from QnA Bot
    if (event["res"]["result"]["args"]):
        argObject = json.loads(event["res"]["result"]["args"][0])
        AWS_region = argObject["AWS_region"]
        AWS_connect_instance_id = argObject["AWS_connect_instance_id"]
        AWS_connect_contact_flow_id = argObject["AWS_connect_contact_flow_id"]
        AWS_connect_queue_id = argObject["AWS_connect_queue_id"]
        AWS_connect_phone_number = argObject["AWS_connect_phone_number"]
    else:
        event["res"]["message"] = "Your Lambda hook function in the QnA Bot designer is missing Lambda Hook Arguments. Include the values for the following parameters and values in a JSON string: " \
                                  "AWS Region, AWS Connect Instance ID, AWS Connect Contact Flow ID, AWS Connect Queue ID, and AWS Connect Phone Number."
        return event


    #initialize client object for AWS Connect
    client = boto3.client('connect', region_name=AWS_region)

    #store the values of QnA Bot session variables
    QnaBot_contact_name = event["res"]["session"]["contact_name"]["FirstName"]
    QnaBot_contact_phone_number = event["res"]["session"]["contact_phone_number"]["PhoneNumber"]


    #cleaning up phone number
    QnaBot_contact_phone_number.replace(" ","")
    QnaBot_contact_phone_number.replace("-","")
    QnaBot_contact_phone_number.replace("+","")

    #converting into e.164
    QnaBot_contact_phone_number = "+1" + QnaBot_contact_phone_number

    #logger.info("Will attempt to call: " + QnaBot_contact_phone_number)

    #Amazon Connect outbound call setup
    try:
        response = client.start_outbound_voice_contact (
            DestinationPhoneNumber = QnaBot_contact_phone_number,
            ContactFlowId = AWS_connect_contact_flow_id,
            InstanceId = AWS_connect_instance_id,
            SourcePhoneNumber = AWS_connect_phone_number,
            QueueId = AWS_connect_queue_id,
            Attributes = {
                'callerName': QnaBot_contact_name
            }
        )
        #logger.info(response)
        return event
    except Exception as e:
        logger.info(e)
        event['res']['message'] = "Hmmm. I had a problem calling you. Sorry about that."
        return event
