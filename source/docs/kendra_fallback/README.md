# Kendra Fallback Function

This feature searches a set of Kendra indexes as a fallback mechanism to provide answers when an answer is not found in OpenSearch.

Kendra provides a number of innovative features. This Kendra Fallback function performs a query against a
set of Kendra indexes and will return the first answer that Kendra identifies. Kendra can return multiple
answers however to keep responses limited in scope the first answer is provided through QnABot. In addition to providing the generated answers, it provides [signed S3 URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) to relevant documents stored in Amazon S3 buckets that Kendra return in its response. These signed URLs are a secure way to grant temporary access to specific objects or resources within an Amazon S3 bucket. This function returns a default of four discovered texts/links. The maximum number of returned links is configurable.

## Configure Kendra Fallback index using the following Cloudformation parameter

### AltSearchKendraIndexes

**Required** - A comma separated String value that specifies an array of Kendra indexes to search.
For example:

```bash
"857710ab-example-do-not-copy" OR "857710ab-example1-do-not-copy,857710ab-example2-do-not-copy"
```

## Configure Kendra Fallback using the following settings in Content designer 

### ALT\_SEARCH\_KENDRA\_MAX\_DOCUMENT\_COUNT

Number - Overrides the maximum number of discovered text links
to display in markdown result. Default is 4.

### ALT_SEARCH_KENDRA_S3_SIGNED_URLS  
  
If set **true** then if S3 document URL is in the search result, convert to a signed URL.
IMPORTANT: S3 Bucket names must start with qna (e.g. qnabot-mydocs), otherwise make sure IAM Role *...ESProxyLambdaRole...* (used by the Query function) has been granted S3:GetObject access to S3 objects in the Kendra index (otherwise the signed URLS will not have access)

### ALT\_SEARCH\_KENDRA\_S3\_SIGNED\_URL\_EXPIRE\_SECS  
  
Value determines the expiration of the S3 URL - default 300 seconds.

## Configure QnABot to Kendra Index Authentication Token Pass Through 

Amazon Kendra Indexes support user access control via tokens. This setting enables QnABot to pass an OpenID token that is used for QnABot Client or Lex-Web-UI Client to back-end Kendra indexes to only return Kendra results for which the user is entitled.

For this to work, on the Kendra Index enable "user access control", specify Token type of OpenID with a Signing key URL. On the respective data source configure the appropriate Access Control Lists (ACL).

Within QnABot CloudFormation Settings, specify the following settings:
| Setting | Valid values | Description |
|---------|--------------|--------------|
| AltSearchKendraIndexes | An Array of comma separated Ids |  A list of one or more [Amazon Kendra](https://aws.amazon.com/kendra/) indexes used for Kendra fallback
| AltSearchKendraIndexAuth | true or false |  Enables QnABot to send an OpenID Token to Kendra Index(es) to limit Kendra results to which the user is entitled. This expects the user's token is verified via IDENTITY_PROVIDER_JWKS_URLS resulting in Userinfo.isVerifiedIdentity = true

Within QnABot Settings, specify the following settings:

| Setting | Valid values | Description |
|---------|--------------|--------------|
| IDENTITY_PROVIDER_JWKS_URLS | array of urls |  User can override this empty list to add trusted IdPs (eg from Lex-Web-UI CognitoUserPoolPubKey)

The expected path for this configuration is to have the following:
* QnABot IDENTITY_PROVIDER_JWKS_URLS set to a valid signing URL corresponding to the QnABot UI or Lex-Web-UI authentication source.
* QnABot AltSearchKendraIndexes is set to one or more valid Kendra Indexes.
* AltSearchKendraIndexAuth is set to true.
* Kendra Index configured for "user access control", TokenType = OpenID, and Signing Key URL = (same signing key URL found here IDENTITY_PROVIDER_JWKS_URLS ).
* Kendra data source will have ACLs statements in place to that corresponding to the Username (i.e. cognito:username) or Groups (i.e. cognito:groups).

When the above conditions are met, the Kendra fallback query will evaluate if both _userinfo.IsVerifiedIdenty = true and if AltSearchKendraIndexAuth = true. When both are true, QnABot Kendra query will pass the idtoken (i.e. idtokenjwt) to each respective Kendra Index.

## Here are some callouts about QnABot and Kendra Index authentication
* If Kendra Index "user access control" is enabled and a valid token is sent, then the Kendra results will reflect the entitlements of the token with the Kendra Data Source ACLs.
* If Kendra Index "user access control" is enabled and  no token is sent, then Kendra results will return only "public content" - i.e. content that is not protected by an ACL.
* If Kendra Index "user access control" is disabled, then ACLs are not honored and all content is eligible to be returned.
* If Kendra Index "user access control" is disabled, and a token is passed, the Kendra Query will fail with access denied and return no results. When user access control is disabled, Kendra does not expect the UserContext.Token attribute to be passed.