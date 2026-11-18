import { firstStrongDir } from "@/lib/text-dir"
import { Fragment, type CSSProperties, type ReactNode } from "react"

/**
 * Server-rendered, dependency-free renderer for the stored Tiptap/ProseMirror JSON body.
 * Emits the same class names the editor SCSS targets (`.tiptap.ProseMirror`) so styling is
 * unchanged, but the HTML is present in the initial response (crawlers, no layout shift).
 */

type Mark = { type?: string; attrs?: Record<string, unknown> }
export type PMNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: Mark[]
  content?: PMNode[]
}

const MAX_DEPTH = 48
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([0-9.,%\s/-]+\)|[a-z]{3,20})$/i

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined
}
function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) && n > 0 && n < 20000 ? Math.round(n) : undefined
}
function color(v: unknown): string | undefined {
  const s = str(v)?.trim()
  return s && SAFE_COLOR.test(s) ? s : undefined
}

function cleanUrl(v: unknown): string {
  return (str(v) ?? "").replace(/[\u0000- \u007f-\u009f]/g, "")
}

/** Only http(s), mailto, tel and site-relative paths are linkable. */
export function safeLinkHref(href: unknown): string | null {
  const raw = str(href)?.trim()
  if (!raw) return null
  const t = cleanUrl(raw)
  if (/^(https?:|mailto:|tel:)/i.test(t)) return raw
  if (/^\/(?![/\\])/.test(t)) return raw
  return null
}

