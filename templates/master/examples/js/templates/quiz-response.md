{{#if correct}} __Correct__ answer! {{/if}}{{#if incorrect}} Sorry, that was __incorrect__. The Correct answers are{{#each correctAnswers}} __{{this}}__.{{/each}}{{/if}}  
{{#if question}} The {{#if first}}first{{else}}next{{/if}} question is: {{{question}}}  
{{#each answers}}
- {{{this.[2]}}}) {{{this.[0]}}}  
{{/each}}{{/if}}
{{#if finished}} You got __{{totalCorrect}}__ questions correct out of __{{totalQuestions}}__ with a score of __{{score}}%__. Thank you for taking the quiz!{{/if}}
