import { test, expect } from "@playwright/test"

test.describe.configure({ mode: "serial" })

test.describe("Access control", () => {
  test("visitor is redirected to /login when accessing /admin", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test("visitor is redirected to /login when accessing /user", async ({ page }) => {
    await page.goto("/user")
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test("visitor is redirected to /login when accessing /notion-like", async ({ page }) => {
    await page.goto("/notion-like")
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test("subscriber user (sub@test.com) gets /user after login and cannot access /admin", async ({ page }) => {
    await page.goto("/login")
    await page.locator("#email-login").fill("sub@test.com")
    await page.locator("#password-login").fill("sub")
    await page.locator("button[type='submit']").click()
    await expect(page).toHaveURL(/\/user/, { timeout: 15000 })

    await page.goto("/admin")
    await expect(page).toHaveURL(/\/user/, { timeout: 15000 })
  })

  test("admin user (admin@admin.com) can access /admin after login", async ({ page }) => {
    await page.goto("/login")
    await page.locator("#email-login").fill("admin@admin.com")
    await page.locator("#password-login").fill("admin")
    await page.locator("button[type='submit']").click()
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
  })

  test("404 page shows custom Arabic not-found at /f", async ({ page }) => {
    const response = await page.goto("/f")
    expect(response?.status()).toBe(404)
    await expect(page.getByText("404").first()).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByRole("heading", { name: "الصفحة غير موجودة" }),
    ).toBeVisible({ timeout: 5000 })
  })
})
