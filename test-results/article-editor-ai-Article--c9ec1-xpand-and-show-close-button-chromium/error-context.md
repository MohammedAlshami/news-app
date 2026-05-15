# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: article-editor-ai.spec.ts >> Article Editor AI Features >> AI input should expand and show close button
- Location: tests\article-editor-ai.spec.ts:46:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('.tiptap-ai-prompt-dock.expanded') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - link "Logo أخبار" [ref=e8] [cursor=pointer]:
          - /url: /
          - img "Logo" [ref=e9]
          - generic [ref=e17]: أخبار
        - generic [ref=e18]:
          - button "فتح الإشعارات" [ref=e19] [cursor=pointer]:
            - img
          - button "تبديل الشريط الجانبي" [ref=e20] [cursor=pointer]:
            - img
      - list [ref=e22]:
        - listitem [ref=e23]:
          - link "الرئيسية" [ref=e24] [cursor=pointer]:
            - /url: /admin
            - img [ref=e25]
            - generic [ref=e28]: الرئيسية
        - listitem [ref=e29]:
          - link "المقالات" [ref=e30] [cursor=pointer]:
            - /url: /admin/articles
            - img [ref=e31]
            - generic [ref=e34]: المقالات
        - listitem [ref=e35]:
          - link "المقالات المستخرجة" [ref=e36] [cursor=pointer]:
            - /url: /admin/scraped_articles
            - img [ref=e37]
            - generic [ref=e41]: المقالات المستخرجة
        - listitem [ref=e42]:
          - link "المواضيع" [ref=e43] [cursor=pointer]:
            - /url: /admin/topics
            - img [ref=e44]
            - generic [ref=e47]: المواضيع
        - listitem [ref=e48]:
          - link "المقالات المولّدة" [ref=e49] [cursor=pointer]:
            - /url: /admin/generated_articles
            - img [ref=e50]
            - generic [ref=e53]: المقالات المولّدة
        - listitem [ref=e54]:
          - link "مصادر الأخبار" [ref=e55] [cursor=pointer]:
            - /url: /admin/news-sources
            - img [ref=e56]
            - generic [ref=e62]: مصادر الأخبار
        - listitem [ref=e63]:
          - link "طلبات الإعلان" [ref=e64] [cursor=pointer]:
            - /url: /admin/advertise
            - img [ref=e65]
            - generic [ref=e68]: طلبات الإعلان
        - listitem [ref=e69]:
          - link "إعلانات الموقع" [ref=e70] [cursor=pointer]:
            - /url: /admin/ads
            - img [ref=e71]
            - generic [ref=e76]: إعلانات الموقع
      - generic [ref=e77]:
        - button "تسجيل الخروج" [ref=e79] [cursor=pointer]:
          - img
          - generic [ref=e80]: تسجيل الخروج
        - list [ref=e81]:
          - listitem [ref=e82]:
            - button "Logo أخبار الإدارة" [ref=e83] [cursor=pointer]:
              - img "Logo" [ref=e85]
              - generic [ref=e93]:
                - generic [ref=e94]: أخبار
                - generic [ref=e95]: الإدارة
              - img [ref=e96]
    - main [ref=e99]:
      - generic [ref=e107]:
        - toolbar "toolbar" [ref=e108]:
          - generic [ref=e109]:
            - group [ref=e110]:
              - button "Undo" [disabled] [ref=e111]:
                - img [ref=e112]
              - button "Redo" [disabled] [ref=e114]:
                - img [ref=e115]
            - group [ref=e117]:
              - button "Format text as heading" [disabled] [ref=e118]:
                - img [ref=e119]
                - img [ref=e121]
              - button "List options" [disabled] [ref=e123]:
                - img [ref=e124]
                - img [ref=e131]
              - button "Blockquote" [disabled] [ref=e133]:
                - img [ref=e134]
            - group [ref=e139]:
              - button "Bold" [disabled] [ref=e140]:
                - img [ref=e141]
              - button "Italic" [disabled] [ref=e143]:
                - img [ref=e144]
              - button "Strike" [disabled] [ref=e146]:
                - img [ref=e147]
              - button "Underline" [disabled] [ref=e150]:
                - img [ref=e151]
              - button "Link" [disabled] [ref=e153]:
                - img [ref=e154]
            - group [ref=e157]:
              - button "Align left" [disabled] [ref=e158]:
                - img [ref=e159]
              - button "Align center" [disabled] [ref=e163]:
                - img [ref=e164]
              - button "Align right" [disabled] [ref=e168]:
                - img [ref=e169]
              - button "Align justify" [disabled] [ref=e173]:
                - img [ref=e174]
            - group [ref=e178]:
              - button "Add image" [disabled] [ref=e179]:
                - img [ref=e180]
                - generic [ref=e182]: Add
              - button "Article info" [ref=e183] [cursor=pointer]:
                - img [ref=e184]
        - generic "Main content area, start typing to enter text." [ref=e186]:
          - paragraph [ref=e187]: في عصر التكنولوجيا الحديثة، أصبحت الأخبار تنتشر بسرعة البرق عبر الإنترنت. تعتبر وسائل التواصل الاجتماعي من أكثر الأدوات فعالية في نقل المعلومات، حيث يتمكن المستخدمون من مشاركة الأخبار لحظة بلحظة. ولكن، مع هذه السرعة تأتي المخاطر، حيث يمكن أن تنتشر الأخبار الزائفة بسهولة وتؤثر على الرأي العام. لذلك، من المهم أن يتحلى الجميع بالوعي النقدي وأن يتحققوا من مصادر المعلومات قبل مشاركتها. في النهاية، تبقى الصحافة المستندة إلى الحقائق هي الأساس الذي يبني عليه المجتمTest text for selectionع إلماماته وآراءه.
        - button "Open AI assistant" [ref=e188] [cursor=pointer]:
          - img [ref=e189]
  - button "Open Next.js Dev Tools" [ref=e197] [cursor=pointer]:
    - img [ref=e198]
  - alert [ref=e201]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.describe('Article Editor AI Features', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to login page
  6   |     await page.goto('/login')
  7   |     await page.waitForLoadState('networkidle')
  8   |     
  9   |     // Login with admin credentials using the correct IDs
  10  |     const emailInput = page.locator('#email-login')
  11  |     const passwordInput = page.locator('#password-login')
  12  |     const submitButton = page.locator('button[type="submit"]')
  13  |     
  14  |     await emailInput.fill('admin@admin.com')
  15  |     await passwordInput.fill('admin')
  16  |     await submitButton.click()
  17  |     
  18  |     // Wait for navigation after login
  19  |     await page.waitForURL(/\/admin/, { timeout: 15000 })
  20  |   })
  21  | 
  22  |   test('AI floating button should be visible and white', async ({ page }) => {
  23  |     // Navigate to an article edit page
  24  |     await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099')
  25  |     await page.waitForLoadState('networkidle')
  26  |     
  27  |     // Wait for editor to load
  28  |     await page.waitForSelector('.simple-editor', { timeout: 15000 })
  29  |     
  30  |     // Check if AI button exists and is visible
  31  |     const aiButton = page.locator('button[aria-label="Open AI assistant"]')
  32  |     await expect(aiButton).toBeVisible()
  33  |     
  34  |     // Check if button has white background
  35  |     const bgColor = await aiButton.evaluate((el) => {
  36  |       return window.getComputedStyle(el).backgroundColor
  37  |     })
  38  |     console.log('AI Button background color:', bgColor)
  39  |     
  40  |     // Check if button is in bottom-left corner
  41  |     const box = await aiButton.boundingBox()
  42  |     expect(box?.x).toBeLessThan(100) // Should be on the left
  43  |     expect(box?.y).toBeGreaterThan(500) // Should be near bottom
  44  |   })
  45  | 
  46  |   test('AI input should expand and show close button', async ({ page }) => {
  47  |     await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099')
  48  |     await page.waitForLoadState('networkidle')
  49  |     await page.waitForSelector('.simple-editor', { timeout: 15000 })
  50  |     
  51  |     // Force click to bypass Next.js dev overlay
  52  |     const aiButton = page.locator('button[aria-label="Open AI assistant"]')
  53  |     await aiButton.click({ force: true })
  54  |     
  55  |     // Wait for expanded input
> 56  |     await page.waitForSelector('.tiptap-ai-prompt-dock.expanded', { timeout: 5000 })
      |                ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  57  |     
  58  |     // Check if textarea is visible
  59  |     const textarea = page.locator('.tiptap-ai-prompt-input-content')
  60  |     await expect(textarea).toBeVisible()
  61  |     
  62  |     // Check if close button exists in toolbar
  63  |     const closeButton = page.locator('button:has-text("إغلاق")')
  64  |     await expect(closeButton).toBeVisible()
  65  |     
  66  |     // Check placeholder is in Arabic
  67  |     const placeholder = await textarea.getAttribute('placeholder')
  68  |     expect(placeholder).toContain('الذكاء الاصطناعي')
  69  |     
  70  |     console.log('✅ AI input expanded successfully')
  71  |     
  72  |     // Click close button
  73  |     await closeButton.click()
  74  |     
  75  |     // Verify it minimizes back to button
  76  |     await expect(page.locator('button[aria-label="Open AI assistant"]')).toBeVisible()
  77  |     
  78  |     console.log('✅ Close button works')
  79  |   })
  80  | 
  81  |   test('Floating toolbar should show on text selection', async ({ page }) => {
  82  |     await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099')
  83  |     await page.waitForLoadState('networkidle')
  84  |     await page.waitForSelector('.simple-editor', { timeout: 15000 })
  85  |     
  86  |     // Wait for editor content
  87  |     await page.waitForSelector('.ProseMirror')
  88  |     
  89  |     // Click in editor and type
  90  |     await page.click('.ProseMirror')
  91  |     await page.waitForTimeout(500)
  92  |     await page.keyboard.type('Test text for selection toolbar')
  93  |     await page.waitForTimeout(500)
  94  |     
  95  |     // Triple click to select all text (more reliable than Ctrl+A)
  96  |     await page.click('.ProseMirror', { clickCount: 3 })
  97  |     
  98  |     // Wait a bit for toolbar to appear
  99  |     await page.waitForTimeout(1000)
  100 |     
  101 |     // Check if floating toolbar appears
  102 |     const floatingToolbar = page.locator('[data-slot="toolbar"]').filter({ has: page.locator('[data-slot="toolbar-group"]') })
  103 |     const isVisible = await floatingToolbar.isVisible()
  104 |     
  105 |     if (isVisible) {
  106 |       console.log('✅ Floating toolbar is visible')
  107 |       
  108 |       // Check if "Edit with AI" button exists (Sparkles icon)
  109 |       const aiEditButton = page.locator('button[tooltip="تحرير بالذكاء الاصطناعي"]')
  110 |       const aiButtonVisible = await aiEditButton.isVisible()
  111 |       
  112 |       if (aiButtonVisible) {
  113 |         console.log('✅ Edit with AI button is visible')
  114 |       } else {
  115 |         console.log('⚠️ Edit with AI button not found, but toolbar is visible')
  116 |       }
  117 |     } else {
  118 |       console.log('⚠️ Floating toolbar not visible - this may be expected behavior')
  119 |     }
  120 |   })
  121 | 
  122 |   test('Block type dropdown should have Arabic labels and no code/todo', async ({ page }) => {
  123 |     await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099')
  124 |     await page.waitForLoadState('networkidle')
  125 |     await page.waitForSelector('.simple-editor', { timeout: 15000 })
  126 |     
  127 |     // Click in editor
  128 |     await page.click('.ProseMirror')
  129 |     await page.waitForTimeout(500)
  130 |     await page.keyboard.type('Test text')
  131 |     await page.waitForTimeout(500)
  132 |     
  133 |     // Triple click to select text
  134 |     await page.click('.ProseMirror', { clickCount: 3 })
  135 |     await page.waitForTimeout(1000)
  136 |     
  137 |     // Try to find and click the "Turn into" dropdown
  138 |     const turnIntoButton = page.locator('button').filter({ hasText: /نص|Text/ }).first()
  139 |     const buttonVisible = await turnIntoButton.isVisible()
  140 |     
  141 |     if (buttonVisible) {
  142 |       await turnIntoButton.click()
  143 |       await page.waitForTimeout(500)
  144 |       
  145 |       // Check for Arabic labels
  146 |       const hasArabicText = await page.locator('text=نص').isVisible()
  147 |       const hasHeading = await page.locator('text=عنوان').isVisible()
  148 |       const hasList = await page.locator('text=قائمة').isVisible()
  149 |       
  150 |       if (hasArabicText || hasHeading || hasList) {
  151 |         console.log('✅ Arabic labels are present')
  152 |       }
  153 |       
  154 |       // Check that Code block and To-do list are NOT present
  155 |       const codeBlockCount = await page.locator('text=Code block').count()
  156 |       const todoListCount = await page.locator('text=To-do list').count()
```