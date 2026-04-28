import { blockAlignClass } from "@/lib/block-align"
import type { BlockAlign, ContentBlock } from "@/lib/content-blocks"
import { MarkdownText } from "@/components/markdown-text"
import { cn } from "@/lib/utils"

type ArticleContentProps = {
  blocks: ContentBlock[]
}

function imageFigureItemsClass(align?: BlockAlign) {
  if (!align || align === "left" || align === "justify") {
    return "items-stretch"
  }
  if (align === "center") {
    return "items-center"
  }
  return "items-end"
}

function gapBefore(i: number) {
  return i === 0 ? "" : "mt-6"
}

export function ArticleContent({ blocks }: ArticleContentProps) {
  return (
    <div className="text-base leading-relaxed text-foreground/95">
      {blocks.map((block, i) => {
        const key = `${i}-${block.type}`
        const a = block.align
        const align = blockAlignClass(a)

        switch (block.type) {
          case "heading": {
            const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4"
            return (
              <Tag
                key={key}
                className={cn(
                  "scroll-mt-20 font-sans font-semibold tracking-tight text-foreground",
                  gapBefore(i),
                  block.level === 2 && "text-xl sm:text-2xl",
                  block.level === 3 && "text-lg sm:text-xl",
                  block.level === 4 && "text-base sm:text-lg",
                  align,
                )}
              >
                <MarkdownText variant="inline">{block.text}</MarkdownText>
              </Tag>
            )
          }
          case "paragraph":
            return (
              <div key={key} className={cn("text-pretty", gapBefore(i), align)}>
                <MarkdownText>{block.text}</MarkdownText>
              </div>
            )
          case "list": {
            const List = block.ordered ? "ol" : "ul"
            return (
              <List
                key={key}
                className={cn(
                  gapBefore(i),
                  "list-outside ps-5 text-pretty",
                  block.ordered ? "list-decimal" : "list-disc",
                  align,
                )}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="[&:not(:first-child)]:mt-1.5">
                    <MarkdownText variant="block">{item}</MarkdownText>
                  </li>
                ))}
              </List>
            )
          }
          case "blockquote":
            return (
              <figure
                key={key}
                className={cn(
                  gapBefore(i),
                  "border-s-2 border-foreground/25 ps-4",
                  align,
                )}
              >
                <blockquote className="text-pretty italic text-muted-foreground">
                  <MarkdownText>{block.text}</MarkdownText>
                </blockquote>
                {block.attribution ? (
                  <figcaption
                    className="mt-2 text-sm not-italic text-muted-foreground"
                  >
                    —{" "}
                    <MarkdownText variant="inline">
                      {block.attribution}
                    </MarkdownText>
                  </figcaption>
                ) : null}
              </figure>
            )
          case "image": {
            const { url, alt } = block
            const displayLabel = block.label ?? block.caption
            const captionTextAlign = blockAlignClass(a) ?? "text-left"
            return (
              <figure
                key={key}
                className={cn(
                  gapBefore(i),
                  "flex w-full flex-col",
                  imageFigureItemsClass(a),
                )}
              >
                <div
                  className={cn(
                    "w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-muted/30",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs from CMS/json */}
                  <img
                    src={url}
                    alt={alt ?? ""}
                    className="h-auto w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {displayLabel ? (
                  <figcaption
                    className={cn(
                      "mt-3 w-full max-w-2xl text-sm text-muted-foreground",
                      captionTextAlign,
                      a === "center" && "mx-auto",
                      a === "right" && "self-end",
                      a === "left" && "self-start",
                      !a && "self-stretch",
                    )}
                  >
                    <MarkdownText variant="block">{displayLabel}</MarkdownText>
                  </figcaption>
                ) : null}
              </figure>
            )
          }
          case "table": {
            const { headers, rows } = block
            const tableLabel = block.label ?? block.caption
            const tableCaptionAlign = blockAlignClass(a) ?? "text-left"
            return (
              <figure
                key={key}
                className={cn(
                  gapBefore(i),
                  "flex w-full flex-col",
                  imageFigureItemsClass(a),
                )}
              >
                <div
                  className={cn(
                    "w-full max-w-2xl overflow-x-auto",
                    a === "center" && "self-center",
                    a === "right" && "self-end",
                    a === "left" && "self-start",
                  )}
                >
                  {/*
                    Explicit `dir` + logical alignment: without this, the table can stay LTR
                    (first column on the left) even when the page is Arabic.
                  */}
                  <div
                    className="inline-block min-w-full rounded-lg border border-border"
                    dir="rtl"
                  >
                    <table
                      dir="rtl"
                      className="w-full min-w-[min(100%,20rem)] border-collapse text-start text-sm"
                    >
                      <thead>
                        <tr className="bg-muted/60">
                          {headers.map((h, col) => (
                            <th
                              key={col}
                              className="border-b border-border px-3 py-2 text-start font-medium"
                            >
                              <MarkdownText variant="inline">{h}</MarkdownText>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, r) => (
                          <tr
                            key={r}
                            className="[&:not(:last-child)]:border-b border-border/80"
                          >
                            {row.map((cell, c) => (
                              <td
                                key={c}
                                className="px-3 py-2 text-start align-top"
                              >
                                <MarkdownText variant="inline">{cell}</MarkdownText>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {tableLabel ? (
                  <figcaption
                    className={cn(
                      "mt-3 w-full max-w-2xl text-sm text-muted-foreground",
                      tableCaptionAlign,
                      a === "center" && "self-center",
                      a === "right" && "self-end",
                      a === "left" && "self-start",
                    )}
                  >
                    <MarkdownText variant="block">{tableLabel}</MarkdownText>
                  </figcaption>
                ) : null}
              </figure>
            )
          }
          default: {
            const _n: never = block
            return _n
          }
        }
      })}
    </div>
  )
}
