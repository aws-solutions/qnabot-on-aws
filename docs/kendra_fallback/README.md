# Kendra Fallback Function

This feature searches a set of Kendra indexes as a fallback mechanism to provide answers when an answer is not found in OpenSearch.

Kendra provides a number of innovative features. This Kendra Fallback function performs a query against a
set of Kendra indexes and will return the first answer that Kendra identifies. Kendra can return multiple
answers however to keep responses limited in scope the first answer is provided through QnABot. Links to
documents stored in S3 buckets that Kendra indexes are also provided. The security of the S3 bucket governs whether this link is usable. In addition Kendra can return discovered text with links to these documents as well. This function returns a default of four discovered texts/links. The maximum number of returned links is configurable.

## Configure Kendra Fallback using the following settings in Content designer Setting page

### ALT\_SEARCH\_KENDRA\_INDEXES

**Required** - A String value that specifies an array of
Kendra indexes to search.
The value of ALT\_SEARCH\_KENDRA\_INDEXES should be either a single index id, or an array of index ids, for example:

```bash
"857710ab-example-do-not-copy" OR ["857710ab-example1-do-not-copy","857710ab-example2-do-not-copy"]
```

### ALT\_SEARCH\_KENDRA\_MAX\_DOCUMENT\_COUNT

Number - Overrides the maximum number of discovered text links
to display in markdown result. Default is 4.

### ALT_SEARCH_KENDRA_S3_SIGNED_URLS  
  
If set **true** then if S3 document URL is in the search result, convert to a signed URL.
IMPORTANT: S3 Bucket names must start with qna (e.g. qnabot-mydocs), otherwise make sure IAM Role *...ESProxyLambdaRole...* (used by the Query function) has been granted S3:GetObject access to S3 objects in the Kendra index (otherwise the signed URLS will not have access)

### ALT\_SEARCH\_KENDRA\_S3\_SIGNED\_URL\_EXPIRE\_SECS  
  
Value determines the expiration of the S3 URL - default 300 seconds.
