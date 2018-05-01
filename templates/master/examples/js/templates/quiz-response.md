{{#if first}}{{{message}}}{{/if}}{{#if correct}} __Correct__ answer! {{/if}}{{#if incorrect}} Sorry, that was __incorrect__. The Correct answers are{{#each correctAnswers}} __{{this}}__.{{/each}}{{/if}}  
{{#if question}} The {{#if first}}first{{else}}next{{/if}} question is: {{{question}}}  
{{#each answers}}
- {{{this.[2]}}}) {{{this.[0]}}}  
{{/each}}{{/if}}
{{#if finished}} You got __{{totalCorrect}}__ questions correct out of __{{totalQuestions}}__ with a score of __{{score}}%__. Thank you for taking the quiz!{{/if}}
{{#if exit}}
Thank you for taking the quiz, now leaving.
{{/if}}
{{#if invalid}}
Sorry that was an __invalid__ response, the valid responses are{{#each answers}} __{{this}}__{{/each}}.
{{/if}}
