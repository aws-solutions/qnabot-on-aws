# MultiLanguage Support

QnABot version 2.6.0 supports use of multiple languages with these limitations:

- MultiLanguage support for voice is limited to use with Alexa skills only. (Amazon Lex currently supports voice recognition in English only)
- MutiLanguage support for text is available via all text clients (e.g. Lex Web UI, SMS, etc.)

 ####Lex (text mode only):  

If the user enters a question in a language other than english, QnABot will attempt to return an answer in the other language.
It does this by using Amazon Comprehend to identify the language typed. If Comprehend can identify the language based on a configured minimum confidence,
QnABot will serve up content based on that locale.

Users can also set a preferred language whereby QnABot will always attempt to respond with content in the chosen
locale.  If the user sets the preferred language to be Spanish, QnABot will always try and serve up content using
Spanish when possible.

## Alexa (voice)

You will need to add each language you want to use to your QnABot skill using the Alexa Developer console. The intent schema for each
language will be identical except for the skill invocation name. Give the skill a unique invocation name for each language that you add.

QnABot will use the language setting provided by Alexa, and will attempt to respond in that language.

## How it works

QnABot converts the question posed by the user to English, using Amazon Translate, and performs a lookup of the answer in Elastic Search
just as it normally does, using the English translation of the question. ElasticSearch searches are done in English only since QnABot documents
are indexed using the English text analyzer (stemming, stop words, etc.)

To ensure good matching of translated questions, you can use the Amazon Translate console to see the English translation of your local language question. Use QnABot content designer
to ensure your QnA item has the right sample questions to ensure a match.

Once it finds the question, QnABot will serve up the configured answer.

You can use Handlebar blocks to define explicit answers in each different language you want to support. OR, if you do not
explicitly define an answer in the user's language, QnABot will automatically use Amazon Translate to convert the default English.
answer to the target language.

## Configuration

By default this feature is disabled. Use the following three steps to enable and configure this feature. Step 1 enables the feature. Step 2 loads in two questions from this extension that allow the user to select a preferred language. The defaults supplied in this question are English, Spanish, French, German, and Italian. You can extend this list to
support other languages.

Step 1) Enable multi language support

a) QnABot uses a property named ENABLE_MULTI_LANGUAGE_SUPPORT, default value of "false".
You can change this setting using the Content Designer Settings page. Set it to "true" to enable multi language support.

Step 2) Use the Designer UI to import the Sample/Extension named Language / Multiple Language Support.

This will add two questions to the system: Language.000 and Language.001. When using Lex text clients, these questions will allow you to set your preferred language.  
The preferred language, if set, will take precedence over
the auto detected language.  

_When using Alexa, the language is automatically set by the skill. You will not be able to override the preferred language when using Alexa._

Language.000 provides a question that allows the user to set the current sessions preferred output saying a simple word
such as French, German, or Spanish, or Italian.

Language.001 resets the preferred language. This can be performed by saying or typing 'reset language' or 'detect language'.
You can also input using your language of choice assuming AWS Translate can translate the input back to English.

Once you've imported this extension question try typing the question 'Spanish'. You should see a Spanish response.

Next enter 'English' and you will have switched your preference back to English.

Next enter 'reset language' and your preference will be reset and language auto detection will occur again.

The answer for Language.000 uses the following handlebar syntax

```handlebars
{{#setLang 'fr' false}} D'accord. J'ai défini votre langue préférée sur l'anglais. {{/setLang}}
{{#setLang 'es' false}} Okay. He configurado tu idioma preferido al inglés.  {{/setLang}}
{{#setLang 'de' false}} In Ordnung. Ich habe Ihre bevorzugte Sprache auf Englisch eingestellt. {{/setLang}}
{{#setLang 'it' false}} Ok. Ho impostato la tua lingua preferita sull'inglese.{{/setLang}}
{{#setLang 'en' true}} Ok. I've set your preferred language to English. {{/setLang}}
```

The helper function setLang performs the necessary processing to set the preferred language/locale for the session. To
add support for other languages just extend the answer in Language.000 with additional locales.

Step 3) In order to serve up content that is locale specific you can

- allow QnABot to automatically translate your english answers to the session language using Amazon Translate.
- OR provide explicitly curated answers in QnA items, in multiple languages, using handlebars, as shown below.

Lets modify the question sun.1. The following would be an example where the handlebar function ifLang is used to specify a response for Spanish.

Use the handlebar template defaultLang to specify the response QnABot should provide when the language is unknown. By
default this is typically in English but could be in any language as needed.

`{{#defaultLant}}{{/defaultLang}}` must be the last element in the answer block.

```handlebars
{{#ifLang 'es'}}
Nuestro sol tiene 4.600 millones de años. Se considera una enana amarilla con un diámetro de 1,392,684 kilómetros y una circunferencia de 4,370,005 kilómetros. Tiene una masa que es igual a 333,060 tierras y una temperatura superficial de 5,500 grados centígrados. ¡Muy caliente!
{{/ifLang}}
{{#defaultLang}}
Our sun is 4.6 billion years old. Its considered a yellow dwarf with a diameter of 1,392,684 kilometers and a circumference of 4,370,005 kilometers. It has a mass that is equal to 333,060 earths and a surface temperature of 5,500 degrees celsius. Really Hot!
{{/defaultLang}}
```

The handlebar function ifLang takes locale as a quoted parameter. This tells QnABot which locale to associate with the subsequent
text.