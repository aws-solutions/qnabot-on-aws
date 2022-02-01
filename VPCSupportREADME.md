# VPC Support
(version 1.0 - October 2021)

This feature allows deployment of QnABot components within VPC infrastructure via a new template downloadable from 
[aws-qnabot-vpc.template](https://solutions-reference.s3.amazonaws.com/aws-qnabot/latest/aws-qnabot-vpc.template) or by
referencing the template in S3 using https://solutions-reference.s3.amazonaws.com/aws-qnabot/latest/aws-qnabot-vpc.template.

This template is made available for use as a separate installation mechanism. It is not the default template utilized in the
public distribution. Please take care in deploying QnABot in VPC. The Elasticsearch Cluster becomes private to the VPC. In addition,
the QnABot Lambda functions installed by the stack will be attached to subnets in the VPC. The Elasticsearch cluster is no longer available
outside of the VPC. The Lambdas attached to the VPC allow communication with the cluster. 

Two additional parameters are required by this template.

- VPCSubnetIdList (Important Note: two private subnets should be specified spread over two availability zones - see below)
- VPCSecurityGroupIdList (see below)

### Requirements

In order for deployment of QnABot within a VPC two requirements must be met:

1) A fully functioning VPC with a minimum of two private subnets spread over two availability zones is required. 
   These private VPC subnets should have access to AWS services. This can be accomplished using NAT Gateway with proper IGW 
   configuration / routing. Other third party gateway implementations can be used that provide access to AWS services. 
   
2) A pre-configured VPC security group that 
    1) allows inbound connections on port 443 from other addresses in the VPC CIDR block. For example,
       if the VPC's CIDR block is 10.178.0.0/16, inbound connections in the security
       group should be allowed from this CIDR block.
    2) allows outbound connections to 0.0.0.0.
   
### Deployment
Deploying Elasticsearch cluster into a VPC requires creating a service linked role for es. You can execute the following command
using credentials for the target account.

```
aws iam create-service-linked-role --aws-service-name es.amazonaws.com
```

As mentioned earlier, a separate template is available that supports deployment within a VPC named aws-qnabot-vpc.template. You'll find this template
alongside the standard qnabot template. You can download this template using 
[aws-qnabot-vpc.template](https://solutions-reference.s3.amazonaws.com/aws-qnabot/latest/aws-qnabot-vpc.template) or
reference the template in CloudFormation Launch Stack using https://solutions-reference.s3.amazonaws.com/aws-qnabot/latest/aws-qnabot-vpc.template.

Launch from this template instead of the standard template. 

**Note: Once QnABot has been deployed with or without VPC, the installation can't be switched. It needs
to stay in VPC or out of VPC as first configured and can't be switched between the two. 
To switch to a different mode, you would need to perform a fresh install.**

Two new parameters are required when deploying within a VPC

Select a pre-configured security group. This security group must enables inbound communication to 
the Elasticsearch cluster on port 443. 

Select a minimum of two Private Subnets spread over two availability zones. These private
subnets must have NAT configured to allow communication to other AWS services. Do not
attempt to use public subnets.

Once these are configured, launch the template.

### Behavior of the system after deployment

* This template attaches the Elasticsearch cluster and Lambdas to the private subnets. Communication
between these components occurs within the VPC.

* The Kibana dashboard provided within the Elasticsearch cluster is only available
within the VPC. Users desiring access to the Kibana dashboard must have access via
VPN or Direct Connect to the VPC. 

* The API Gateway used by the Designer UI is still available publicly and access is
still authorized using Cognito. The Lambda's backing the API will run within the VPC.

### Accessing Kibana in VPC

This template deploys ElasticSearch and Kibana within a VPC's Private Subnets. By default, there are
no means of accessing kibana, and further actions are required to proceed in doing so.

Since Kibana is already integrated with Cognito for authentication, the following actions can take
place so access can be gained securely to Kibana. The actions revolve at the process of establishing
a SSH SOCKS5 connextion with a host in the VPC, from your local machine.

**Prerequisites:**
An EC2 host needs to be used as a bridge between the local user, and Kibana. This EC2 machine needs to
be deployed on the Public Subnet of the same VPC that chatbot is deployed. The following steps will
also attach an ElasticIP to the EC2 host, in order to eliminate the manual process of identifying the
host's IP, each time a SOCKS5 connection is desired.

a. **Create an EC2 host**
Create an EC2 host, and attach it to the VPC of the Chatbot, on a Public Subnet of it. Make sure that
the EC2 host's Security Group is also the same as the VPC's.
Make sure to securely save the Private.key of the host, so you can SSH into it.
Amazon Linux 2 AMI, with t2.micro is advised.

a.i. **Security Group Rules**

- Allow the inbound traffic for SSH, from the public IP of your Local Machine.
  If you are behind a trusted network, you can also use the IP/CIDR of your network. Setting the source
  to `0.0.0.0/0` is not advised, as it will expose you to security risks.
- Allow the inbound traffic for HTTPS and port 443, on the Security group itself.

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

- From the Hamburger Menu, click Setting/Preferences.
- Scroll down to `Network Settings` group, and click the `Settings...` button.
- In the pop up window, select `Manual Proxy configuration`, and `Proxy DNS when using SOCKS v5`.
- In the SOCKS Host type `127.0.0.1` and at SOCKS Host Port `9200`.
- Click OK

Note that the above process will redirect all your browser's traffic through the EC2 machine. This is the downside of this
approach, as the user needs to manually enable/disable this setting.

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
/usr/bin/google-chrome \
    --user-data-dir="$HOME/proxy-profile" \
    --proxy-server="socks5://localhost:9200"
```

Windows:

```bash
/usr/bin/google-chrome \
    --user-data-dir="$HOME/proxy-profile" \
    --proxy-server="socks5://localhost:9200"
```

The new Launched Chrome instance, will be independent from the regular Chrome instances, and requires no further manual effort compared to the Firefox Solution.

d.iii. Extra Mentions.
There are plugins such as FoxyProxy and SwitchyOmega which can enable dynamically per domain the usage of a Proxy. Example configurations for FoxyProxy:

In the Proxy Details tab, be sure that Manual Proxy Configuration is selected and then complete the following fields:

- For Host or IP Address, enter localhost.
- For Port, enter 9200
- Select SOCKS proxy
- Select SOCKS v5.
  Choose the URL Patterns tab.
  Choose Add new pattern and then complete the following fields:
  For Pattern Name, enter a identifier of your choise.
  For URL pattern, enter the VPC endpoint for Kibana. Whitelist URLs and Wildcards should be selected. URL pattern should look like: \*VPC-IDENTIFIER.REGION.es.amazonaws.com\*

e. Access Kibana
From the browser, which has been setup on step d, access the Kibana dashboard endpoint. You can find this at the Outputs of
your Chatbot CloudFormation deployment.

