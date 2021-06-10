# New Connect Callback Example

New example demonstrating how QnABot can be asked by a user for a live agent based phone callback. The
implementation provides a new LambdaHook example as well as four sample questions that ask a user for
their name and phone number prior to handing off to an Amazon Connect instance to initiate the callback.

**Two configuration updates are required to use this example with Amazon Connect.**

The IAM Role/Policy used by the ConnectCallback Lambda must include a new policy that allows
the action "connect:StartOutboundVoiceContact" to be used with the resource
`"arn:aws:connect:*:*:instance/<YourConnectInstanceId>/*"`. The following is an example of this policy

```json
{
   "Version": "2012-10-17",
   "Statement": [
       {
           "Sid": "VisualEditor0",
           "Effect": "Allow",
           "Action": "connect:StartOutboundVoiceContact",
           "Resource": "arn:aws:connect:*:*:instance/<YourConnectInstanceId>/*"
       }
   ]
}
```

1) Find the Lambda ConnectCallback Function in the AWS Lambda Console
2) Open the AWS Console and select the Lambda Service
3) In the Console's filter enter 'ConnectCallback' and press enter
4) The displayed function will start with `<stackname>-ExamplePYTHONLambdaConne...` If you have multiple QnABot stacks
installed you'll see multiple functions listed
5) Open the Lambda function by clicking on the function
6) Select the Permissions tab
7) Click on the Role name to open this Role in a new tab
8) Click on + Add inline policy
9) Select the JSON tab
10) Copy the sample text above, paste as JSON, and change `<YourConnectInstanceId>` to the Instance ID identified in the Connect Console.
11) Click on Review policy
12) Enter a name for the policy and click Create policy

You've now enabled Lambda functions using this role to start outbound calls via the connect instance

Lambda Hook Arguments need to be updated. Before being used, the item with qid CONNECT_TO_AGENT.04
should have its Arguments field adjusted to reflect identifiers from the Connect instance:

```bash
"AWS_connect_instance_id": "<your-connect-instance-id >",
"AWS_connect_contact_flow_id": "<your-connect-contact-flow-id>", 
"AWS_connect_queue_id": "<your-connect-queue-id>", 
```

Once these configuration changes are in place, QnABot can be successfully use Amazon Connect to place
outbound calls.
