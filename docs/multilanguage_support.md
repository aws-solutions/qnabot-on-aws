# MultiLanguage Support

QnABot supports both voice and text interactions in multiple languages. QnABot can detect the predominant language in an interaction by using Amazon Comprehend, a natural language processing (NLP) service that uses machine learning to find insights and relationships in text. The bot then uses Amazon Translate, a neural machine translation service to convert questions and answers across languages from a single shared set of FAQs and documents.

By default the multi language feature is disabled. QnABot uses a property named `ENABLE_MULTI_LANGUAGE_SUPPORT`, default value of `false`. You can change this setting using the Content Designer Settings page. Set it to `true` to enable multi language support.

QnABot converts the question posed by the user to English, using Amazon Translate, and performs a lookup of the answer in  Amazon OpenSearch Service (successor to Amazon Elasticsearch Service) just as it normally does, using the English translation of the question. Searches are done in English only since QnABot documents are indexed using the English text analyzer (stemming, stop words, etc.)
Once it finds the question, QnABot will serve up the configured answer.

You can also import the sample or extension named Language / Multiple Language Support from the QnABot Import menu option.
This adds two questions to the system: Language.000 and Language.001. The first question allows the end user to set their preferred language explicitly; the latter resets the preferred language and allow QnABot to choose the locale based on the automatically detected predominant language.


## Using Voice to interact
When deploying the AWS QnABot solution (version 4.7.0 and higher) CloudFormation template, you will see a parameter `LexV2BotLocaleIds`. This parameter is used to support users to interact with the bot using voice in the configured languages.

