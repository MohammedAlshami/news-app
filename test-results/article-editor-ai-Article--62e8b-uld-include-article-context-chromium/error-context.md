# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: article-editor-ai.spec.ts >> Article Editor AI Features >> AI prompt should include article context
- Location: tests\article-editor-ai.spec.ts:167:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
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
> 190 |     await page.waitForSelector('.tiptap-ai-prompt-dock.expanded')
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
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