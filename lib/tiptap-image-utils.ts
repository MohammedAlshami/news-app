/** Pure helpers for image paste/drop/upload in the article editor (unit tested). */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const IMAGE_MESSAGES = {
  tooLarge: "حجم الصورة يتجاوز 5 ميغابايت. اختر صورة أصغر.",
  notImage: "الملف المحدد ليس صورة.",
  inlineStripped: "تمت إزالة صورة لصقها المتصفح كبيانات مضمّنة. ارفعها عبر زر الصورة بدلاً من لصقها.",
  uploadFailed: "تعذر رفع الصورة.",
  uploading: "جارٍ رفع الصورة…",
} as const

export function validateImageFile(file: { size: number; type: string }): string | null {
  if (!file.type.startsWith("image/")) return IMAGE_MESSAGES.notImage
  if (file.size > MAX_IMAGE_BYTES) return IMAGE_MESSAGES.tooLarge
  return null
}

/** Removes `<img>` tags whose src is a data:/blob:/file: URL from pasted HTML. */
export function stripInlineImages(html: string): { html: string; removed: number } {
  let removed = 0
  const out = html.replace(
    /<img\b[^>]*?\bsrc\s*=\s*(?:"\s*(?:data|blob|file):[^"]*"|'\s*(?:data|blob|file):[^']*'|(?:data|blob|file):[^\s>]*)[^>]*>/gi,
    () => {
      removed += 1
      return ""
    },
  )
  return { html: out, removed }
}

/** Turns whatever an upload threw (including Next's body-limit errors) into a readable Arabic message. */
export function describeUploadError(error: unknown): string {
  const msg = error instanceof Error ? error.message : typeof error === "string" ? error : ""
  if (/body exceeded|payload too large|413|too large|size limit|FUNCTION_PAYLOAD/i.test(msg)) {
    return IMAGE_MESSAGES.tooLarge
  }
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) {
    return "تعذر الاتصال بالخادم أثناء رفع الصورة."
  }
  if (/cancel/i.test(msg)) return "أُلغي رفع الصورة."
  // Server actions return Arabic messages already; keep them if they contain Arabic letters.
  if (/[؀-ۿ]/.test(msg)) return msg.slice(0, 200)
  return IMAGE_MESSAGES.uploadFailed
}
