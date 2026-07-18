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
    ? "Return valid HTML only. No markdown fences, headings, or commentary."
    : "Return plain text only. No markdown fences or commentary."
  const tone = textOptions?.tone
  const language = textOptions?.language
  const customText = textOptions?.text?.trim()
  const selection = escapeText(text)

  let task = ""
  switch (action) {
    case "extend":
      task = "Expand the selected text with useful detail while preserving meaning."
      break
    case "shorten":
      task = "Shorten the selected text while preserving meaning."
      break
    case "simplify":
      task = "Rewrite the text in clearer, simpler language."
      break
    case "summarize":
      task = "Summarize the selected text concisely."
      break
    case "complete":
    case "autocomplete":
      task = "Continue naturally from the current context."
      break
    case "emojify":
      task = "Add tasteful emojis without overdoing it."
      break
    case "fix-spelling-and-grammar":
      task = "Fix spelling and grammar only."
      break
    case "rephrase":
      task = "Rephrase the text for clarity while preserving meaning."
      break
    case "adjust-tone":
      task = tone
        ? `Rewrite the text in a ${tone} tone.`
        : "Rewrite the text in the requested tone."
      break
    case "translate":
      task = language
        ? `Translate the text to ${language}.`
        : "Translate the text to the requested language."
      break
    case "prompt":
      task = customText
        ? `Follow this instruction: ${customText}`
        : "Improve the selected text according to the user's instruction."
      break
    default:
      task = `Apply the ${action} instruction to the text.`
      break
  }

  const sections = [
    "You are an inline Arabic news editor inside a rich-text editor.",
    "Return only the text to insert.",
    formatHint,
    `Instruction: ${task}`,
  ]

  if (tone) {
    sections.push(`Tone: ${tone}`)
  }

  if (language) {
    sections.push(`Language: ${language}`)
  }

  if (selection) {
    sections.push(`Selected text:\n${selection}`)
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
