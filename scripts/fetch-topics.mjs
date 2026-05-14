import { writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outFile = join(root, "scripts", "topics.json")

const res = await fetch("http://localhost:3000/api/topics")
if (!res.ok) throw new Error(`Request failed: ${res.status}`)

const data = await res.json()

writeFileSync(outFile, JSON.stringify(data, null, 2), "utf8")
console.log(`Saved ${data.count} topics → ${outFile}`)
