/** Default empty Tiptap document (no `"use client"`; safe in server actions). */
export const tiptapEmptyDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
} as const
