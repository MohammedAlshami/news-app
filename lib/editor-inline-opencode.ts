import type { AiTextResolverOptions } from "@tiptap-pro/extension-ai"

import {
  AI_EMPTY_MESSAGE,
  AI_TRUNCATED_EMPTY_MESSAGE,
  AiRequestError,
  createCleanAiStream,
  describeAiHttpError,
  stripAiControlMarks,
  type AiStreamCallbacks,
} from "@/lib/ai-stream"

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

async function postInline(prompt: string, signal?: AbortSignal): Promise<Response> {
  // Network failures (TypeError) and aborts (AbortError) propagate as-is; the caller maps them.
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      editorInline: true,
      mode: "write",
      prompt,
    } satisfies InlineAiBody),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new AiRequestError(describeAiHttpError(response.status, errorText))
  }
  return response
}

/**
 * Streaming resolver for the Tiptap Ai extension. Errors are thrown (never swallowed) so the
 * extension's `onError` fires; aborts surface as AbortError and must be treated as a clean cancel.
 */
export function createEditorOpenCodeStreamResolver(callbacks: AiStreamCallbacks = {}) {
  return async ({ action, text, textOptions, aborter }: AiTextResolverOptions) => {
    const prompt = instructionForAction(action, text, textOptions)
    const response = await postInline(prompt, aborter?.signal)
    if (!response.body) throw new AiRequestError(AI_EMPTY_MESSAGE)
    return createCleanAiStream(response.body, callbacks)
  }
}

export function createEditorOpenCodeCompletionResolver(callbacks: AiStreamCallbacks = {}) {
  return async ({ action, text, textOptions, aborter }: AiTextResolverOptions) => {
    const prompt = instructionForAction(action, text, textOptions)
    const response = await postInline(prompt, aborter?.signal)
    const r = stripAiControlMarks(await response.text())
    if (r.truncated) callbacks.onTruncated?.()
    if (!r.text.trim()) {
      throw new AiRequestError(r.truncated ? AI_TRUNCATED_EMPTY_MESSAGE : AI_EMPTY_MESSAGE)
    }
    return r.text
  }
}
