import assert from "node:assert/strict"
import { test } from "node:test"

import { isCronAuthorized } from "../../lib/auth/cron"
import { hashPassword, verifyPassword } from "../../lib/auth/password"
import { createSessionToken, verifySessionToken } from "../../lib/auth/session"
import { parseUsers } from "../../lib/auth/users-config"

const SECRET = "x".repeat(40)

test("password hash round-trips and rejects wrong passwords", async () => {
  const h = await hashPassword("correct horse", 1000)
  assert.ok(await verifyPassword("correct horse", h))
  assert.ok(!(await verifyPassword("wrong", h)))
  assert.ok(!(await verifyPassword("correct horse", "garbage")))
  assert.ok(!(await verifyPassword("x", "pbkdf2-sha256$999999999$aa$bb")))
})

test("session token: valid, tampered, expired, wrong secret, malformed", async () => {
  const now = 1_700_000_000_000
  const t = await createSessionToken("user-1", SECRET, now)
  assert.equal(await verifySessionToken(t, SECRET, now + 1000), "user-1")
  assert.equal(await verifySessionToken(t, "y".repeat(40), now), null)
  assert.equal(await verifySessionToken(t, SECRET, now + 8 * 24 * 3600 * 1000), null)
  const [v, p, s] = t.split(".")
  const forged = Buffer.from(JSON.stringify({ u: "admin", e: 9_999_999_999 })).toString("base64url")
  assert.equal(await verifySessionToken(`${v}.${forged}.${s}`, SECRET, now), null)
  assert.equal(await verifySessionToken(`${v}.${p}`, SECRET, now), null)
  assert.equal(await verifySessionToken("9e1c4b7a-raw-uuid", SECRET, now), null)
  assert.equal(await verifySessionToken(undefined, SECRET, now), null)
  assert.equal(await verifySessionToken(t, undefined, now), null)
  await assert.rejects(createSessionToken("u", "short"))
})

test("cron secret: fail closed, bearer and header accepted, wrong rejected", async () => {
  const s = "cron-secret-0123456789"
  assert.equal(await isCronAuthorized(new Headers(), s), false)
  assert.equal(await isCronAuthorized(new Headers({ authorization: `Bearer ${s}` }), undefined), false)
  assert.equal(await isCronAuthorized(new Headers({ authorization: `Bearer ${s}` }), s), true)
  assert.equal(await isCronAuthorized(new Headers({ "x-cron-secret": s }), s), true)
  assert.equal(await isCronAuthorized(new Headers({ authorization: "Bearer nope" }), s), false)
})

test("parseUsers drops malformed entries", () => {
  assert.deepEqual(parseUsers(undefined), [])
  assert.deepEqual(parseUsers("not json"), [])
  const u = parseUsers(
    JSON.stringify([
      { id: "1", email: "a@b.c", role: "admin", passwordHash: "h" },
      { id: 2 },
      { id: "3", email: "x", role: "root", passwordHash: "h" },
    ]),
  )
  assert.equal(u.length, 1)
})
