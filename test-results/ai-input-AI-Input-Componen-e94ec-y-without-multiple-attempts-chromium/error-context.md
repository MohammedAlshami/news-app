# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-input.spec.ts >> AI Input Component >> AI input should accept input immediately without multiple attempts
- Location: tests\ai-input.spec.ts:171:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]: مساحة إعلانية (728 × 90)
    - navigation "أخبار" [ref=e5]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - link "نـبـض" [ref=e10] [cursor=pointer]:
            - /url: /
            - generic [ref=e13]: نـبـض
          - generic [ref=e14]:
            - link "أخبار" [ref=e15] [cursor=pointer]:
              - /url: /category/all
            - link "اقتصاد" [ref=e16] [cursor=pointer]:
              - /url: /category/economy
            - link "تكنولوجيا" [ref=e17] [cursor=pointer]:
              - /url: /category/technology
            - link "رياضة" [ref=e18] [cursor=pointer]:
              - /url: /category/sports
            - link "سياسة" [ref=e19] [cursor=pointer]:
              - /url: /category/politics
            - link "أعلن معنا" [ref=e20] [cursor=pointer]:
              - /url: /advertise
        - generic [ref=e21]:
          - link "البحث في الموقع" [ref=e22] [cursor=pointer]:
            - /url: /search
            - img [ref=e23]
            - generic [ref=e26]: بحث
          - link "حساب المستخدم" [ref=e27] [cursor=pointer]:
            - /url: /admin
            - img [ref=e28]
            - generic [ref=e31]: حسابي
    - main [ref=e32]:
      - generic [ref=e35]:
        - generic [ref=e37]:
          - generic [ref=e38]: تسجيل الدخول | أخبار
          - heading "سجّل دخولك" [level=1] [ref=e39]
          - paragraph [ref=e40]: تسجيل الدخول إلى «أخبار».
          - generic [ref=e41]:
            - generic [ref=e42]:
              - paragraph [ref=e43]: "01"
              - paragraph [ref=e44]: دخول سريع
              - paragraph [ref=e45]: سجّل دخولك للوصول إلى لوحة الإدارة ومتابعة أدوات الموقع.
            - generic [ref=e46]:
              - paragraph [ref=e47]: "02"
              - paragraph [ref=e48]: حفظ الجلسة
              - paragraph [ref=e49]: نحتفظ بجلسة العمل حتى تنتقل بين الصفحات بسلاسة.
        - generic [ref=e52]:
          - generic [ref=e53]:
            - img [ref=e54]
            - paragraph [ref=e62]: أخبار
          - heading "سجّل دخولك" [level=1] [ref=e63]
          - generic [ref=e64]:
            - generic [ref=e65]:
              - generic [ref=e66]: البريد الإلكتروني
              - textbox "البريد الإلكتروني" [ref=e67]:
                - /placeholder: you@example.com
                - text: admin@admin.com
            - generic [ref=e68]:
              - generic [ref=e69]: كلمة المرور
              - textbox "كلمة المرور" [ref=e70]:
                - /placeholder: ••••••••
                - text: admin
            - button "دخول" [disabled]
    - contentinfo [ref=e71]:
      - generic [ref=e72]:
        - generic [ref=e73]:
          - generic [ref=e74]:
            - generic [ref=e75]:
              - img [ref=e77]
              - generic [ref=e79]: نـبـض
            - paragraph [ref=e80]: من خلال تعاوننا المستمر وحلول تصميم مبتكرة، نحوّل الرؤى إلى واقع يجمع بين الوظيفة والتعبير.
            - generic [ref=e81]:
              - link "تلغرام" [ref=e82] [cursor=pointer]:
                - /url: "#"
                - img [ref=e83]
              - link "فيسبوك" [ref=e86] [cursor=pointer]:
                - /url: https://facebook.com
                - img [ref=e87]
              - link "لينكد إن" [ref=e89] [cursor=pointer]:
                - /url: https://linkedin.com
                - img [ref=e90]
          - generic [ref=e92]:
            - heading "الصفحات" [level=3] [ref=e93]
            - list [ref=e94]:
              - listitem [ref=e95]:
                - link "الرئيسية" [ref=e96] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e97]:
                - link "من نحن" [ref=e98] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e99]:
                - link "الأحداث" [ref=e100] [cursor=pointer]:
                  - /url: /category/all
              - listitem [ref=e101]:
                - link "محول العملات" [ref=e102] [cursor=pointer]:
                  - /url: /tools/currency-converter
          - generic [ref=e103]:
            - heading "الدعم" [level=3] [ref=e104]
            - list [ref=e105]:
              - listitem [ref=e106]:
                - link "اتصل بنا" [ref=e107] [cursor=pointer]:
                  - /url: /advertise
              - listitem [ref=e108]:
                - link "سياسة الخصوصية" [ref=e109] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e110]:
                - link "شروط الاستخدام" [ref=e111] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e112]:
            - heading "العنوان" [level=3] [ref=e113]
            - generic [ref=e114]:
              - paragraph [ref=e115]: ٩٤٠ إيميلي هاتسون
              - paragraph [ref=e116]: طريق جولدنديل، واسيلا، ألاسكا
              - paragraph [ref=e117]: ٩٩٦٥٤، الولايات المتحدة
            - link "عرض على الخريطة" [ref=e118] [cursor=pointer]:
              - /url: https://maps.google.com/?q=Wasilla+AK+99654
              - img [ref=e119]
              - generic [ref=e122]: عرض على الخريطة
        - paragraph [ref=e124]: © 2026 منصة نبض الإخبارية. جميع الحقوق محفوظة.
  - button "Open Next.js Dev Tools" [ref=e130] [cursor=pointer]:
    - generic [ref=e133]:
      - text: Rendering
      - generic [ref=e134]:
        - generic [ref=e135]: .
        - generic [ref=e136]: .
        - generic [ref=e137]: .
  - alert [ref=e138]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | test.describe('AI Input Component', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to login page
  6   |     await page.goto('/login');
  7   |     
  8   |     // Wait for page to load
  9   |     await page.waitForLoadState('networkidle');
  10  |     
  11  |     console.log('On login page');
  12  |     
  13  |     // Login with admin credentials using the correct IDs
  14  |     const emailInput = page.locator('#email-login');
  15  |     const passwordInput = page.locator('#password-login');
  16  |     const submitButton = page.locator('button[type="submit"]');
  17  |     
  18  |     await emailInput.fill('admin@admin.com');
  19  |     await passwordInput.fill('admin');
  20  |     
  21  |     console.log('Filled login form');
  22  |     
  23  |     await submitButton.click();
  24  |     
  25  |     console.log('Clicked submit');
  26  |     
  27  |     // Wait for navigation after login - should redirect to /admin
> 28  |     await page.waitForURL(/\/admin/, { timeout: 15000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  29  |     
  30  |     console.log('Logged in successfully, current URL:', page.url());
  31  |     
  32  |     // Navigate to the article edit page
  33  |     await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099');
  34  |     
  35  |     // Wait for page to fully load
  36  |     await page.waitForLoadState('networkidle');
  37  |     
  38  |     console.log('Navigated to article edit page');
  39  |     
  40  |     // Wait for editor to load - try multiple selectors
  41  |     try {
  42  |       await page.waitForSelector('.tiptap-ai-prompt-dock', { timeout: 15000 });
  43  |       console.log('✅ AI prompt dock found');
  44  |     } catch (e) {
  45  |       console.log('❌ AI prompt dock not found, checking for editor...');
  46  |       // Check if editor exists at all
  47  |       const editorExists = await page.locator('.ProseMirror').count();
  48  |       console.log('ProseMirror editors found:', editorExists);
  49  |       
  50  |       const simpleEditorExists = await page.locator('[class*="simple-editor"]').count();
  51  |       console.log('Simple editor elements found:', simpleEditorExists);
  52  |       
  53  |       // Take a screenshot for debugging
  54  |       await page.screenshot({ path: 'test-results/debug-editor-page.png', fullPage: true });
  55  |       
  56  |       // Log the page HTML to see what's actually there
  57  |       const bodyHTML = await page.locator('body').innerHTML();
  58  |       console.log('Page HTML length:', bodyHTML.length);
  59  |       
  60  |       throw e;
  61  |     }
  62  |   });
  63  | 
  64  |   test('AI input should work on first attempt', async ({ page }) => {
  65  |     // Wait for the AI input dock to be visible
  66  |     const aiInputDock = page.locator('.tiptap-ai-prompt-dock');
  67  |     await expect(aiInputDock).toBeVisible({ timeout: 10000 });
  68  | 
  69  |     // Find the textarea
  70  |     const textarea = page.locator('.tiptap-ai-prompt-input-content');
  71  |     
  72  |     // Check if textarea is visible
  73  |     await expect(textarea).toBeVisible({ timeout: 5000 });
  74  |     
  75  |     console.log('✅ Textarea is visible');
  76  |     
  77  |     // Click on the textarea to focus it
  78  |     await textarea.click();
  79  |     
  80  |     // Wait a bit for any focus handlers
  81  |     await page.waitForTimeout(500);
  82  |     
  83  |     // Type in the textarea
  84  |     const testPrompt = 'Write a test article about technology';
  85  |     await textarea.fill(testPrompt);
  86  |     
  87  |     console.log('✅ Text entered:', testPrompt);
  88  |     
  89  |     // Verify the text was entered
  90  |     await expect(textarea).toHaveValue(testPrompt);
  91  |     
  92  |     // Find and click the submit button
  93  |     const submitButton = page.locator('.tiptap-ai-prompt-input-toolbar button[data-style="primary"]');
  94  |     await expect(submitButton).toBeVisible();
  95  |     await expect(submitButton).toBeEnabled();
  96  |     
  97  |     console.log('✅ Submit button is visible and enabled');
  98  |     
  99  |     // Click submit
  100 |     await submitButton.click();
  101 |     
  102 |     console.log('✅ Submit button clicked');
  103 |     
  104 |     // Verify the textarea was cleared after submission
  105 |     await expect(textarea).toHaveValue('', { timeout: 2000 });
  106 |     
  107 |     console.log('✅✅✅ AI input worked on first attempt!');
  108 |   });
  109 | 
  110 |   test('AI generation with Accept button', async ({ page }) => {
  111 |     const textarea = page.locator('.tiptap-ai-prompt-input-content');
  112 |     const submitButton = page.locator('.tiptap-ai-prompt-input-toolbar button[data-style="primary"]');
  113 |     
  114 |     // Enter a prompt
  115 |     await textarea.click();
  116 |     await textarea.fill('Write a short paragraph about AI');
  117 |     await submitButton.click();
  118 |     
  119 |     console.log('✅ AI generation started');
  120 |     
  121 |     // Wait for AI generation to complete - look for accept/reject buttons
  122 |     // The AI menu should appear with accept/reject options
  123 |     const acceptButton = page.locator('button:has-text("قبول"), button:has-text("Accept"), button[aria-label*="accept" i], button[aria-label*="قبول"]').first();
  124 |     
  125 |     // Wait for the accept button to appear (AI generation complete)
  126 |     await expect(acceptButton).toBeVisible({ timeout: 30000 });
  127 |     
  128 |     console.log('✅ AI generation completed, Accept button visible');
```