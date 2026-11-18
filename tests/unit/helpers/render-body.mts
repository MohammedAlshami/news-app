// Runs WITHOUT the react-server condition (react-dom/server is unusable under it).
// Reads {name: bodyJson} from stdin, prints {name: html} to stdout.
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { renderDocBlocks } from "../../../lib/article-body-render.tsx"
import { parseArticleBodyToTiptapDoc } from "../../../lib/parse-article-body.ts"

let input = ""
for await (const chunk of process.stdin) input += chunk
const bodies = JSON.parse(input) as Record<string, string>
const out: Record<string, string> = {}
for (const [k, body] of Object.entries(bodies)) {
  const doc = parseArticleBodyToTiptapDoc(body) as Parameters<typeof renderDocBlocks>[0]
  out[k] = renderToStaticMarkup(createElement("div", null, ...renderDocBlocks(doc)))
}
process.stdout.write(JSON.stringify(out))
