# Kendra Redirect
QnABot supports multiple mechanisms for dynamic interaction flows such as: 
- using Lambda Hooks in a given Item ID to perform additional actions (such as: creating a ticket, resetting a password, saving data to a data store) 
- using a Kendra Index as a fallback mechanism to look for answers to user's questions

There are cases where a Item ID may want to lookup data in a Amazon Kendra Index directly and provide a response. One mechanism to do that is to create a custom lambda hook and map it to the Item ID. The lambda hook will then include the business logic to use a Kendra Index and process the query. While this is a option that can be used, we wanted to make this easier. 

With the Kendra Redirect feature, you can now include a Kendra query within a Item ID, and QnABot will do the rest to process the Kendra request and respond back with the results. 


## Configuring a Item ID with Kendra Redirect
- To get started, create a QnABot question as you would normally do by providing a `Item ID` and `Questions/Utterances`. 
- Expand the `Advanced` option
- `Kendra Redirect: Query Text` accepts a QueryText to search for (such as: `what is q and a bot`) to retrieve the answer from the Kendra Fallback index specified in Settings. Amazon Kendra searches your index for text content and question and answer (FAQ) content. You can also use handlebars to substitute values using session attributes or slots to support dynamic queries. 
- `Kendra Redirect: Confidence score threshold` provides a relative ranking that indicates how confident Amazon Kendra is that the response matches the query. This is a optional field having one of the values of: `LOW` | `MEDIUM` | `HIGH` | `VERY HIGH`. 
If no value is provided, defaults to the value of setting `ALT_KENDRA_FALLBACK_CONFIDENCE_THRESHOLD`.
- `Kendra query arguments` is a optional field which enables filtered searches based on document attributes. For example: 
`"AttributeFilter": {"EqualsTo": {"Key": "City", "Value": {"StringValue": "Seattle"}}}`. 
You can also use handlebars to substitute values using session attributes or slots to support dynamic queries. 

More information on using Kendra query arguments: https://docs.aws.amazon.com/kendra/latest/dg/API_Query.html

![](./images/kendra_redirect.png)


## Notes
- Answer fields are ignored when KendraRedirect query is used.
- Use this feature for use cases where you have Item ID(s) that directly need to interact with a Kendra Index (as configured in the Settings).
- When applying Kendra query arguments, check if the document fields are searchable. Searchable, determines whether the field is used in the search.
More information: https://docs.aws.amazon.com/kendra/latest/dg/field-mapping.html

