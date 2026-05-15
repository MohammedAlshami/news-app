# Running AI Editor Tests

## Prerequisites
1. Make sure your development server is running: `npm run dev`
2. Make sure Playwright is installed: `npm install -D @playwright/test`
3. Install browsers if needed: `npx playwright install`

## Run the tests

```bash
# Run all AI editor tests
npx playwright test tests/article-editor-ai.spec.ts

# Run with UI mode (recommended for debugging)
npx playwright test tests/article-editor-ai.spec.ts --ui

# Run specific test
npx playwright test tests/article-editor-ai.spec.ts -g "AI floating button"

# Run in headed mode (see the browser)
npx playwright test tests/article-editor-ai.spec.ts --headed
```

## What the tests verify

1. **AI Floating Button**
   - ✓ Button is visible in bottom-left corner
   - ✓ Button has white background
   - ✓ Button position is correct

2. **AI Input Expansion**
   - ✓ Clicking button expands the input
   - ✓ Textarea is visible with Arabic placeholder
   - ✓ Close button ("إغلاق") is visible in toolbar
   - ✓ Clicking close minimizes back to button

3. **Floating Toolbar on Selection**
   - ✓ Toolbar appears when text is selected
   - ✓ "Edit with AI" button (Sparkles) is present
   - ✓ Highlight button is NOT present

4. **Block Type Dropdown**
   - ✓ Labels are in Arabic (نص, عنوان, قائمة نقطية, etc.)
   - ✓ "Code block" option is removed
   - ✓ "To-do list" option is removed

5. **Article Context**
   - ✓ Article title and excerpt are captured
   - ✓ Context is included in AI prompts

6. **AI Streaming** (Note: Requires OpenRouter API key)
   - ✓ AI output streams directly to editor
   - ✓ No accept/reject buttons needed
   - ✓ Content appears immediately

## Manual Testing Checklist

If you prefer to test manually:

1. **Start dev server**: `npm run dev`
2. **Login**: Go to http://localhost:3000/login
   - Email: admin@admin.com
   - Password: admin
3. **Open article editor**: http://localhost:3000/admin/articles/62d391ac-46a7-4330-bbe2-a98681b6b653
4. **Test AI button**:
   - [ ] White circular button visible in bottom-left
   - [ ] Click to expand
   - [ ] See Arabic placeholder
   - [ ] See "إغلاق" button in toolbar
   - [ ] Click close to minimize
5. **Test text selection**:
   - [ ] Type some text
   - [ ] Select it (Ctrl+A)
   - [ ] Floating toolbar appears
   - [ ] "Edit with AI" button (sparkles icon) is visible
   - [ ] No highlight button
6. **Test block dropdown**:
   - [ ] Click "Turn into" dropdown
   - [ ] See Arabic labels
   - [ ] No "Code block" or "To-do list"
7. **Test AI streaming** (if API key configured):
   - [ ] Expand AI input
   - [ ] Type a prompt
   - [ ] Click send
   - [ ] Content streams directly into editor
   - [ ] No accept/reject needed

## Troubleshooting

- If tests fail with "Timeout", increase timeout in test or check if dev server is running
- If AI streaming doesn't work, check OPENROUTER_API_KEY in .env.local
- If login fails, verify admin credentials in database