function safeImageSrc(src: unknown): string | null {
  const raw = str(src)?.trim()
  if (!raw) return null
  const t = cleanUrl(raw)
  if (/^https?:\/\//i.test(t) || /^\/(?![/\\])/.test(t)) return raw
  return null
}

function blockStyle(attrs?: Record<string, unknown>): CSSProperties | undefined {
  const a = str(attrs?.textAlign)
  if (a === "left" || a === "right" || a === "center" || a === "justify") return { textAlign: a }
  return undefined
}

function renderMarks(text: ReactNode, marks: Mark[] | undefined, key: string): ReactNode {
  let out = text
  for (const m of marks ?? []) {
    switch (m.type) {
      case "bold":
        out = <strong>{out}</strong>
        break
      case "italic":
        out = <em>{out}</em>
        break
      case "underline":
        out = <u>{out}</u>
        break
      case "strike":
        out = <s>{out}</s>
        break
      case "code":
        out = <code>{out}</code>
        break
      case "subscript":
        out = <sub>{out}</sub>
        break
      case "superscript":
        out = <sup>{out}</sup>
        break
      case "highlight": {
        const c = color(m.attrs?.color)
        out = <mark style={c ? { backgroundColor: c } : undefined}>{out}</mark>
        break
      }
      case "textStyle": {
        const c = color(m.attrs?.color)
        if (c) out = <span style={{ color: c }}>{out}</span>
        break
      }
      case "link": {
        const href = safeLinkHref(m.attrs?.href)
        if (!href) break
        const external = /^https?:/i.test(cleanUrl(href))
        out = external ? (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
            {out}
          </a>
        ) : (
          <a href={href}>{out}</a>
        )
        break
      }
      default:
        break // unknown marks are ignored
    }
  }
  return <Fragment key={key}>{out}</Fragment>
}

function renderChildren(node: PMNode, depth: number, key: string): ReactNode[] {
  return (node.content ?? []).map((c, i) => renderNode(c, depth + 1, `${key}.${i}`))
}

function plainText(node: PMNode | undefined, limit = 400): string {
  if (!node || typeof node !== "object") return ""
  if (typeof node.text === "string") return node.text
  let out = ""
  for (const c of node.content ?? []) {
    out += plainText(c, limit)
    if (out.length >= limit) break
  }
  return out
}

function renderNode(node: PMNode, depth: number, key: string): ReactNode {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH) return null
  const style = blockStyle(node.attrs)
  const kids = () => renderChildren(node, depth, key)

  switch (node.type) {
    case "text": {
      if (typeof node.text !== "string") return null
      return node.marks?.length ? renderMarks(node.text, node.marks, key) : node.text
    }
    case "paragraph":
      return (
        <p key={key} dir="auto" style={style}>
          {kids()}
        </p>
      )
    case "heading": {
      const level = Math.min(6, Math.max(1, num(node.attrs?.level) ?? 2))
      // The article title is the page's only <h1>; body H1s become H2s.
      const Tag = `h${Math.max(2, level)}` as "h2" | "h3" | "h4" | "h5" | "h6"
      return (
        <Tag key={key} dir="auto" style={style}>
          {kids()}
        </Tag>
      )
    }
    case "bulletList":
      return (
        <ul key={key} dir={firstStrongDir(plainText(node))}>
          {kids()}
        </ul>
      )
    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : undefined
      return (
        <ol key={key} dir={firstStrongDir(plainText(node))} start={start !== undefined && start !== 1 ? start : undefined}>
          {kids()}
        </ol>
      )
    }
    case "listItem":
      return <li key={key} dir={firstStrongDir(plainText(node))}>{kids()}</li>
    case "taskList":
      return (
        <ul key={key} dir={firstStrongDir(plainText(node))} data-type="taskList">
          {kids()}
        </ul>
      )
    case "taskItem": {
      const checked = node.attrs?.checked === true
      return (
        <li key={key} dir={firstStrongDir(plainText(node))} data-type="taskItem" data-checked={checked ? "true" : "false"}>
          <label>
            <input type="checkbox" checked={checked} disabled readOnly />
            <span />
          </label>
          <div>{kids()}</div>
        </li>
      )
    }
    case "blockquote":
      return (
        <blockquote key={key} dir={firstStrongDir(plainText(node))}>
          {kids()}
        </blockquote>
      )
    case "codeBlock": {
      const lang = str(node.attrs?.language)
      return (
        <pre key={key} dir="ltr">
          <code className={lang && /^[\w+#-]+$/.test(lang) ? `language-${lang}` : undefined}>{kids()}</code>
        </pre>
      )
    }
    case "horizontalRule":
      return <hr key={key} />
    case "hardBreak":
      return <br key={key} />
    case "image":
    case "resizableImage": {
      const src = safeImageSrc(node.attrs?.src)
      if (!src) return null
      const alt = str(node.attrs?.alt) ?? str(node.attrs?.title) ?? ""
      const title = str(node.attrs?.title)
      // eslint-disable-next-line @next/next/no-img-element -- images are served unoptimized (no Images binding yet; CDN follow-up)
      return <img key={key} src={src} alt={alt} title={title} width={num(node.attrs?.width)} height={num(node.attrs?.height)} loading="lazy" decoding="async" />
    }
    case "table":
      return (
        <div key={key} style={{ overflowX: "auto" }}>
          <table dir="auto">
            <tbody>{kids()}</tbody>
          </table>
        </div>
      )
    case "tableRow":
      return <tr key={key}>{kids()}</tr>
    case "tableHeader":
    case "tableCell": {
      const Cell = node.type === "tableHeader" ? "th" : "td"
      const colSpan = num(node.attrs?.colspan)
      const rowSpan = num(node.attrs?.rowspan)
      return (
        <Cell key={key} colSpan={colSpan && colSpan > 1 ? colSpan : undefined} rowSpan={rowSpan && rowSpan > 1 ? rowSpan : undefined}>
          {kids()}
        </Cell>
      )
    }
    case "mention": {
      const label = str(node.attrs?.label) ?? str(node.attrs?.id)
      return label ? (
        <span key={key} data-type="mention" className="mention">
          {`@${label}`}
        </span>
      ) : null
    }
    case "emoji": {
      const e = str(node.attrs?.emoji) ?? str(node.attrs?.text)
      return e ? (
        <span key={key} data-type="emoji">
          {e}
        </span>
      ) : null
    }
    case "inlineMath":
    case "blockMath":
    case "mathematics":
    case "math": {
      const latex = str(node.attrs?.latex) ?? str(node.attrs?.content) ?? str(node.attrs?.value)
      if (!latex) return null
      const block = node.type === "blockMath"
      return block ? (
        <div key={key} data-type="math" dir="ltr">
          {latex}
        </div>
      ) : (
        <span key={key} data-type="math" dir="ltr">
          {latex}
        </span>
      )
    }
    case "details":
      return <details key={key}>{kids()}</details>
    case "detailsSummary":
      return <summary key={key}>{kids()}</summary>
    case "detailsContent":
      return <div key={key}>{kids()}</div>
    case "doc":
      return <Fragment key={key}>{kids()}</Fragment>
    default:
      // Unknown node: render its children only.
      return node.content?.length ? <Fragment key={key}>{kids()}</Fragment> : null
  }
}

/** Render the top-level blocks of a parsed Tiptap doc to React nodes. */
export function renderDocBlocks(doc: PMNode): ReactNode[] {
  return (doc.content ?? []).map((n, i) => renderNode(n, 1, String(i)))
}
