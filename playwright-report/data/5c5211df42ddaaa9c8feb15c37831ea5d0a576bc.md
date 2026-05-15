# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: article-editor-ai.spec.ts >> Article Editor AI Features >> Block type dropdown should have Arabic labels and no code/todo
- Location: tests\article-editor-ai.spec.ts:122:3

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('text=نص') resolved to 2 elements:
    1) <span class="tiptap-button-text">نص</span> aka getByLabel('Turn into (current: نص)')
    2) <span class="tiptap-button-text">نص</span> aka getByRole('menuitem', { name: 'Text' })

Call log:
    - checking visibility of locator('text=نص')

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - generic:
        - generic:
          - generic:
            - generic:
              - link:
                - /url: /
                - img
                - generic: أخبار
              - generic:
                - button:
                  - img
                - button:
                  - img
            - generic:
              - list:
                - listitem:
                  - link:
                    - /url: /admin
                    - img
                    - generic: الرئيسية
                - listitem:
                  - link:
                    - /url: /admin/articles
                    - img
                    - generic: المقالات
                - listitem:
                  - link:
                    - /url: /admin/scraped_articles
                    - img
                    - generic: المقالات المستخرجة
                - listitem:
                  - link:
                    - /url: /admin/topics
                    - img
                    - generic: المواضيع
                - listitem:
                  - link:
                    - /url: /admin/generated_articles
                    - img
                    - generic: المقالات المولّدة
                - listitem:
                  - link:
                    - /url: /admin/news-sources
                    - img
                    - generic: مصادر الأخبار
                - listitem:
                  - link:
                    - /url: /admin/advertise
                    - img
                    - generic: طلبات الإعلان
                - listitem:
                  - link:
                    - /url: /admin/ads
                    - img
                    - generic: إعلانات الموقع
            - generic:
              - generic:
                - button:
                  - img
                  - generic: تسجيل الخروج
              - list:
                - listitem:
                  - button:
                    - generic:
                      - img
                    - generic:
                      - generic: أخبار
                      - generic: الإدارة
                    - img
      - main:
        - generic:
          - generic:
            - status: تم حفظ المقال.
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - toolbar:
                          - generic:
                            - group:
                              - button:
                                - img
                              - button [disabled]:
                                - img
                            - group:
                              - button:
                                - img
                                - img
                              - button:
                                - img
                                - img
                              - button:
                                - img
                            - group:
                              - button:
                                - img
                              - button:
                                - img
                              - button:
                                - img
                              - button:
                                - img
                              - button:
                                - img
                            - group:
                              - button:
                                - img
                              - button:
                                - img
                              - button:
                                - img
                              - button:
                                - img
                            - group:
                              - button:
                                - img
                                - generic: Add
                              - button:
                                - img
                        - generic:
                          - paragraph: في عصر التكنولوجيا الحديثة، أصبحت الأخبار تنتشر بسرعة البرق عبر الإنترنت. تعتبر وسائل التواصل الاجتماعي من أكثر الأدوات فعالية في نقل المعلومات، حيث يتمكن المستخدمون من مشاركة الأخبار لحظة بلحظة. ولكن، مع هذه السرعة تأتي المخاطر، حيث يمكن أن تنتشر الأخبار الزائفة بسهولة وتؤثر على الرأي العام. لذلك، من المهم أن يتحلى الجميع بالوعي النقدي وأن يتحققوا من مصادر المعلومات قبل مشاركتها. في النهاية، تبقى الصحافة المستندة إلى الحقائق هي الأساس الذي يبني عليه المجتمTest textTest text for selectionع إلماماته وآراءه.
                        - button:
                          - img
                        - generic:
                          - toolbar:
                            - group:
                              - button [expanded]:
                                - generic: نص
                                - img
                            - group:
                              - button:
                                - img
                              - button:
                                - img
                              - button:
                                - img
                              - button:
                                - img
                            - group:
                              - button:
                                - img
                            - group:
                              - button:
                                - img
                            - group:
                              - button:
                                - img
  - button "Open Next.js Dev Tools" [ref=e6] [cursor=pointer]:
    - img [ref=e7]
  - alert
  - 'menu "Turn into (current: نص)" [active] [ref=e10]':
    - group [ref=e11]:
      - generic [ref=e12]: Turn into
      - menuitem "Text" [ref=e13] [cursor=pointer]:
        - img [ref=e14]
        - generic [ref=e16]: نص
      - menuitem "Heading 1" [ref=e17] [cursor=pointer]:
        - img [ref=e18]
        - generic [ref=e21]: عنوان 1
      - menuitem "Heading 2" [ref=e22] [cursor=pointer]:
        - img [ref=e23]
        - generic [ref=e26]: عنوان 2
      - menuitem "Heading 3" [ref=e27] [cursor=pointer]:
        - img [ref=e28]
        - generic [ref=e32]: عنوان 3
      - menuitem "Bullet List" [ref=e33] [cursor=pointer]:
        - img [ref=e34]
        - generic [ref=e41]: قائمة نقطية
      - menuitem "Ordered List" [ref=e42] [cursor=pointer]:
        - img [ref=e43]
        - generic [ref=e50]: قائمة مرقمة
      - menuitem "Blockquote" [ref=e51] [cursor=pointer]:
        - img [ref=e52]
        - generic [ref=e57]: اقتباس
