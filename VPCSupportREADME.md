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
