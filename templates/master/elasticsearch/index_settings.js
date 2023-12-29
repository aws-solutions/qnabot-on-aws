/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

module.exports = {
    number_of_shards: '1',
    'index.knn': true,
    analysis: {
        filter: {
            english_stop: {
                type: "stop",
                stopwords: "_english_"
            },
            english_keywords: {
                type: "keyword_marker",
                keywords: ["example"]
            },
            english_stemmer: {
                type: "stemmer",
                language: "english"
            },
            english_possessive_stemmer: {
                type: "stemmer",
                language: "possessive_english"
            },
            arabic_stop: {
                type: "stop",
                stopwords: "_arabic_"
            },
            arabic_stemmer: {
                type: "stemmer",
                language: "arabic"
            },
            arabic_keywords: {
                type: "keyword_marker",
                keywords: ["مثال"]
            },
            armenian_stop: {
                type: "stop",
                stopwords: "_armenian_"
            },
            armenian_keywords: {
                type: "keyword_marker",
                keywords: ["օրինակ"]
            },
            armenian_stemmer: {
                type: "stemmer",
                language: "armenian"
            },
            basque_stop: {
                type: "stop",
                stopwords: "_basque_"
            },
            basque_keywords: {
                type: "keyword_marker",
                keywords: ["Adibidez"]
            },
            basque_stemmer: {
                type: "stemmer",
                language: "basque"
            },
            bengali_stop: {
                type: "stop",
                stopwords: "_bengali_"
            },
            bengali_keywords: {
                type: "keyword_marker",
                keywords: ["উদাহরণ"]
            },
            bengali_stemmer: {
                type: "stemmer",
                language: "bengali"
            },
            brazilian_stop: {
                type: "stop",
                stopwords: "_brazilian_"
            },
            brazilian_keywords: {
                type: "keyword_marker",
                keywords: ["exemplo"]
            },
            brazilian_stemmer: {
                type: "stemmer",
                language: "brazilian"
            },
            bulgarian_stop: {
                type: "stop",
                stopwords: "_bulgarian_"
            },
            bulgarian_keywords: {
                type: "keyword_marker",
                keywords: ["пример"]
            },
            bulgarian_stemmer: {
                type: "stemmer",
                language: "bulgarian"
            },
            catalan_elision: {
                type: "elision",
                articles_case: true,
                articles: ["d", "l", "m", "n", "s", "t"]
            },
            catalan_stop: {
                type:       "stop",
                stopwords:  "_catalan_" 
            },
            catalan_keywords: {
                type:       "keyword_marker",
                keywords:   ["example"] 
            },
            catalan_stemmer: {
                type:       "stemmer",
                language:   "catalan"
            },
            czech_stop: {
                type: "stop",
                stopwords: "_czech_"
            },
            czech_keywords: {
                type: "keyword_marker",
                keywords: ["příklad"]
            },
            czech_stemmer: {
                type: "stemmer",
                language: "czech"
            },
            danish_stop: {
                type: "stop",
                stopwords: "_danish_"
            },
            danish_keywords: {
                type: "keyword_marker",
                keywords: ["eksempel"]
            },
            danish_stemmer: {
                type: "stemmer",
                language: "danish"
            },
            dutch_stop: {
                type: "stop",
                stopwords: "_dutch_"
            },
            dutch_stemmer: {
                type: "stemmer",
                language: "dutch"
            },
            dutch_keywords: {
                type: "keyword_marker",
                keywords: ["voorbeeld"]
            },
            dutch_override: {
                type: "stemmer_override",
                rules: ["fiets=>fiets", "bromfiets=>bromfiets", "ei=>eier", "kind=>kinder"]
            },
            estonian_stop: {
                type: "stop",
                stopwords: "_estonian_"
            },
            estonian_keywords: {
                type: "keyword_marker",
                keywords: ["näide"]
            },
            estonian_stemmer: {
                type: "stemmer",
                language: "estonian"
            },
            finnish_stop: {
                type: "stop",
                stopwords: "_finnish_"
            },
            finnish_stemmer: {
                type: "stemmer",
                language: "finnish"
            },
            finnish_keywords: {
                type: "keyword_marker",
                keywords: ["esimerkki"]
            },
            french_elision: {
                type: "elision",
                articles_case: true,
                articles: ["l", "m", "t", "qu", "n", "s", "j", "d", "c",
                    "jusqu", "quoiqu", "lorsqu", "puisqu"]
            },
            french_stop: {
                type: "stop",
                stopwords: "_french_"
            },
            french_keywords: {
                type: "keyword_marker",
                keywords: ["Example"]
            },
            french_stemmer: {
                type: "stemmer",
                language: "light_french"
            },
            galician_stop: {
                type: "stop",
                stopwords: "_galician_"
            },
            galician_keywords: {
                type: "keyword_marker",
                keywords: ["exemplo"]
            },
            galician_stemmer: {
                type: "stemmer",
                language: "galician"
            },
            german_stop: {
                type: "stop",
                stopwords: "_german_"
            },
            german_stemmer: {
                type: "stemmer",
                language: "light_german"
            },
            german_keywords: {
                type: "keyword_marker",
                keywords: ["Beispiel"]
            },
            greek_stop: {
                type: "stop",
                stopwords: "_greek_"
            },
            greek_lowercase: {
                type: "lowercase",
                language: "greek"
            },
            greek_keywords: {
                type: "keyword_marker",
                keywords: ["παράδειγμα"]
            },
            greek_stemmer: {
                type: "stemmer",
                language: "greek"
            },
            hindi_stop: {
                type: "stop",
                stopwords: "_hindi_"
            },
            hindi_stemmer: {
                type: "stemmer",
                language: "hindi"
            },
            hindi_keywords: {
                type: "keyword_marker",
                keywords: ["उदाहरण"]
            },
            hungarian_stop: {
                type: "stop",
                stopwords: "_hungarian_"
            },
            hungarian_keywords: {
                type: "keyword_marker",
                keywords: ["példa"]
            },
            hungarian_stemmer: {
                type: "stemmer",
                language: "hungarian"
            },
            indonesian_stop: {
                type: "stop",
                stopwords: "_indonesian_"
            },
            indonesian_keywords: {
                type: "keyword_marker",
                keywords: ["contoh"]
            },
            indonesian_stemmer: {
                type: "stemmer",
                language: "indonesian"
            },
            irish_hyphenation: {
                type: "stop",
                stopwords: ["h", "n", "t"],
                ignore_case: true
            },
            irish_elision: {
                type: "elision",
                articles: ["d", "m", "b"],
                articles_case: true
            },
            irish_stop: {
                type: "stop",
                stopwords: "_irish_"
            },
            irish_keywords: {
                type: "keyword_marker",
                keywords: ["sampla"]
            },
            irish_lowercase: {
                type: "lowercase",
                language: "irish"
            },
            irish_stemmer: {
                type: "stemmer",
                language: "irish"
            },
            italian_elision: {
                type: "elision",
                articles: ["c", "l", "all", "dall", "dell", "nell", "sull", "coll", "pell", "gl",
                    "agl", "dagl", "degl", "negl", "sugl", "un", "m", "t", "s", "v", "d"],
                articles_case: true
            },
            italian_stop: {
                type: "stop",
                stopwords: "_italian_"
            },
            italian_stemmer: {
                type: "stemmer",
                language: "light_italian"
            },
            italian_keywords: {
                type: "keyword_marker",
                keywords: ["esempio"]
            },
            latvian_stop: {
                type: "stop",
                stopwords: "_latvian_"
            },
            latvian_keywords: {
                type: "keyword_marker",
                keywords: ["piemērs"]
            },
            latvian_stemmer: {
                type: "stemmer",
                language: "latvian"
            },
            lithuanian_stop: {
                type: "stop",
                stopwords: "_lithuanian_"
            },
            lithuanian_keywords: {
                type: "keyword_marker",
                keywords: ["pavyzdys"]
            },
            lithuanian_stemmer: {
                type: "stemmer",
                language: "lithuanian"
            },
            norwegian_stop: {
                type: "stop",
                stopwords: "_norwegian_"
            },
            norwegian_keywords: {
                type: "keyword_marker",
                keywords: ["eksempel"]
            },
            norwegian_stemmer: {
                type: "stemmer",
                language: "norwegian"
            },
            portuguese_stop: {
                type: "stop",
                stopwords: "_portuguese_"
            },
            portuguese_keywords: {
                type: "keyword_marker",
                keywords: ["exemplo"]
            },
            portuguese_stemmer: {
                type: "stemmer",
                language: "light_portuguese"
            },
            romanian_stop: {
                type: "stop",
                stopwords: "_romanian_"
            },
            romanian_keywords: {
                type: "keyword_marker",
                keywords: ["exemplu"]
            },
            romanian_stemmer: {
                type: "stemmer",
                language: "romanian"
            },
            russian_stop: {
                type: "stop",
                stopwords: "_russian_"
            },
            russian_stemmer: {
                type: "stemmer",
                language: "russian"
            },
            russian_keywords: {
                type: "keyword_marker",
                keywords: ["пример"]
            },
            sorani_stop: {
                type:       "stop",
                stopwords:  "_sorani_" 
            },
            sorani_keywords: {
                type:       "keyword_marker",
                keywords:   ["mînak"] 
            },
            sorani_stemmer: {
                type:       "stemmer",
                language:   "sorani"
            },
            spanish_stop: {
                type: "stop",
                stopwords: "_spanish_"
            },
            spanish_stemmer: {
                type: "stemmer",
                language: "light_spanish"
            },
            spanish_keywords: {
                type: "keyword_marker",
                keywords: ["ejemplo"]
            },
            swedish_stop: {
                type: "stop",
                stopwords: "_swedish_"
            },
            swedish_keywords: {
                type: "keyword_marker",
                keywords: ["exempel"]
            },
            swedish_stemmer: {
                type: "stemmer",
                language: "swedish"
            },
            turkish_stop: {
                type: "stop",
                stopwords: "_turkish_"
            },
            turkish_lowercase: {
                type: "lowercase",
                language: "turkish"
            },
            turkish_keywords: {
                type: "keyword_marker",
                keywords: ["örnek"]
            },
            turkish_stemmer: {
                type: "stemmer",
                language: "turkish"
            },
            thai_stop: {
                type: "stop",
                stopwords: "_thai_"
            }
        },
        analyzer: {
            rebuilt_English: {
                type: "custom",
                tokenizer: "standard",
                filter: ["english_possessive_stemmer", "lowercase", "english_stop",
                    "english_keywords", "english_stemmer"], 
            },
            rebuilt_English_unique: {
                type: "custom",
                tokenizer: "standard",
                filter: ["english_possessive_stemmer", "lowercase", "english_stop",
                    "english_keywords", "english_stemmer", "unique"],
            },
            rebuilt_Arabic: {
                tokenizer: "standard",
                filter: ["lowercase", "decimal_digit", "arabic_stop", "arabic_normalization",
                    "arabic_keywords", "arabic_stemmer"], 
            },
            rebuilt_Armenian: {
                tokenizer: "standard",
                filter: ["lowercase", "armenian_stop", "armenian_keywords", "armenian_stemmer"], 
            },
            rebuilt_Basque: {
                tokenizer: "standard",
                filter: ["lowercase", "basque_stop", "basque_keywords", "basque_stemmer"], 
            },
            rebuilt_Bengali: {
                tokenizer: "standard",
                filter: ["lowercase", "decimal_digit", "bengali_keywords", "indic_normalization",
                    "bengali_normalization", "bengali_stop", "bengali_stemmer"], 
            },
            rebuilt_Brazilian: {
                tokenizer: "standard",
                filter: ["lowercase", "brazilian_stop", "brazilian_keywords", "brazilian_stemmer"],   
            },
            rebuilt_Bulgarian: {
                tokenizer: "standard",
                filter: ["lowercase", "bulgarian_stop", "bulgarian_keywords", "bulgarian_stemmer"], 
            },
            rebuilt_Catalan: {
                tokenizer: "standard",
                filter: ["catalan_elision", "lowercase", "catalan_stop", "catalan_keywords", "catalan_stemmer"],   
            },
            rebuilt_Czech: {
                tokenizer: "standard",
                filter: ["lowercase", "czech_stop", "czech_keywords", "czech_stemmer"],   
            },
            rebuilt_Danish: {
                tokenizer: "standard",
                filter: ["lowercase", "danish_stop", "danish_keywords", "danish_stemmer"],   
            },
            rebuilt_Dutch: {
                tokenizer: "standard",
                filter: ["lowercase", "dutch_stop", "dutch_keywords", "dutch_override", "dutch_stemmer"],  
            },
            rebuilt_Estonian: {
                tokenizer: "standard",
                filter: ["lowercase", "estonian_stop", "estonian_keywords", "estonian_stemmer"],   
            },
            rebuilt_Finnish: {
                tokenizer: "standard",
                filter: ["lowercase", "finnish_stop", "finnish_keywords", "finnish_stemmer"],   
            },
            rebuilt_French: {
                tokenizer: "standard",
                filter: ["french_elision", "lowercase", "french_stop", "french_keywords", "french_stemmer"],  
            },
            rebuilt_Galician: {
                tokenizer: "standard",
                filter: ["lowercase", "galician_stop", "galician_keywords", "galician_stemmer"],  
            },
            rebuilt_German: {
                tokenizer: "standard",
                filter: ["lowercase", "german_stop", "german_keywords", "german_normalization", "german_stemmer"],    
            },
            rebuilt_Greek: {
                tokenizer: "standard",
                filter: ["greek_lowercase", "greek_stop", "greek_keywords", "greek_stemmer"],  
            },
            rebuilt_Hindi: {
                tokenizer: "standard",
                filter: ["lowercase", "decimal_digit", "hindi_keywords", "indic_normalization",
                    "hindi_normalization", "hindi_stop", "hindi_stemmer"],     
            },
            rebuilt_Hungarian: {
                tokenizer: "standard",
                filter: ["lowercase", "hungarian_stop", "hungarian_keywords", "hungarian_stemmer"],    
            },
            rebuilt_Indonesian: {
                tokenizer: "standard",
                filter: ["lowercase", "indonesian_stop", "indonesian_keywords", "indonesian_stemmer"],            
            },
            rebuilt_Irish: {
                tokenizer: "standard",
                filter: ["irish_hyphenation", "irish_elision", "irish_lowercase", "irish_stop",
                    "irish_keywords", "irish_stemmer"],               
            },
            rebuilt_Italian: {
                tokenizer: "standard",
                filter:["italian_elision","lowercase","italian_stop","italian_keywords","italian_stemmer"],             
            },
            rebuilt_Latvian: {
                tokenizer: "standard",
                filter: ["lowercase", "latvian_stop", "latvian_keywords", "latvian_stemmer"],             
            },
            rebuilt_Lithuanian: {
                tokenizer: "standard",
                filter: ["lowercase", "lithuanian_stop", "lithuanian_keywords", "lithuanian_stemmer"],              
            },
            rebuilt_Norwegian: {
                tokenizer: "standard",
                filter: ["lowercase", "norwegian_stop", "norwegian_keywords", "norwegian_stemmer"],              
            },
            rebuilt_Portuguese: {
                tokenizer: "standard",
                filter: ["lowercase", "portuguese_stop", "portuguese_keywords", "portuguese_stemmer"],               
            },
            rebuilt_Romanian: {
                tokenizer: "standard",
                filter: ["lowercase", "romanian_stop", "romanian_keywords", "romanian_stemmer"],                
            },
            rebuilt_Russian: {
                tokenizer: "standard",
                filter: ["lowercase", "russian_stop", "russian_keywords", "russian_stemmer"],                
            },
            rebuilt_Sorani: {
                tokenizer: "standard",
                filter: ["sorani_normalization", "lowercase", "decimal_digit", "sorani_stop", "sorani_keywords", "sorani_stemmer"],      
            },
            rebuilt_Spanish: {
                tokenizer: "standard",
                filter: ["lowercase", "spanish_stop", "spanish_keywords", "spanish_stemmer"],               
            },
            rebuilt_Swedish: {
                tokenizer: "standard",
                filter: ["lowercase", "swedish_stop", "swedish_keywords", "swedish_stemmer"],      
            },
            rebuilt_Turkish: {
                tokenizer: "standard",
                filter: ["apostrophe", "turkish_lowercase", "turkish_stop", "turkish_keywords", "turkish_stemmer"],      
            },
            rebuilt_Thai: {
                tokenizer: "thai",
                filter: ["lowercase", "decimal_digit", "thai_stop"],
            }
        }
    }
};