```

# Test source

```ts
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
  56  |     await page.waitForSelector('.tiptap-ai-prompt-dock.expanded', { timeout: 5000 })
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
> 146 |       const hasArabicText = await page.locator('text=نص').isVisible()
      |                                                           ^ Error: locator.isVisible: Error: strict mode violation: locator('text=نص') resolved to 2 elements:
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
  157 |       
  158 |       expect(codeBlockCount).toBe(0)
  159 |       expect(todoListCount).toBe(0)
  160 |       
  161 |       console.log('✅ Code block and To-do list are removed')
  162 |     } else {
  163 |       console.log('⚠️ Turn into button not visible - floating toolbar may not have appeared')
  164 |     }
  165 |   })
  166 | 
  167 |   test('AI prompt should include article context', async ({ page }) => {
  168 |     await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099')
  169 |     await page.waitForLoadState('networkidle')
  170 |     await page.waitForSelector('.simple-editor', { timeout: 15000 })
  171 |     
  172 |     // Open the article info sheet to access title input
  173 |     const infoButton = page.locator('button[aria-label="Article info"]')
  174 |     await infoButton.click()
  175 |     await page.waitForTimeout(1000)
  176 |     
  177 |     // Get article title from input in the sheet
  178 |     const titleInput = page.locator('input[name="title"]')
  179 |     const title = await titleInput.inputValue()
  180 |     
  181 |     console.log('Article title:', title)
  182 |     
  183 |     // Close the sheet
  184 |     await page.keyboard.press('Escape')
  185 |     await page.waitForTimeout(500)
  186 |     
  187 |     // Expand AI input
  188 |     const aiButton = page.locator('button[aria-label="Open AI assistant"]')
  189 |     await aiButton.click({ force: true })
  190 |     await page.waitForSelector('.tiptap-ai-prompt-dock.expanded')
  191 |     
  192 |     // The context should be automatically included when submitting
  193 |     expect(title).toBeTruthy()
  194 |     
  195 |     console.log('✅ Article context is available')
  196 |   })
  197 | })
  198 | 
  199 | test.describe('Article Editor - AI Streaming', () => {
  200 |   test.beforeEach(async ({ page }) => {
  201 |     await page.goto('/login')
  202 |     await page.waitForLoadState('networkidle')
  203 |     
  204 |     const emailInput = page.locator('#email-login')
  205 |     const passwordInput = page.locator('#password-login')
  206 |     const submitButton = page.locator('button[type="submit"]')
  207 |     
  208 |     await emailInput.fill('admin@admin.com')
  209 |     await passwordInput.fill('admin')
  210 |     await submitButton.click()
  211 |     
  212 |     await page.waitForURL(/\/admin/, { timeout: 15000 })
  213 |   })
  214 | 
  215 |   test.skip('AI should stream output directly without accept/reject', async ({ page }) => {
  216 |     await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099')
  217 |     await page.waitForLoadState('networkidle')
  218 |     await page.waitForSelector('.simple-editor', { timeout: 15000 })
  219 |     
  220 |     // Click in editor
  221 |     await page.click('.ProseMirror')
  222 |     
  223 |     // Expand AI input
  224 |     await page.click('button[aria-label="Open AI assistant"]')
  225 |     await page.waitForSelector('.tiptap-ai-prompt-dock.expanded')
  226 |     
  227 |     // Type a prompt
  228 |     const textarea = page.locator('.tiptap-ai-prompt-input-content')
  229 |     await textarea.fill('Write a short sentence about technology')
  230 |     
  231 |     // Submit
  232 |     await page.click('button[aria-label="Submit prompt"]')
  233 |     
  234 |     // Wait a bit for AI to start streaming
  235 |     await page.waitForTimeout(2000)
  236 |     
  237 |     // Check if content appears in editor (streaming)
  238 |     const editorContent = await page.locator('.ProseMirror').textContent()
  239 |     console.log('Editor content after AI:', editorContent)
  240 |     
  241 |     // Note: This test is skipped because it requires OpenRouter API key
  242 |     console.log('✅ AI streaming test structure is correct (skipped - requires API key)')
  243 |   })
  244 | })
  245 | 
```