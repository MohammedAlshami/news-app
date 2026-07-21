import type { AiTextResolverOptions } from "@tiptap-pro/extension-ai"

type InlineAiBody = {
  prompt: string
  editorInline: true
  mode: "write"
}

function escapeText(text: string): string {
  return text.replace(/\r\n/g, "\n").trim()
}

function instructionForAction(
  action: string,
  text: string,
  textOptions: AiTextResolverOptions["textOptions"],
): string {
  const wantsHtml = textOptions?.format === "rich-text"
  const formatHint = wantsHtml
    ? "أعد HTML فقط. بدون markdown أو عناوين أو تعليقات."
    : "أرد نصاً عادياً فقط. بدون markdown أو تعليقات."
  const tone = textOptions?.tone
  const language = textOptions?.language
  const customText = textOptions?.text?.trim()
  const selection = escapeText(text)

  let task = ""
  switch (action) {
    case "extend":
      task = "وسع النص المحدد مع الحفاظ على المعنى."
      break
    case "shorten":
      task = "اختصر النص المحدد مع الحفاظ على المعنى."
      break
    case "simplify":
      task = "أعد كتابة النص بلغة أبسط وأوضح."
      break
    case "summarize":
      task = "لخص النص المحدد باختصار."
      break
    case "complete":
    case "autocomplete":
      task = "أكمل الكتابة بشكل طبيعي من السياق الحالي."
      break
    case "emojify":
      task = "أضف رموزاً تعبيرية مناسبة بدون إفراط."
      break
    case "fix-spelling-and-grammar":
      task = "صحح الإملاء والنحو فقط."
      break
    case "rephrase":
      task = "أعد صياغة النص بوضوح مع الحفاظ على المعنى."
      break
    case "adjust-tone":
      task = tone
        ? `أعد كتابة النص بنبرة ${tone}.`
        : "أعد كتابة النص بالنبرة المطلوبة."
      break
    case "translate":
      task = language
        ? `ترجم النص إلى ${language}.`
        : "ترجم النص إلى اللغة المطلوبة."
      break
    case "prompt":
      task = customText
        ? `اتبع هذا التعليمات: ${customText}`
        : "حسن النص المحدد حسب طلب المستخدم."
      break
    default:
      task = `طبق التعليمات ${action} على النص.`
      break
  }

  const sections = [
    "أنت محرر أخبار عربي داخل محرر نصوص غني.",
    "أعد النص المراد إدراجه فقط باللغة العربية الفصحى.",
    "يجب أن تكون الكتابة بالعربية الفصحى فقط. لا تستخدم أي كلمات إنجليزية.",
    formatHint,
    `التعليمة: ${task}`,
  ]

  if (tone) {
    sections.push(`النبرة: ${tone}`)
  }

  if (language) {
    sections.push(`اللغة: ${language}`)
  }

  if (selection) {
    sections.push(`النص المحدد:\n${selection}`)
  }

  return sections.join("\n\n")
}

async function fetchInlineEditorStream(prompt: string, signal?: AbortSignal) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      editorInline: true,
      mode: "write",
      prompt,
    } satisfies InlineAiBody),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(errorText || `AI request failed with ${response.status}`)
  }

  return response.body
}

export function createEditorOpenCodeStreamResolver() {
  return async ({ action, text, textOptions, aborter }: AiTextResolverOptions) => {
    const prompt = instructionForAction(action, text, textOptions)
    try {
      return await fetchInlineEditorStream(prompt, aborter?.signal)
    } catch {
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close()
        },
      })
    }
  }
}

export function createEditorOpenCodeCompletionResolver() {
  return async ({ action, text, textOptions, aborter }: AiTextResolverOptions) => {
    const prompt = instructionForAction(action, text, textOptions)
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          editorInline: true,
          mode: "write",
          prompt,
        } satisfies InlineAiBody),
        signal: aborter?.signal,
      })

      if (!response.ok) {
        return ""
      }

      return await response.text()
    } catch {
      return ""
    }
  }
}
