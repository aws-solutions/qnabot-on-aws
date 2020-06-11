const supportedLanguages = {
    "Afrikaans": "af",
    "Albanian": "sq",
    "Amharic": "am",
    "Arabic": "ar",
    "Azerbaijani": "az",
    "Bengali": "bn",
    "Bosnian": "bs",
    "Bulgarian": "bg",
    "Chinese": "zh",
    "Chinese (Simplified)": "zh",
    "Chinese (Traditional)": "zh-TW",
    "Croatian": "hr",
    "Czech": "cs",
    "Danish": "da",
    "Dari": "fa-AF",
    "Dutch": "nl",
    "English": "en",
    "Estonian": "et",
    "Finnish": "fi",
    "French": "fr",
    "French (Canadian)": "fr-CA",
    "Georgian": "ka",
    "German": "de",
    "Greek": "el",
    "Hausa": "ha",
    "Hebrew": "he",
    "Hindi": "hi",
    "Hungarian": "hu",
    "Indonesian": "id",
    "Italian": "it",
    "Japanese": "ja",
    "Korean": "ko",
    "Latvian": "lv",
    "Malay": "ms",
    "Norwegian": "no",
    "Persian": "fa",
    "Pashto": "ps",
    "Polish": "pl",
    "Portuguese": "pt",
    "Romanian": "ro",
    "Russian": "ru",
    "Serbian": "sr",
    "Slovak": "sk",
    "Slovenian": "sl",
    "Somali": "so",
    "Spanish": "es",
    "Swahili": "sw",
    "Swedish": "sv",
    "Tagalog": "tl",
    "Tamil": "ta",
    "Thai": "th",
    "Turkish": "tr",
    "Ukrainian": "uk",
    "Urdu": "ur",
    "Vietnamese": "vi"
};