`LexV2BotLocaleIds` — enter one or more of the language codes (with multiple values separated by comma without any spaces. Such as: en_US,es_US,es_ES,fr_FR). For a list of supported languages, see [Supported Languages](#supported-languages) section below.

QnABot can automatically generate additional Automatic Speech Recognition (ASR) training data for Amazon Lex using questions from all the items you have added. QnABot also automatically generates LexV2 ASR training data in multiple languages using Amazon Translate, for each LexV2 locale specified during installation. In addition to this out-of-the-box capability, you can also further improve and fine-tune ASR accuracy, by creating your own language specific questions into the Content Designer.
Once you have added the language specific questions, choose `LEX REBUILD` from the top right edit card menu. This will re-train Amazon Lex using the newly added questions as training data.


## Setting up alternate curated answers in a different language
If you do not explicitly define an answer in the user's language, QnABot will automatically use Amazon Translate to convert the default English. answer to the target language.
However, you might need to provide a more natural experience and want to add a curated answer in the native language of your choice. To further customize the translation for each question, you can use the {{handlebar}} functionality. QnABot provides the {{handlebar}} function `ifLang`, which takes the locale as a quoted parameter. For a list of supported languages, see [Supported Languages](#supported-languages) section below.

For example, to customize the translation in Spanish, the ifLang function uses es as the locale parameter.
```
{{#ifLang 'es'}}
          Su traducción al español
{{/ifLang}}

Additionally, if an unknown language is detected, you can support that with a default response by using the defaultLang function.

{{#defaultLang}}
          Your default language answer
{{/defaultLang}}
```



For additional information, take a look at our blog post on [Building a multilingual question and answer bot with Amazon Lex](https://aws.amazon.com/blogs/machine-learning/building-a-multilingual-question-and-answer-bot-with-amazon-lex/)





## Supported Languages

### Using Voice for interaction
(one or more of the below codes can be used in the `LexV2BotLocaleIds` Cloudformation parameter. Separate multiple values by comma without any spaces. Such as: `en_US,es_US,es_ES,fr_FR`)

|Code   |Language and locale                 |
|-------|------------------------------------|
|ar_AE  |Gulf Arabic (United Arab Emirates)* |
|de_AT  |German (Austria)                    |
|de_DE  |German (Germany)                    |
|en_AU  |English (Australia)                 |
|en_GB  |English (UK)                        |
|en_IN  |English (India)                     |
|en_US  |English (US)                        |
|en_ZA  |English (South Africa)              |
|es_419 |Spanish (Latin America)             |
|es_ES  |Spanish (Spain)                     |
|es_US  |Spanish (US)                        |
|fi_FI  |Finnish (Finland)*                  |
|fr_CA  |French (Canada)                     |
|fr_FR  |French (France)                     |
|hi_IN  |Hindi (India)*                      |
|it_IT  |Italian (Italy)                     |
|ja_JP  |Japanese (Japan)                    |
|ko_KR  |Korean (Korea)                      |
|nl_NL  |Dutch (Netherlands)*                |
|no_NO  |Norwegian (Norway)*                 |
|pl_PL  |Polish (Poland)*                    |
|pt_BR  |Portuguese (Brazil)*                |
|pt_PT  |Portuguese (Portugal)*              |
|sv_SE  |Swedish (Sweden)*                   |
|zh_CN  |Mandarin (PRC)*                     |
|zh_HK  |Cantonese (HK)*                     |


`* Language and locale not available in Asia Pacific (Singapore) (ap-southeast-1) and Africa (Cape Town) (ap-south-1) AWS regions`


### Using Text for interaction
When using text for interacting with the Bot, the following languages are supported.
These language codes can also be used via the handlebar functionality.

|Language              |Language Code|
|----------------------|-------------|
|Afrikaans             |af           |
|Albanian              |sq           |
|Amharic               |am           |
|Arabic                |ar           |
|Armenian              |hy           |
|Azerbaijani           |az           |
|Bengali               |bn           |
|Bosnian               |bs           |
|Bulgarian             |bg           |
|Catalan               |ca           |
|Chinese               |zh           |
|Chinese (Simplified)  |zh           |
|Chinese (Traditional) |zh-TW        |
|Creole                |ht           |
|Croatian              |hr           |
|Czech                 |cs           |
|Danish                |da           |
|Dari                  |fa-AF        |
|Dutch                 |nl           |
|English               |en           |
|Estonian              |et           |
|Farsi (Persian)       |fa           |
|Filipino, Tagalog     |tl           |
|Finnish               |fi           |
|French                |fr           |
|French (Canada)       |fr-CA        |
|Georgian              |ka           |
|German                |de           |
|Greek                 |el           |
|Gujarati              |gu           |
|Haitian Creole        |ht           |
|Hausa                 |ha           |
|Hebrew                |he           |
|Hindi                 |hi           |
|Hungarian             |hu           |
|Icelandic             |is           |
|Indonesian            |id           |
|Irish                 |ga           |
|Italian               |it           |
|Japanese              |ja           |
|Kannada               |kn           |
|Kazakh                |kk           |
|Korean                |ko           |
|Latvian               |lv           |
|Lithuanian            |lt           |
|Macedonian            |mk           |
|Malay                 |ms           |
|Malayalam             |ml           |
|Maltese               |mt           |
|Marathi               |mr           |
|Mongolian             |mn           |
|Norwegian             |no           |
|Pashto                |ps           |
|Persian               |fa           |
|Polish                |pl           |
|Portuguese            |pt           |
|Portuguese (Portugal) |pt-PT        |
|Punjabi               |pa           |
|Romanian              |ro           |
|Russian               |ru           |
|Serbian               |sr           |
|Sinhala               |si           |
|Slovak                |sk           |
|Slovenian             |sl           |
|Somali                |so           |
|Spanish               |es           |
|Spanish (Mexico)      |es-MX        |
|Swahili               |sw           |
|Swedish               |sv           |
|Tagalog               |tl           |
|Tamil                 |ta           |
|Telugu                |te           |
|Thai                  |th           |
|Turkish               |tr           |
|Ukrainian             |uk           |
|Urdu                  |ur           |
|Uzbek                 |uz           |
|Vietnamese            |vi           |
|Welsh                 |cy           |