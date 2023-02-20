# Kendra Fallback Function

Provides a Lambda Hook for the no_hits question to search a set of Kendra indexes
as a fallback mechanism to provide answers.

Kendra provides a number of innovative features. This Kendra Fallback function performs a query against a
set of Kendra indexes and will return the first answer that Kendra identifies. Kendra can return multiple
answers however to keep responses limited in scope the first answer is provided through QnABot. Links to
documents stored in S3 buckets that Kendra indexes are also provided. The security of the S3 bucket governs
whether this link is usable. In addition Kendra can return discovered text with links to these documents as well.
This function returns a default of four discovered texts/links. The maximum number of returned links is
configurable.

## Configure Kendra Fallback using the following settings in Content designer Setting page

### ALT\_SEARCH\_KENDRA\_INDEXES

**Required** - A String value that specifies an array of
Kendra indexes to search.
The value of ALT\_SEARCH\_KENDRA\_INDEXES should be either a single index id, or an array of index ids, for example:

```bash
"857710ab-example-do-not-copy" OR ["857710ab-example1-do-not-copy","857710ab-example2-do-not-copy"]
```

#### ALT\_SEARCH\_KENDRA\_MAX\_DOCUMENT\_COUNT

Number - Overrides the maximum number of discovered text links
to display in markdown result. Default is 4.

#### ALT_SEARCH_KENDRA_S3_SIGNED_URLS  
  
If set **true** then if S3 document URL is in the search result, convert to a signed URL.
IMPORTANT: S3 Bucket names must start with qna (e.g. qnabot-mydocs), otherwise make sure IAM Role *...ESProxyLambdaRole...* (used by the Query function) has been granted S3:GetObject access to S3 objects in the Kendra index (otherwise the signed URLS will not have access)

#### ALT\_SEARCH\_KENDRA\_S3\_SIGNED\_URL\_EXPIRE\_SECS  
  
Value determines the expiration of the S3 URL - default 300 seconds.

## Installation

### Step 1

Set the ALT\_SEARCH\_KENDRA\_INDEXES setting in QnABot Designer UI Settings page

### Step 2

Using QnABot Designer UI, use the import menu and expand the Examples/Extensions block. Then look
for the extension named KendraFallback. Load this extension.

### Step 3

Once loaded you will update the question with the qid  "KendraFallback" changing its question from
"no_hits_alternative" to "no_hits".

### Step 4

If you have previously loaded the QnAUtility.json from Examples/Extensions you need to either remove
the question with the ID "CustomNoMatches" or change the question for this ID from "no_hits" to "no_hits_original"

Once the new question, "KendraFallback" is configured as the response for "no_hits", the Kendra index will be
searched for an answer whenever a curated answer can not be found. Once setup, Kendra provides a fallback
mechanism prior to telling the user an answer could not be found.

## Configure QnABot to Kendra Index Authentication Token Pass Through 

### ALT\_SEARCH\_KENDRA\_INDEXES\_TOKEN\_AUTH

**Required** - A String value that specifies true or false
Kendra indexes to search.
The value of ALT\_SEARCH\_KENDRA\_INDEXES\_TOKEN_\_AUTH should be either be false or true, for example:

```bash
false or true
```

Amazon Kendra Indexes support user access control via tokens. This setting enables QnABot to pass an OpenID token that is used for QnABot Client or Lex-Web-UI Client to back-end Kendra indexes to only return Kendra results for which the user is entitled.

For this to work, on the Kendra Index enable "user access control", specify Token type of OpenID with a Signing key URL. On the respective data source configure the appropriate Access Control Lists (ACL).

Within QnABot Settings, specify the following settings:

