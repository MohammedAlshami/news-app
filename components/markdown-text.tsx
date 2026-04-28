import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

type Variant = "block" | "inline"

type MarkdownTextProps = {
  children: string
  className?: string
  /**
   * `block` – default; allows several paragraphs, lists, and fenced ` ``` `code blocks` ``` ` in the string.
   * `inline` – maps the outer `<p>` to `<span>` (for headings, table cells) so you can use **bold** and friends without block nesting issues.
   */
  variant?: Variant
}

function isFencedCodeClass(className?: string) {
  return typeof className === "string" && className.split(/\s+/).some((c) => c.startsWith("language-"))
}

export function MarkdownText({ children, className, variant = "block" }: MarkdownTextProps) {
  if (!children) {
    return null
  }

  const Root: "div" | "span" = variant === "inline" ? "span" : "div"

  return (
    <Root className={cn(Root === "span" && "block", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (props) => {
            if (variant === "inline") {
              return <span className="text-inherit" {...props} />
            }
            return (
              <p
                className={cn("text-inherit [&:not(:first-child)]:mt-3")}
                {...props}
              />
            )
          },
          pre: (props) => (
            <pre
              className="my-3 max-w-full overflow-x-auto rounded-lg border border-border bg-muted/80 p-3 text-sm [tab-size:2] [&_code]:bg-transparent [&_code]:p-0"
              {...props}
            />
          ),
          strong: ({ className: c, children, ...props }) => (
            <strong className={cn("font-semibold", c)} {...props}>
              {children}
            </strong>
          ),
          em: ({ className: c, children, ...props }) => (
            <em className={cn("italic", c)} {...props}>
              {children}
            </em>
          ),
          del: ({ className: c, children, ...props }) => (
            <del className={cn("line-through opacity-90", c)} {...props}>
              {children}
            </del>
          ),
          code: ({ className: c, children, ...props }) => {
            if (isFencedCodeClass(c)) {
              return (
                <code className={cn("block font-mono", c)} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code
                className={cn(
                  "break-words rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground/95",
                  c,
                )}
                {...props}
              >
                {children}
              </code>
            )
          },
          a: ({ className: c, href, children, ...props }) => (
            <a
              href={href}
              className={cn("font-medium text-foreground underline underline-offset-2 hover:opacity-90", c)}
              rel="noopener noreferrer"
              target={href?.startsWith("http") ? "_blank" : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          br: (props) => <br className="block" {...props} />,
          ul: ({ className: c, children, ...props }) => (
            <ul className={cn("ms-4 list-outside list-disc", c)} {...props}>
              {children}
            </ul>
          ),
          ol: ({ className: c, children, ...props }) => (
            <ol className={cn("ms-4 list-outside list-decimal", c)} {...props}>
              {children}
            </ol>
          ),
          li: ({ className: c, children, ...props }) => (
            <li className={cn("[&:not(:first-child)]:mt-1.5", c)} {...props}>
              {children}
            </li>
          ),
          h1: "span",
          h2: "span",
          h3: "span",
          h4: "span",
          h5: "span",
          h6: "span",
        }}
      >
        {children}
      </ReactMarkdown>
    </Root>
  )
}
