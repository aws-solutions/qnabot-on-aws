# Import Lambda
This lambda reads current QnAs from elasticsearch using the same processing as the 
export function and then performs a test validation against each question defined in the qna
against the current lex bot.

The lambda is invoked by the test all function available within the designer UI.

The resulting CSV can be downloaded and contains the following columns:

Match(Yes/No), Question, Topic, QID, Returned QID, Returned Message

First column indicates if the resulting answer came from the expected question id. 

If processing results in an error, the last column will also contain the error observed by 
the system. 



