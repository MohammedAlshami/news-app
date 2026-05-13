import { test, expect, type Page } from '@playwright/test';

test.describe('AI Input Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('On login page');
    
    // Login with admin credentials using the correct IDs
    const emailInput = page.locator('#email-login');
    const passwordInput = page.locator('#password-login');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('admin@admin.com');
    await passwordInput.fill('admin');
    
    console.log('Filled login form');
    
    await submitButton.click();
    
    console.log('Clicked submit');
    
    // Wait for navigation after login - should redirect to /admin
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    
    console.log('Logged in successfully, current URL:', page.url());
    
    // Navigate to the article edit page
    await page.goto('/admin/articles/185cab56-7164-4226-ab1e-f4efef62a099');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    console.log('Navigated to article edit page');
    
    // Wait for editor to load - try multiple selectors
    try {
      await page.waitForSelector('.tiptap-ai-prompt-dock', { timeout: 15000 });
      console.log('✅ AI prompt dock found');
    } catch (e) {
      console.log('❌ AI prompt dock not found, checking for editor...');
      // Check if editor exists at all
      const editorExists = await page.locator('.ProseMirror').count();
      console.log('ProseMirror editors found:', editorExists);
      
      const simpleEditorExists = await page.locator('[class*="simple-editor"]').count();
      console.log('Simple editor elements found:', simpleEditorExists);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/debug-editor-page.png', fullPage: true });
      
      // Log the page HTML to see what's actually there
      const bodyHTML = await page.locator('body').innerHTML();
      console.log('Page HTML length:', bodyHTML.length);
      
      throw e;
    }
  });

  test('AI input should work on first attempt', async ({ page }) => {
    // Wait for the AI input dock to be visible
    const aiInputDock = page.locator('.tiptap-ai-prompt-dock');
    await expect(aiInputDock).toBeVisible({ timeout: 10000 });

    // Find the textarea
    const textarea = page.locator('.tiptap-ai-prompt-input-content');
    
    // Check if textarea is visible
    await expect(textarea).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Textarea is visible');
    
    // Click on the textarea to focus it
    await textarea.click();
    
    // Wait a bit for any focus handlers
    await page.waitForTimeout(500);
    
    // Type in the textarea
    const testPrompt = 'Write a test article about technology';
    await textarea.fill(testPrompt);
    
    console.log('✅ Text entered:', testPrompt);
    
    // Verify the text was entered
    await expect(textarea).toHaveValue(testPrompt);
    
    // Find and click the submit button
    const submitButton = page.locator('.tiptap-ai-prompt-input-toolbar button[data-style="primary"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    console.log('✅ Submit button is visible and enabled');
    
    // Click submit
    await submitButton.click();
    
    console.log('✅ Submit button clicked');
    
    // Verify the textarea was cleared after submission
    await expect(textarea).toHaveValue('', { timeout: 2000 });
    
    console.log('✅✅✅ AI input worked on first attempt!');
  });

  test.skip('AI generation with Accept button', async ({ page }) => {
    const textarea = page.locator('.tiptap-ai-prompt-input-content');
    const submitButton = page.locator('.tiptap-ai-prompt-input-toolbar button[data-style="primary"]');
    
    // Enter a prompt
    await textarea.click();
    await textarea.fill('Write a short paragraph about AI');
    await submitButton.click();
    
    console.log('✅ AI generation started');
    
    // Wait for AI generation to complete - look for accept/reject buttons
    // The AI menu should appear with accept/reject options
    const acceptButton = page.locator('button:has-text("قبول"), button:has-text("Accept"), button[aria-label*="accept" i], button[aria-label*="قبول"]').first();
    
    // Wait for the accept button to appear (AI generation complete)
    await expect(acceptButton).toBeVisible({ timeout: 30000 });
    
    console.log('✅ AI generation completed, Accept button visible');
    
    // Click accept
    await acceptButton.click();
    
    console.log('✅✅✅ Accept button clicked successfully');
    
    // Verify the accept button disappears after clicking
    await expect(acceptButton).not.toBeVisible({ timeout: 5000 });
    
    console.log('✅✅✅ AI generation accepted and applied!');
  });

  test.skip('AI generation with Reject button', async ({ page }) => {
    const textarea = page.locator('.tiptap-ai-prompt-input-content');
    const submitButton = page.locator('.tiptap-ai-prompt-input-toolbar button[data-style="primary"]');
    
    // Enter a prompt
    await textarea.click();
    await textarea.fill('Write a short paragraph about technology');
    await submitButton.click();
    
    console.log('✅ AI generation started');
    
    // Wait for AI generation to complete - look for reject button
    const rejectButton = page.locator('button:has-text("رفض"), button:has-text("Reject"), button:has-text("Discard"), button[aria-label*="reject" i], button[aria-label*="discard" i], button[aria-label*="رفض"]').first();
    
    // Wait for the reject button to appear (AI generation complete)
    await expect(rejectButton).toBeVisible({ timeout: 30000 });
    
    console.log('✅ AI generation completed, Reject button visible');
    
    // Click reject
    await rejectButton.click();
    
    console.log('✅✅✅ Reject button clicked successfully');
    
    // Verify the reject button disappears after clicking
    await expect(rejectButton).not.toBeVisible({ timeout: 5000 });
    
    console.log('✅✅✅ AI generation rejected and discarded!');
  });

  test('AI input should accept input immediately without multiple attempts', async ({ page }) => {
    const textarea = page.locator('.tiptap-ai-prompt-input-content');
    
    // First attempt - should work immediately
    await textarea.click();
    await textarea.fill('First attempt');
    await expect(textarea).toHaveValue('First attempt');
    
    console.log('✅✅✅ First attempt successful!');
  });

  test('Submit button should be disabled when textarea is empty', async ({ page }) => {
    const textarea = page.locator('.tiptap-ai-prompt-input-content');
    const submitButton = page.locator('.tiptap-ai-prompt-input-toolbar button[data-style="primary"]');
    
    // Click textarea but don't type anything
    await textarea.click();
    
    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
    
    console.log('✅ Submit button is disabled when empty');
    
    // Type something
    await textarea.fill('Test');
    
    // Submit button should be enabled
    await expect(submitButton).toBeEnabled();
    
    console.log('✅✅✅ Submit button is enabled when filled');
  });

  test('Tone selector should be visible and clickable', async ({ page }) => {
    const toneButton = page.locator('.tiptap-ai-prompt-input-toolbar button:has-text("النبرة")');
    
    await expect(toneButton).toBeVisible();
    await toneButton.click();
    
    // Dropdown should open
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible({ timeout: 2000 });
    
    console.log('✅✅✅ Tone selector works!');
  });
});
