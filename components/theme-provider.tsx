"use client"

import type * as React from "react"

/**
 * Passthrough wrapper — replaces next-themes (its inline `<script>` conflicts with React 19).
 * Add dark/light switching later via CSS variables or a theme lib that avoids `<script>` in the tree.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
