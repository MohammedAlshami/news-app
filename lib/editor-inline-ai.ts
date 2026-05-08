"use client"

import type { Editor } from "@tiptap/react"

type InlineAiAction =
  | "prompt"
  | "continue_writing"
  | "aiFixSpellingAndGrammar"
  | "aiExtend"
  | "aiShorten"
  | "simplifyLanguage"
  | "improveWriting"
  | "emojify"
  | "summarize"
  | "translateTo"
  | "adjustTone"

type InlineAiOptions = {
  action: InlineAiAction
  prompt?: string
  tone?: string
  language?: string
  replaceSelection?: boolean
  signal?: AbortSignal
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function textToHtmlFragment(text: string): string {
  const normalized = text.trim()
  if (!normalized) return ""

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => {
      const body = escapeHtml(paragraph).replace(/\n/g, "<br />")
      return `<p>${body}</p>`
    })
    .join("")
}

function getSelectionText(editor: Editor): string {
  const { from, to } = editor.state.selection
  if (from === to) return ""
  return editor.state.doc.textBetween(from, to, "\n").trim()
}

function buildPrompt(editor: Editor, options: InlineAiOptions): string {
  const selectionText = getSelectionText(editor)
  const prompt = options.prompt?.trim() ?? ""
  const tone = options.tone?.trim() ?? ""
  const language = options.language?.trim() ?? ""

  const actionPrompt: Record<InlineAiAction, string> = {
    prompt: prompt || "Improve the selected text according to the user request.",
    continue_writing: "Continue writing from the current context. Return only the next sentence or paragraph.",
    aiFixSpellingAndGrammar: "Fix spelling and grammar only. Preserve meaning and tone.",
    aiExtend: "Expand the text with more useful detail while preserving meaning.",
    aiShorten: "Shorten the text while preserving meaning.",
    simplifyLanguage: "Simplify the wording for clarity.",
    improveWriting: "Rewrite the text to sound more polished and natural.",
    emojify: "Add tasteful emojis, but do not overdo it.",
    summarize: "Summarize the text concisely.",
    translateTo: language ? `Translate the text to ${language}.` : "Translate the text to the requested language.",
    adjustTone: tone ? `Rewrite the text in a ${tone} tone.` : "Rewrite the text in the requested tone.",
  }

  const pieces = [
    "You are an Arabic news editor inside a rich-text editor.",
    "Return only the text to insert. No markdown fences, no explanation.",
    `Instruction: ${actionPrompt[options.action]}`,
  ]

  if (prompt && options.action === "prompt") {
    pieces.push(`User request: ${prompt}`)
  }

  if (tone) {
    pieces.push(`Tone: ${tone}`)
  }

  if (language) {
    pieces.push(`Language: ${language}`)
  }

  if (selectionText) {
    pieces.push(`Selected text:\n${selectionText}`)
  }

  return pieces.filter(Boolean).join("\n\n")
}

function insertGeneratedText(editor: Editor, text: string, replaceSelection: boolean) {
  const html = textToHtmlFragment(text)
  if (!html) return false

  const { from, to } = editor.state.selection
  const chain = editor.chain().focus()
  if (replaceSelection && from !== to) {
    chain.deleteRange({ from, to })
  }
  chain.insertContent(html).run()
  return true
}

export async function runEditorInlineAi(
  editor: Editor,
  options: InlineAiOptions
): Promise<string | null> {
  const prompt = buildPrompt(editor, options)

  editor.commands.aiGenerationSetIsLoading(true)
  editor.commands.aiGenerationHasMessage(false)
  editor.commands.aiGenerationShow()

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
      }),
      signal: options.signal,
    })

    const text = await response.text()
    if (!response.ok) {
      throw new Error(text || `AI request failed with ${response.status}`)
    }

    const cleaned = text.trim()
    if (!cleaned) {
      return null
    }

    insertGeneratedText(editor, cleaned, options.replaceSelection ?? true)
    editor.commands.aiGenerationHasMessage(true)
    return cleaned
  } finally {
    editor.commands.aiGenerationSetIsLoading(false)
    editor.commands.aiGenerationHide()
    editor.commands.aiGenerationHasMessage(false)
  }
}
