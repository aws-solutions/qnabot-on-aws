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

const supportedLanguages = {
    Afrikaans: 'af',
    Albanian: 'sq',
    Amharic: 'am',
    Arabic: 'ar',
    Armenian: 'hy',
    Azerbaijani: 'az',
    Bengali: 'bn',
    Bosnian: 'bs',
    Bulgarian: 'bg',
    Catalan: 'ca',
    Chinese: 'zh',
    'Chinese (Simplified)': 'zh',
    'Chinese (Traditional)': 'zh-TW',
    Creole: 'ht',
    Croatian: 'hr',
    Czech: 'cs',
    Danish: 'da',
    Dari: 'fa-AF',
    Dutch: 'nl',
    English: 'en',
    Estonian: 'et',
    'Farsi (Persian)': 'fa',
    'Filipino, Tagalog': 'tl',
    Finnish: 'fi',
    French: 'fr',
    'French (Canada)': 'fr-CA',
    Georgian: 'ka',
    German: 'de',
    Greek: 'el',
    Gujarati: 'gu',
    'Haitian Creole': 'ht',
    Hausa: 'ha',
    Hebrew: 'he',
    Hindi: 'hi',
    Hungarian: 'hu',
    Icelandic: 'is',
    Indonesian: 'id',
    Irish: 'ga',
    Italian: 'it',
    Japanese: 'ja',
    Kannada: 'kn',
    Kazakh: 'kk',
    Korean: 'ko',
    Latvian: 'lv',
    Lithuanian: 'lt',
    Macedonian: 'mk',
    Malay: 'ms',
    Malayalam: 'ml',
    Maltese: 'mt',
    Marathi: 'mr',
    Mongolian: 'mn',
    Norwegian: 'no',
    Pashto: 'ps',
    Persian: 'fa',
    Polish: 'pl',
    Portuguese: 'pt',
    'Portuguese (Portugal)': 'pt-PT',
    Punjabi: 'pa',
    Romanian: 'ro',
    Russian: 'ru',
    Serbian: 'sr',
    Sinhala: 'si',
    Slovak: 'sk',
    Slovenian: 'sl',
    Somali: 'so',
    Spanish: 'es',
    'Spanish (Mexico)': 'es-MX',
    Swahili: 'sw',
    Swedish: 'sv',
    Tagalog: 'tl',
    Tamil: 'ta',
    Telugu: 'te',
    Thai: 'th',
    Turkish: 'tr',
    Ukrainian: 'uk',
    Urdu: 'ur',
    Uzbek: 'uz',
    Vietnamese: 'vi',
    Welsh: 'cy',
};

