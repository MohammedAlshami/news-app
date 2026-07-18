import { test, expect } from "@playwright/test"

const BASE = "https://news-site.mshami2021.workers.dev"
const EMAIL = "admin@admin.com"
const PASSWORD = "admin"

test.describe("AI Editor", () => {
  test("login, load article, and test AI inline prompt", async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`)
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/admin/)

    // Load article
    await page.goto(`${BASE}/admin/articles/bf4d9f8c-a456-4fcb-b98c-b683ddf3091a`)
    await expect(page.locator("body")).not.toHaveText(/500|error|not found/i)

    // Wait for the editor to load
    await page.waitForTimeout(2000)

    // Test the API directly (simulates what the inline editor does)
    const response = await page.request.post(`${BASE}/api/ai`, {
      data: {
        prompt: "اكتب جملة قصيرة عن أهمية القراءة",
        editorInline: true,
      },
    })
    console.log("Status:", response.status())
    const text = await response.text()
    console.log("AI response:", text.slice(0, 200))
    expect(response.ok()).toBeTruthy()
    expect(text.length).toBeGreaterThan(10)

    // Ensure response doesn't contain markdown or commentary
    expect(text).not.toContain("**")
    expect(text).not.toContain("#")
  })
})