| Setting | Valid values | Description |
|---------|--------------|--------------|
| IDENTITY_PROVIDER_JWKS_URLS | array of urls |  User can override this empty list to add trusted IdPs (eg from Lex-Web-UI CognitoUserPoolPubKey)
| ALT_SEARCH_KENDRA_INDEXES | An Array of comma separated Ids |  A list of one or more [Amazon Kendra](https://aws.amazon.com/kendra/) indexes used for Kendra fallback
| ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH | true or false |  Enables QnABot to send an OpenID Token to Kendra Index(es) to limit Kendra results to which the user is entitled. This expects the user's token is verified via IDENTITY_PROVIDER_JWKS_URLS resulting in UserIinfo.isVerifiedIdentity = true


The expected path for this configuration is to have the following:
* QnABot IDENTITY_PROVIDER_JWKS_URLS set to a valid signing URL corresponding to the QnABot UI or Lex-Web-UI authentication source.
* QnABot ALT_SEARCH_KENDRA_INDEXES is set to one or more valid Kendra Indexes.
* ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH is set to true.
* Kendra Index configured for "user access control", TokenType = OpenID, and Signing Key URL = (same signing key URL found here IDENTITY_PROVIDER_JWKS_URLS ).
* Kendra data source will have ACLs statements in place to that corresponding to the Username (i.e. cognito:username) or Groups (i.e. cognito:groups).

When the above conditions are met, the Kendra fallback query will evaluate if both _userinfo.IsVerifiedIdenty = true and if ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH = true. When both are true, QnABot Kendra query will pass the idtoken (i.e. idtokenjwt) to each respective Kendra Index.

## Here are some callouts about QnABot and Kendra Index authentication
* If Kendra Index "user access control" is enabled and a valid token is sent, then the Kendra results will reflect the entitlements of the token with the Kendra Data Source ACLs.
* If Kendra Index "user access control" is enabled and  no token is sent, then Kendra results will return only "public content" - i.e. content that is not protected by an ACL.
* If Kendra Index "user access control" is disabled, then ACLs are not honored and all content is eligible to be returned.
* If Kendra Index "user access control" is disabled, and a token is passed, the Kendra Query will fail with access denied and return no results. When user access control is disabled, Kendra does not expect the UserContext.Token attribute to be passed.

### Sample Test Cases
This section provides details on the various use cases that were explored when enabling this feature. 


The settings that are in play:
| Setting | Values | Description |
|---------|--------------|--------------|
|ENFORCE_VERIFIED_IDENTITY |false | false allows for unauthenticated user as well as authenticated.
|IDENTITY_PROVIDER_JWKS_URLS | signing key url| set to appropriate cognito user pool and used to verify the user token is valid. If user is logged in and valid token, then UserInfo.isVerifiedIdentity=true.
|ALT_SEARCH_KENDRA_INDEXES | one or more Kendra Index| Kendra results are compiled from respective Kendra Index(es).
|ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH | true | ffalse is default. true allows QnABot to send idtoken to Kendra.

Some notes about the 8 Use Cases tested using Cognito User Pool with Lex-Web-UI:
* CASE 1 through 4: User is NOT authenticted within Lex-Web-UI.
* CASE 5 through 8: User is authenticated within Lex-Web-UI.
* CASES 1,2 and 5,6 have Kendra Auth Enabled. Cases 3,4 and 7,8 have Kendra Auth Disabled.


The following 8 Use Cases have been explored:
#### CASE 1: Kendra Index has Auth Enabled. isVerifiedIdentity === "false". ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === false.
* User is NOT authenticated. Has no token to send to Kendra.
* QnABot is NOT configured to send a token and user has NO token to send. NO token is sent.
* Kendra Index has auth enabled, but does not require a token to be sent. 
* User will only get public content (not protected by ACLs).

#### CASE 2: Kendra Index has Auth Enabled. isVerifiedIdentity === "false". ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === true. 
* User is NOT authenticated. Has no token to send to Kendra.
* QnABot is configured to send a token but user has NO token to send. NO token is sent.
* Kendra Index has auth enabled, but does not require a token to be sent. 
* User will only get public content (not protected by ACLs).

#### CASE 3: Kendra Index has Auth Disabled. isVerifiedIdentity === "false". ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === false.
* User is NOT authenticated. Has no token to send to Kendra.
* QnABot is NOT configured to send a token and user has NO token to send. NO token is sent.
* Kendra Index has auth disabled. Any Kendra Source ACLs are ignored.
* User will get ALL content from the index since source ACLs are ignored.

#### CASE 4: Kendra Index has Auth Disabled. isVerifiedIdentity === "false". ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === true.
* User is NOT authenticated. Has no token to send to Kendra.
* QnABot is configured to send a token but user has NO token to send. NO token is sent.
* Kendra Index has auth disabled. Any Kendra Source ACLs are ignored.
* User will get ALL content from the index since source ACLs are ignored.

#### CASE 5: Kendra Index has Auth Enabled. isVerifiedIdentity === true. ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === false.
* User is authenticated. User has a token to send to Kendra.
* QnABot is NOT configured to send a token even though user has a token to send. NO token is sent.
* Kendra Index has auth enabled, but does not require a token to be sent. 
* User will only get content not protected by ACLs.

### * CASE 6: [EXPECTED PATH] Kendra Index has Auth Enabled. isVerifiedIdentity === "true". ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === true.
* User is authenticated. User has a token to send to Kendra.
* QnABot is configured to send a token and user has a token to send. An idtoken is sent to Kendra Index query.
* Kendra Index has auth enabled, but does not require a token to be sent. 
* User will only get public and private content based on their entitlements as protected by ACLs.

#### CASE 7: Kendra Index has Auth Disabled. isVerifiedIdentity === true. ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === false.
* User is authenticated. User has a token to send to Kendra.
* QnABot is NOT configured to send a token even though user has a token to send. NO token is sent.
* Kendra Index has auth disabled. Any Kendra Source ACLs are ignored.
* User will get ALL content from the index since source ACLs are ignored.

#### CASE 8: Kendra Index has Auth Disabled. isVerifiedIdentity === "true". ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH === true.
* User is authenticated. User has a token to send to Kendra.
* QnABot is configured to send a token and user has a token to send. An idtoken is sent to Kendra Index query.
* Kendra Index has auth disabled. Any Kendra Source ACLs are ignored.
* User will get no response as Kendra exception is thrown.