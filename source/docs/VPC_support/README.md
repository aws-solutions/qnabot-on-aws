# VPC Support

(QnaBot on AWS version 6.0.0 - May 2024)

This feature allows deployment of QnABot components within VPC infrastructure via a new template downloadable from
[qnabot-on-aws-vpc.template](https://solutions-reference.s3.amazonaws.com/qnabot-on-aws/latest/qnabot-on-aws-vpc.template) or by
referencing the template in S3 using https://solutions-reference.s3.amazonaws.com/qnabot-on-aws/latest/qnabot-on-aws-vpc.template.

__Note:__ Deploying QnABot within a VPC using `qnabot-on-aws-vpc.template` is the recommended method. 
Once QnABot has been deployed with or without VPC, the installation can't be switched. 
It needs to stay in VPC or out of VPC as first configured and can't be switched between the two. 
To switch to a different mode, you would need to perform a fresh install.

Please note that the OpenSearch Cluster is private to the VPC. 
In addition, the QnABot Lambda functions installed by the stack will be attached to subnets in the VPC. 
The Lambdas attached to the VPC allow communication with the cluster.

### Requirements

In order to deploy QnABot within a VPC two requirements must be met:

1. A fully functioning VPC with a minimum of two private subnets spread over two availability zones is required.
   These private VPC subnets should have access to AWS services. 
   This can be accomplished using NAT Gateway with proper IGW configuration / routing. Other third party gateway implementations can be used that provide access to AWS services.
     - if using Sagemaker based [text embeddings](docs/semantic_matching_using_LLM_embeddings/README.md) or [text generation](docs/LLM_Retrieval_and_generative_question_answering/README.md) you will need to create a VPC Gateway Endpoint for S3 (this is __required__ to enable SageMaker to download the model) and a VPC Interface Endpoint for SageMaker (this is _optional_; however, enables invocations of the SageMaker Runtime endpoint to remain on the VPC). 
     Additional resources to help with configuration can be found at:
       - [Give SageMaker Hosted Endpoints Access to Resources in Your Amazon VPC](https://docs.aws.amazon.com/sagemaker/latest/dg/host-vpc.html)
       - [Connect to SageMaker Through a VPC Interface Endpoint](https://docs.aws.amazon.com/sagemaker/latest/dg/interface-vpc-endpoint.html)
       - [AWS PrivateLink pricing](https://aws.amazon.com/privatelink/pricing/)

2. A pre-configured VPC security group that
    1. allows inbound connections on port 443 from other addresses in the VPC CIDR block. 
        For example, if the VPC's CIDR block is 10.178.0.0/16, inbound connections in the security group should be allowed from this CIDR block.
    2. allows outbound connections to 0.0.0.0.

### Deploying Your VPC

To get started in creating a VPC, go to [VPC](https://aws.amazon.com/vpc/) in your AWS Account. 
Make sure you are in the region that you plan to deploy in. 
The official documentation for deploying your VPC and other VPC resources can be found [here](https://docs.aws.amazon.com/vpc/latest/userguide/create-vpc.html#create-vpc-and-other-resources). 
Additionally, make sure to follow [Security best practices for your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html) when deploying your VPC.

### Deployment

Deploying OpenSearch cluster into a VPC requires creating a service linked role for OpenSearch. 
You can execute the following command using credentials for the target account.

```
aws iam create-service-linked-role --aws-service-name opensearchservice.amazonaws.com
```

As mentioned earlier, a separate template is available that supports deployment within a VPC named aws-qnabot-vpc.template. 
You'll find this template alongside the standard qnabot template. 
You can download this template using [qnabot-on-aws-vpc.template](https://solutions-reference.s3.amazonaws.com/qnabot-on-aws/latest/qnabot-on-aws-vpc.template) or reference the template in CloudFormation Launch Stack using https://solutions-reference.s3.amazonaws.com/qnabot-on-aws/latest/qnabot-on-aws-vpc.template.

Launch from this template instead of the standard template.

**Note: Once QnABot has been deployed with or without VPC, the installation can't be switched. 
It needs to stay in VPC or out of VPC as first configured and can't be switched between the two.
To switch to a different mode, you would need to perform a fresh install.**

Two new parameters are required when deploying within a VPC

1. VPCSubnetIdList
    - Select a minimum of two Private Subnets spread over two availability zones. 
    These private subnets must have NAT configured to allow communication with other AWS services. Do not attempt to use public subnets.

2. VPCSecurityGroupIdList
    - Select a pre-configured security group. 
    This security group must enable inbound communication to the OpenSearch cluster on port 443.

Once these are configured, launch the template.

### Behavior of the system after deployment

-   This template attaches the OpenSearch cluster and Lambdas to the private subnets. 
    Communication between these components occurs within the VPC.

-   The OpenSearch Dashboards provided within the OpenSearch cluster is only available
    within the VPC. 
    Users desiring access to the OpenSearch Dashboards must have access via VPN or Direct Connect to the VPC.

-   The API Gateway used by the Designer UI is still available publicly and access is
    still authorized using Cognito. 
    The Lambda's backing the API will run within the VPC.

### Accessing OpenSearch Dashboards in VPC

This template deploys OpenSearch and OpenSearch Dashboards within a VPC's Private Subnets.
By default, there are no means of accessing OpenSearch Dashboards within the VPC's Private Subnets.

However, since OpenSearch Dashboards are already integrated with Cognito for authentication, secure access to the OpenSearch 
Dashboard can be established via a SSH SOCKS5 connection with a host in the VPC, from the admin local machine as described in the 
following steps.

**Prerequisites:**
An EC2 host needs to be used as a bridge between the local user, and OpenSearch Dashboards. 
This EC2 machine needs to be deployed on the Public Subnet of the same VPC that chatbot is deployed. 
The following steps will also attach an ElasticIP to the EC2 host, in order to eliminate the manual process of identifying the
host's IP, each time a SOCKS5 connection is desired.

a. **Create an EC2 host**
Create an EC2 host, and attach it to the VPC of the Chatbot, on a Public Subnet of it. 
Make sure that the EC2 host's Security Group is also the same as the VPC's.
Make sure to securely save the Private.key of the host, so you can SSH into it.
Amazon Linux 2 AMI, with t2.micro is advised.

a.i. **Security Group Rules**

-   Allow the inbound traffic for SSH, from the public IP of the Admin Local Machine.
    If you are behind a trusted network, you can also use the IP/CIDR of your network. 
    Setting the source to `0.0.0.0/0` is not advised, as it will expose you to security risks.
-   Allow the inbound traffic for HTTPS and port 443, on the Security group itself.

b. **ElasticIP**
Create an ElasticIP and associate it with the above EC2 host.

c. **SSH SOCKS5 Tunnel**

From your local machine, create a SOCKS Proxy (The command has been tested successfully in macOS, and Windows/Powershell):

```bash
ssh -i "PRIVATE_KEY_PATH" ec2-user@ELASTIC_IP_ADDRESS -v -ND 9200
```

Note that:

PRIVATE_KEY_PATH : Should be replaced by the path in which you stored the Private.key of the EC2 host from Step a.

ELASTIC_IP_ADDRESS: The ElasticIP created in Step b.

d. **Proxy on browser**
Adjust your browser's Proxy setting, to use the SSH SOCKS tunnel.

d.i. Firefox:

-   From the Hamburger Menu, click Setting/Preferences.
-   Scroll down to `Network Settings` group, and click the `Settings...` button.
-   In the pop up window, select `Manual Proxy configuration`, and `Proxy DNS when using SOCKS v5`.
-   In the SOCKS Host type `127.0.0.1` and at SOCKS Host Port `9200`.
-   Click OK

Note that the above process will redirect all incoming browser's traffic from the Admin Local Machine through the EC2 host.
This is the downside of this approach, as only the public IP enabled in the security group rules in Section a.i. in can access the OpenSearch Dashboard.

d.ii. Chrome:
Chrome uses the Operating System's default Proxy settings, but also has the ability to be launched with pre-defined proxy configurations.

Linux:

```bash
/usr/bin/google-chrome \
    --user-data-dir="$HOME/proxy-profile" \
    --proxy-server="socks5://localhost:9200"
```

macOS

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --user-data-dir="$HOME/proxy-profile" \
    --proxy-server="socks5://localhost:9200"
```

Windows:

```powershell
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" ^
    --user-data-dir="%USERPROFILE%\proxy-profile" ^
    --proxy-server="socks5://localhost:9200"
```

The new Launched Chrome instance, will be independent from the regular Chrome instances, and requires no further manual effort compared to the Firefox Solution.

d.iii. Extra Mentions.
There are plugins such as FoxyProxy and SwitchyOmega which can enable dynamically per domain the usage of a Proxy. 
Example configurations for FoxyProxy:

In the Proxy Details tab, be sure that Manual Proxy Configuration is selected and then complete the following fields:

-   For Host or IP Address, enter localhost.
-   For Port, enter 9200
-   Select SOCKS proxy
-   Select SOCKS v5.
    Choose the URL Patterns tab.
    Choose Add new pattern and then complete the following fields:
    For Pattern Name, enter a identifier of your choise.
    For URL pattern, enter the VPC endpoint for OpenSearch Dashboards. Allow list URLs and Wildcards should be selected. URL pattern should look like: \*VPC-IDENTIFIER.REGION.es.amazonaws.com\*

e. Access OpenSearch Dashboards
From the browser, which has been setup on step d, access the OpenSearch Dashboards endpoint. 
You can find this at the Outputs of your Chatbot CloudFormation deployment.
