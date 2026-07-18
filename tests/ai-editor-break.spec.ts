import { test, expect } from "@playwright/test"

const BASE = "https://news-site.mshami2021.workers.dev"
const EMAIL = "admin@admin.com"
const PASSWORD = "admin"

async function login(page: any) {
  await page.goto(BASE + "/login")
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/admin/)
}

test.describe("AI Editor - Page Break Test", () => {
  test("AI inline prompt does not break page", async ({ page }) => {
    await login(page)
    await page.goto(BASE + "/admin/articles/bf4d9f8c-a456-4fcb-b98c-b683ddf3091a")
    await page.waitForTimeout(3000)

    const body = page.locator("body")
    await expect(body).not.toContainText("not found")
    await expect(body).not.toContainText("went wrong")
    await expect(body).not.toContainText("500")

    const aiInput = page.locator("textarea").first()
    if (await aiInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiInput.fill("اكتب جملة عن التكنولوجيا")
      await page.keyboard.press("Enter")
      await page.waitForTimeout(8000)
      await expect(body).not.toContainText("not found")
      await expect(body).not.toContainText("went wrong")
      await expect(body).not.toContainText("500")
    }
  })

  test("select text and trigger AI action", async ({ page }) => {
    await login(page)
    await page.goto(BASE + "/admin/articles/bf4d9f8c-a456-4fcb-b98c-b683ddf3091a")
    await page.waitForTimeout(3000)

    const body = page.locator("body")
    const editor = page.locator(".tiptap, .ProseMirror, [contenteditable=true]").first()

    if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await editor.textContent()
      if (text && text.length > 10) {
        await editor.click()
        await page.mouse.dblclick(100, 100)
        await page.waitForTimeout(1000)

        await page.keyboard.press("Enter")
        await page.waitForTimeout(5000)
        await expect(body).not.toContainText("not found")
        await expect(body).not.toContainText("went wrong")
      }
    }
  })

  test("call AI API and check page stable", async ({ page }) => {
    await login(page)
    await page.goto(BASE + "/admin/articles/bf4d9f8c-a456-4fcb-b98c-b683ddf3091a")
    await page.waitForTimeout(3000)

    const body = page.locator("body")
    await expect(body).not.toContainText("not found")
    await expect(body).not.toContainText("went wrong")

    const response = await page.request.post(BASE + "/api/ai", {
      data: { prompt: "اكتب جملة عن القراءة", editorInline: true },
    })
    expect(response.ok()).toBeTruthy()
    await page.waitForTimeout(2000)
    await expect(body).not.toContainText("not found")
    await expect(body).not.toContainText("went wrong")
  })
})
