import type { Language } from "@tiptap-pro/extension-ai"

export const SUPPORTED_LANGUAGES: Array<{
  label: string
  value: Language
}> = [
  { label: "الإنجليزية", value: "en" },
  { label: "الكورية", value: "ko" },
  { label: "الصينية", value: "zh" },
  { label: "اليابانية", value: "ja" },
  { label: "الإسبانية", value: "es" },
  { label: "الروسية", value: "ru" },
  { label: "الفرنسية", value: "fr" },
  { label: "البرتغالية", value: "pt" },
  { label: "الألمانية", value: "de" },
  { label: "الإيطالية", value: "it" },
  { label: "الهولندية", value: "nl" },
  { label: "الإندونيسية", value: "id" },
  { label: "الفيتنامية", value: "vi" },
  { label: "التركية", value: "tr" },
  { label: "العربية", value: "ar" },
]

export const SUPPORTED_TONES: Array<{ label: string; value: string }> = [
  { label: "أكاديمي", value: "academic" },
  { label: "تجاري", value: "business" },
  { label: "عفوي", value: "casual" },
  { label: "مناسب للأطفال", value: "childfriendly" },
  { label: "واثق", value: "confident" },
  { label: "حواري", value: "conversational" },
  { label: "إبداعي", value: "creative" },
  { label: "عاطفي", value: "emotional" },
  { label: "متحمس", value: "excited" },
  { label: "رسمي", value: "formal" },
  { label: "ودود", value: "friendly" },
  { label: "مرح", value: "funny" },
  { label: "فكاهي", value: "humorous" },
  { label: "معلوماتي", value: "informative" },
  { label: "ملهم", value: "inspirational" },
  { label: "ميمي", value: "memeify" },
  { label: "سردي", value: "narrative" },
  { label: "موضوعي", value: "objective" },
  { label: "إقناعي", value: "persuasive" },
  { label: "شعري", value: "poetic" },
]
