{{#if first}}{{{message}}}{{/if}}{{#if correct}} __Correct__ answer! {{/if}}{{#if incorrect}} Sorry, that was __incorrect__. The correct {{#arrayPlural correctAnswers "answer is" "answers are" }}{{/arrayPlural}}{{#each correctAnswers}} __{{this}}__.{{/each}}{{/if}}. {{message}}
{{#if question}} The {{#if first}}first{{else}}next{{/if}} question is: {{{question}}}  
{{#each answers}}
__{{{this.[2]}}}__. {{{this.[0]}}}  
{{/each}}{{/if}}
{{#if finished}} You got __{{totalCorrect}}__ questions correct out of __{{totalQuestions}}__ with a score of __{{score}}%__. {{message}}{{/if}}
{{#if exit}}
You have now exited the quiz. Ask for __help__ for next steps.
{{/if}}
{{#if invalid}}
Sorry that was an __invalid__ response, the valid responses are{{#each answers}} __{{this}}__{{/each}}.
{{/if}}
