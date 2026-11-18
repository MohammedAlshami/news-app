import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { test } from "node:test"

const ROOT = join(import.meta.dirname, "..", "..")

function walk(dir: string, match: (name: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, match, out)
    else if (match(name)) out.push(p)
  }
  return out
}

/** Source of the body of each `export async function` in a file, keyed by name. */
function exportedAsyncBodies(src: string): Map<string, string> {
  const out = new Map<string, string>()
  const re = /export\s+async\s+function\s+(\w+)\s*\(/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    // skip the parameter list (balanced parens) and return type, then find the body's opening brace
    let i = m.index + m[0].length
    let depth = 1
    while (i < src.length && depth > 0) {
      if (src[i] === "(") depth++
      else if (src[i] === ")") depth--
      i++
    }
    // return type may contain braces ({ ok: true }); find the "{\n" that opens the body: first `{` at
    // brace-depth 0 relative to the return type, after the closing ")".
    let angle = 0
    let brace = 0
    for (; i < src.length; i++) {
      const c = src[i]
      if (c === "<") angle++
      else if (c === ">" && src[i - 1] !== "=") angle--
      else if (c === "{") {
        if (angle === 0 && brace === 0 && /\)\s*(:[\s\S]*?)?$/.test(src.slice(m.index, i)) && /[>)\s]\s*$/.test(src.slice(0, i))) break
        brace++
      } else if (c === "}") brace--
    }
    out.set(m[1], src.slice(i + 1).replace(/^\s+/, ""))
  }
  return out
}

test("every exported admin server action calls requireAdmin() first", () => {
  const files = walk(join(ROOT, "app/admin"), (n) => n === "actions.ts")
  assert.ok(files.length >= 4)
  const failures: string[] = []
  for (const f of files) {
    const src = readFileSync(f, "utf8")
    assert.match(src, /^["']use server["']/m, `${f} should be a use-server file`)
    for (const [name, body] of exportedAsyncBodies(src)) {
      if (!/^await requireAdmin\(\)/.test(body)) failures.push(`${relative(ROOT, f)}:${name}`)
    }
  }
  assert.deepEqual(failures, [])
})

test("the only public server action is the view counter, and it is not in the admin tree", () => {
  const src = readFileSync(join(ROOT, "lib/view-actions.ts"), "utf8")
  assert.deepEqual([...exportedAsyncBodies(src).keys()], ["incrementArticleViewAction"])
  for (const f of walk(join(ROOT, "app/admin"), (n) => n.endsWith(".ts") || n.endsWith(".tsx"))) {
    assert.ok(!readFileSync(f, "utf8").includes("incrementArticleViewAction"), relative(ROOT, f))
  }
})

/** Routes that are intentionally public (read-only, cacheable). */
const PUBLIC_ROUTES = new Set(["app/api/exchange-rate/route.ts", "app/api/categories/route.ts"])

test("every API route handler is guarded or explicitly allowlisted as public", () => {
  const files = walk(join(ROOT, "app/api"), (n) => n === "route.ts")
  assert.ok(files.length >= 10)
  const failures: string[] = []
  for (const f of files) {
    const rel = relative(ROOT, f)
    const src = readFileSync(f, "utf8")
    const guarded = /\b(requireAdminApi|requireCronSecret|requireCronOrAdmin)\(/.test(src)
    if (PUBLIC_ROUTES.has(rel)) {
      assert.ok(!/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/.test(src), `${rel}: public routes must be read-only`)
    } else if (!guarded) failures.push(rel)
  }
  assert.deepEqual(failures, [])
})

test("non-cron API routes do not leak err.message", () => {
  for (const f of walk(join(ROOT, "app/api"), (n) => n === "route.ts")) {
    const rel = relative(ROOT, f)
    if (rel.includes("/cron/")) continue
    assert.ok(!/err(or)?\.message/.test(readFileSync(f, "utf8")), rel)
  }
})

test("no node:fs / process.cwd() uploads remain in admin actions", () => {
  for (const f of walk(join(ROOT, "app/admin"), (n) => n === "actions.ts")) {
    const src = readFileSync(f, "utf8")
    assert.ok(!/node:fs|process\.cwd\(\)/.test(src), relative(ROOT, f))
  }
})