const languageErrorMessages = {
    af: {
        language: 'Afrikaans',
        errorMessage: 'Jammer, die aangevraagde taal is nie beskikbaar nie.',
    },
    am: {
        language: 'Amharic',
        errorMessage: 'ይቅርታ የተጠየቀው ቋንቋ አይገኝም።',
    },
    ar: {
        language: 'Arabic',
        errorMessage: 'عذرا، اللغة المطلوبة غير متوفرة.',
    },
    az: {
        language: 'Azerbaijani',
        errorMessage: 'Bağışlayın, tələb olunan dil mövcud deyil.',
    },
    bg: {
        language: 'Bulgarian',
        errorMessage: 'За съжаление, заявеният език не е наличен.',
    },
    bn: {
        language: 'Bengali',
        errorMessage: 'দুঃখিত, অনুরোধকৃত ভাষা উপলব্ধ নয়।',
    },
    bs: {
        language: 'Bosnian',
        errorMessage: 'Žao nam je, traženi jezik nije dostupan.',
    },
    ca: {
        language: 'Catalan',
        errorMessage: 'Ho sentim, l\'idioma sol·licitat no està disponible.',
    },
    cs: {
        language: 'Czech',
        errorMessage: 'Je nám líto, požadovaný jazyk není k dispozici.',
    },
    cy: {
        language: 'Welsh',
        errorMessage: 'Mae\'n ddrwg gennym, nid yw\'r iaith y gofynnwyd amdani ar gael.',
    },
    da: {
        language: 'Danish',
        errorMessage: 'Beklager, det ønskede sprog er ikke tilgængeligt.',
    },
    de: {
        language: 'German',
        errorMessage: 'Leider ist die gewünschte Sprache nicht verfügbar.',
    },
    el: {
        language: 'Greek',
        errorMessage: 'Λυπούμαστε, η γλώσσα που ζητήθηκε δεν είναι διαθέσιμη.',
    },
    en: {
        language: 'English',
        errorMessage: 'Sorry, the requested language is not available.',
    },
    es: {
        language: 'Spanish',
        errorMessage: 'Lo sentimos, el idioma solicitado no está disponible.',
    },
    'es-MX': {
        language: 'Spanish (Mexico)',
        errorMessage: 'Lo sentimos, el idioma solicitado no está disponible.',
    },
    et: {
        language: 'Estonian',
        errorMessage: 'Vabandame, soovitud keel pole saadaval.',
    },
    fa: {
        language: 'Farsi (Persian)',
        errorMessage: 'متأسفانه زبان درخواستی در دسترس نیست.',
    },
    'fa-AF': {
        language: 'Dari',
        errorMessage: 'متأسفانه زبان درخواست شده در دسترس نیست.',
    },
    fi: {
        language: 'Finnish',
        errorMessage: 'Pyydettyä kieltä ei valitettavasti ole saatavilla.',
    },
    fr: {
        language: 'French',
        errorMessage: 'Désolé, la langue demandée n\'est pas disponible.',
    },
    'fr-CA': {
        language: 'French (Canada)',
        errorMessage: 'Désolé, la langue demandée n\'est pas disponible.',
    },
    ga: {
        language: 'Irish',
        errorMessage: 'Tá brón orm, níl an teanga iarrtha ar fáil.',
    },
    gu: {
        language: 'Gujarati',
        errorMessage: 'માફ કરશો, વિનંતી કરેલી ભાષા ઉપલબ્ધ નથી.',
    },
    ha: {
        language: 'Hausa',
        errorMessage: 'Yi hakuri, harshen da ake nema ba ya samuwa.',
    },
    he: {
        language: 'Hebrew',
        errorMessage: 'מצטערים, השפה המבוקשת אינה זמינה.',
    },
    hi: {
        language: 'Hindi',
        errorMessage: 'क्षमा करें, अनुरोधित भाषा उपलब्ध नहीं है।',
    },
    hr: {
        language: 'Croatian',
        errorMessage: 'Nažalost, traženi jezik nije dostupan.',
    },
    ht: {
        language: 'Haitian Creole',
        errorMessage: 'Padon, lang yo mande a pa disponib.',
    },
    hu: {
        language: 'Hungarian',
        errorMessage: 'Sajnáljuk, a kért nyelv nem érhető el.',
    },
    hy: {
        language: 'Armenian',
        errorMessage: 'Ներեցեք, խնդրված լեզուն հասանելի չէ:',
    },
    id: {
        language: 'Indonesian',
        errorMessage: 'Maaf, bahasa yang diminta tidak tersedia.',
    },
    is: {
        language: 'Icelandic',
        errorMessage: 'Því miður, umbeðið tungumál er ekki í boði.',
    },
    it: {
        language: 'Italian',
        errorMessage: 'Spiacenti, la lingua richiesta non è disponibile.',
    },
    ja: {
        language: 'Japanese',
        errorMessage: '申し訳ありませんが、要求された言語は利用できません。',
    },
    ka: {
        language: 'Georgian',
        errorMessage: 'უკაცრავად, მოთხოვნილი ენა არ არის ხელმისაწვდომი.',
    },
    kk: {
        language: 'Kazakh',
        errorMessage: 'Кешіріңіз, сұралған тіл қол жетімді емес.',
    },
    kn: {
        language: 'Kannada',
        errorMessage: 'ಕ್ಷಮಿಸಿ, ವಿನಂತಿಸಿದ ಭಾಷೆ ಲಭ್ಯವಿಲ್ಲ.',
    },
    ko: {
        language: 'Korean',
        errorMessage: '죄송합니다. 요청하신 언어를 사용할 수 없습니다.',
    },
    lt: {
        language: 'Lithuanian',
        errorMessage: 'Atsiprašome, prašomos kalbos nėra.',
    },
    lv: {
        language: 'Latvian',
        errorMessage: 'Atvainojiet, pieprasītā valoda nav pieejama.',
    },
    mk: {
        language: 'Macedonian',
        errorMessage: 'Извинете, бараниот јазик не е достапен.',
    },
    ml: {
        language: 'Malayalam',
        errorMessage: 'ക്ഷമിക്കണം, അഭ്യർത്ഥിച്ച ഭാഷ ലഭ്യമല്ല.',
    },
    mn: {
        language: 'Mongolian',
        errorMessage: 'कУучлаарай, хүссэн хэл байхгүй байна.',
    },
    mr: {
        language: 'Marathi',
        errorMessage: 'क्षमस्व, विनंती केलेली भाषा उपलब्ध नाही.',
    },
    ms: {
        language: 'Malay',
        errorMessage: 'Maaf, bahasa yang diminta tidak tersedia.',
    },
    mt: {
        language: 'Maltese',
        errorMessage: 'Jiddispjacini, il-lingwa mitluba mhix disponibbli.',
    },
    nl: {
        language: 'Dutch',
        errorMessage: 'Sorry, de gevraagde taal is niet beschikbaar.',
    },
    no: {
        language: 'Norwegian',
        errorMessage: 'Beklager, det forespurte språket er ikke tilgjengelig.',
    },
    pa: {
        language: 'Punjabi',
        errorMessage: 'ਮੁਆਫ ਕਰਨਾ, ਬੇਨਤੀ ਕੀਤੀ ਭਾਸ਼ਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ.',
    },
    pl: {
        language: 'Polish',
        errorMessage: 'Niestety, żądany język nie jest dostępny.',
    },
    ps: {
        language: 'Pashto',
        errorMessage: 'بخښنه غواړئ، غوښتل شوې ژبه شتون نلري.',
    },
    pt: {
        language: 'Portuguese',
        errorMessage: 'Desculpe, o idioma solicitado não está disponível.',
    },
    'pt-PT': {
        language: 'Portuguese (Portugal)',
        errorMessage: 'Lamentamos, mas o idioma solicitado não está disponível.',
    },
    ro: {
        language: 'Romanian',
        errorMessage: 'Ne pare rău, limba solicitată nu este disponibilă.',
    },
    ru: {
        language: 'Russian',
        errorMessage: 'К сожалению, запрашиваемый язык недоступен.',
    },
    si: {
        language: 'Sinhala',
        errorMessage: 'කණගාටුයි, ඉල්ලූ භාෂාව ලබා ගත නොහැක.',
    },
    sk: {
        language: 'Slovak',
        errorMessage: 'Ľutujeme, požadovaný jazyk nie je k dispozícii.',
    },
    sl: {
        language: 'Slovenian',
        errorMessage: 'Oprostite, zahtevani jezik ni na voljo.',
    },
    so: {
        language: 'Somali',
        errorMessage: 'Waan ka xunnahay, luuqada la codsaday lama heli karo.',
    },
    sq: {
        language: 'Albanian',
        errorMessage: 'Na vjen keq, gjuha e kërkuar nuk është në dispozicion.',
    },
    sr: {
        language: 'Serbian',
        errorMessage: 'Nažalost, traženi jezik nije dostupan.',
    },
    sv: {
        language: 'Swedish',
        errorMessage: 'Tyvärr är det begärda språket inte tillgängligt.',
    },
    sw: {
        language: 'Swahili',
        errorMessage: 'Samahani, lugha iliyoombwa haipatikani.',
    },
    ta: {
        language: 'Tamil',
        errorMessage: 'மன்னிக்கவும், கோரிய மொழி கிடைக்கவில்லை.',
    },
    te: {
        language: 'Telugu',
        errorMessage: 'క్షమించండి, అభ్యర్థించిన భాష అందుబాటులో లేదు.',
    },
    th: {
        language: 'Thai',
        errorMessage: 'ขออภัย ไม่มีภาษาที่ร้องขอ',
    },
    tl: {
        language: 'Filipino, Tagalog',
        errorMessage: 'Paumanhin, hindi available ang hiniling na wika.',
    },
    tr: {
        language: 'Turkish',
        errorMessage: 'Üzgünüz, talep edilen dil mevcut değil.',
    },
    uk: {
        language: 'Ukrainian',
        errorMessage: 'Вибачте, запитана мова недоступна.',
    },
    ur: {
        language: 'Urdu',
        errorMessage: 'معذرت، درخواست شدہ زبان دستیاب نہیں ہے۔',
    },
    uz: {
        language: 'Uzbek',
        errorMessage: 'Kechirasiz, so\'ralgan til mavjud emas.',
    },
    vi: {
        language: 'Vietnamese',
        errorMessage: 'Rất tiếc, ngôn ngữ được yêu cầu không có sẵn.',
    },
    zh: {
        language: 'Chinese (Simplified)',
        errorMessage: '抱歉，请求的语言不可用。',
    },
    'zh-TW': {
        language: 'Chinese (Traditional)',
        errorMessage: '抱歉，您要求的語言無法使用。',
    },
};

const comprehendSyntaxSupportedLanguages = {
    English: 'en',
    French: 'fr',
    German: 'de',
    Italian: 'it',
    Portuguese: 'pt',
    Spanish: 'es',
};

module.exports = {
    getSupportedLanguages() {
        return supportedLanguages;
    },
    getLanguageErrorMessages() {
        return languageErrorMessages;
    },
    getComprehendSyntaxSupportedLanguages() {
        return comprehendSyntaxSupportedLanguages;
    },
};