const languageErrorMessages = {
    "af": {
        "language": "Afrikaans",
        "errorMessage": "Jammer, die aangevraagde taal is nie beskikbaar nie."
    },
    "am": {
        "language": "Amharic",
        "errorMessage": "ይቅርታ የተጠየቀው ቋንቋ አይገኝም።"
    },
    "ar": {
        "language": "Arabic",
        "errorMessage": "عذرا، اللغة المطلوبة غير متوفرة."
    },
    "az": {
        "language": "Azerbaijani",
        "errorMessage": "Bağışlayın, tələb olunan dil mövcud deyil."
    },
    "bg": {
        "language": "Bulgarian",
        "errorMessage": "За съжаление, заявеният език не е наличен."
    },
    "bn": {
        "language": "Bengali",
        "errorMessage": "দুঃখিত, অনুরোধকৃত ভাষা উপলব্ধ নয়।"
    },
    "bs": {
        "language": "Bosnian",
        "errorMessage": "Žao nam je, traženi jezik nije dostupan."
    },
    "cs": {
        "language": "Czech",
        "errorMessage": "Je nám líto, požadovaný jazyk není k dispozici."
    },
    "da": {
        "language": "Danish",
        "errorMessage": "Beklager, det ønskede sprog er ikke tilgængeligt."
    },
    "de": {
        "language": "German",
        "errorMessage": "Leider ist die gewünschte Sprache nicht verfügbar."
    },
    "el": {
        "language": "Greek",
        "errorMessage": "Λυπούμαστε, η γλώσσα που ζητήθηκε δεν είναι διαθέσιμη."
    },
    "en": {
        "language": "English",
        "errorMessage": "Sorry, the requested language is not available."
    },
    "es": {
        "language": "Spanish",
        "errorMessage": "Lo sentimos, el idioma solicitado no está disponible."
    },
    "et": {
        "language": "Estonian",
        "errorMessage": "Vabandame, soovitud keel pole saadaval."
    },
    "fa": {
        "language": "Persian",
        "errorMessage": "متأسفانه زبان درخواستی در دسترس نیست."
    },
    "fa-AF": {
        "language": "Dari",
        "errorMessage": "متأسفانه زبان درخواست شده در دسترس نیست."
    },
    "fi": {
        "language": "Finnish",
        "errorMessage": "Pyydettyä kieltä ei valitettavasti ole saatavilla."
    },
    "fr": {
        "language": "French",
        "errorMessage": "Désolé, la langue demandée n'est pas disponible."
    },
    "fr-CA": {
        "language": "French (Canadian)",
        "errorMessage": "Désolé, la langue demandée n'est pas disponible."
    },
    "ha": {
        "language": "Hausa",
        "errorMessage": "Yi hakuri, harshen da ake nema ba ya samuwa."
    },
    "he": {
        "language": "Hebrew",
        "errorMessage": "מצטערים, השפה המבוקשת אינה זמינה."
    },
    "hi": {
        "language": "Hindi",
        "errorMessage": "क्षमा करें, अनुरोधित भाषा उपलब्ध नहीं है।"
    },
    "hr": {
        "language": "Croatian",
        "errorMessage": "Nažalost, traženi jezik nije dostupan."
    },
    "hu": {
        "language": "Hungarian",
        "errorMessage": "Sajnáljuk, a kért nyelv nem érhető el."
    },
    "id": {
        "language": "Indonesian",
        "errorMessage": "Maaf, bahasa yang diminta tidak tersedia."
    },
    "it": {
        "language": "Italian",
        "errorMessage": "Spiacenti, la lingua richiesta non è disponibile."
    },
    "ja": {
        "language": "Japanese",
        "errorMessage": "申し訳ありませんが、要求された言語は利用できません。"
    },
    "ka": {
        "language": "Georgian",
        "errorMessage": "უკაცრავად, მოთხოვნილი ენა არ არის ხელმისაწვდომი."
    },
    "ko": {
        "language": "Korean",
        "errorMessage": "죄송합니다. 요청하신 언어를 사용할 수 없습니다."
    },
    "lv": {
        "language": "Latvian",
        "errorMessage": "Atvainojiet, pieprasītā valoda nav pieejama."
    },
    "ms": {
        "language": "Malay",
        "errorMessage": "Maaf, bahasa yang diminta tidak tersedia."
    },
    "nl": {
        "language": "Dutch",
        "errorMessage": "Sorry, de gevraagde taal is niet beschikbaar."
    },
    "no": {
        "language": "Norwegian",
        "errorMessage": "Beklager, det forespurte språket er ikke tilgjengelig."
    },
    "pl": {
        "language": "Polish",
        "errorMessage": "Niestety, żądany język nie jest dostępny."
    },
    "ps": {
        "language": "Pashto",
        "errorMessage": "بخښنه غواړئ، غوښتل شوې ژبه شتون نلري."
    },
    "pt": {
        "language": "Portuguese",
        "errorMessage": "Desculpe, o idioma solicitado não está disponível."
    },
    "ro": {
        "language": "Romanian",
        "errorMessage": "Ne pare rău, limba solicitată nu este disponibilă."
    },
    "ru": {
        "language": "Russian",
        "errorMessage": "К сожалению, запрашиваемый язык недоступен."
    },
    "sk": {
        "language": "Slovak",
        "errorMessage": "Ľutujeme, požadovaný jazyk nie je k dispozícii."
    },
    "sl": {
        "language": "Slovenian",
        "errorMessage": "Oprostite, zahtevani jezik ni na voljo."
    },
    "so": {
        "language": "Somali",
        "errorMessage": "Waan ka xunnahay, luuqada la codsaday lama heli karo."
    },
    "sq": {
        "language": "Albanian",
        "errorMessage": "Na vjen keq, gjuha e kërkuar nuk është në dispozicion."
    },
    "sr": {
        "language": "Serbian",
        "errorMessage": "Nažalost, traženi jezik nije dostupan."
    },
    "sv": {
        "language": "Swedish",
        "errorMessage": "Tyvärr är det begärda språket inte tillgängligt."
    },
    "sw": {
        "language": "Swahili",
        "errorMessage": "Samahani, lugha iliyoombwa haipatikani."
    },
    "ta": {
        "language": "Tamil",
        "errorMessage": "மன்னிக்கவும், கோரிய மொழி கிடைக்கவில்லை."
    },
    "th": {
        "language": "Thai",
        "errorMessage": "ขออภัย ไม่มีภาษาที่ร้องขอ"
    },
    "tl": {
        "language": "Tagalog",
        "errorMessage": "Paumanhin, hindi available ang hiniling na wika."
    },
    "tr": {
        "language": "Turkish",
        "errorMessage": "Üzgünüz, talep edilen dil mevcut değil."
    },
    "uk": {
        "language": "Ukrainian",
        "errorMessage": "Вибачте, запитана мова недоступна."
    },
    "ur": {
        "language": "Urdu",
        "errorMessage": "معذرت، درخواست شدہ زبان دستیاب نہیں ہے۔"
    },
    "vi": {
        "language": "Vietnamese",
        "errorMessage": "Rất tiếc, ngôn ngữ được yêu cầu không có sẵn."
    },
    "zh": {
        "language": "Chinese (Simplified)",
        "errorMessage": "抱歉，请求的语言不可用。"
    },
    "zh-TW": {
        "language": "Chinese (Traditional)",
        "errorMessage": "抱歉，您要求的語言無法使用。"
    }
};

module.exports = {
    getSupportedLanguages: function () {
        return supportedLanguages;
    },
    getLanguageErrorMessages: function () {
        return languageErrorMessages;
    }
}