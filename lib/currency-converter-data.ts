export const LABELS: Record<string, string> = {
  USD: "دولار امريكي",
  EUR: "يورو",
  SAR: "ريال سعودي",
  AED: "درهم اماراتي",
  GBP: "جنيه استرليني",
  KWD: "دينار كويتي",
  QAR: "ريال قطري",
  OMR: "ريال عماني",
  BHD: "دينار بحريني",
  JOD: "دينار اردني",
  EGP: "جنيه مصري",
  TRY: "ليرة تركي",
  INR: "روبية هندي",
  YER_SANAA: "ريال يمني - صنعاء",
  YER_ADEN: "ريال يمني - عدن",
}

export const PRICING_ROWS = [
  { code: "USD", sanaa: "535", aden: "1561" },
  { code: "SAR", sanaa: "140.10", aden: "411" },
  { code: "EUR", sanaa: "646", aden: "1478" },
]

/** Short glyphs used in coloured badges next to each currency. */
export const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SAR: "﷼",
  QAR: "﷼",
  OMR: "﷼",
  AED: "د.إ",
  KWD: "د.ك",
  BHD: "د.ب",
  JOD: "د.أ",
  EGP: "ج.م",
  TRY: "₺",
  INR: "₹",
  YER_SANAA: "ر.ي",
  YER_ADEN: "ر.ي",
  YER: "ر.ي",
}
