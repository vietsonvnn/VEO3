# 🧪 TESTING GUIDE - VEO 3.1 Tool

## Quick Start Commands

### 1. Start Development Server

```bash
cd ~/Desktop/whisk-to-veo-3.1-automation-tool
npm run dev
```

**Expected output:**
```
VITE v6.4.1  ready in 111 ms

➜  Local:   http://localhost:3000/
➜  Network: http://127.0.2.2:3000/
```

**Mở browser**: http://localhost:3000

---

### 2. Build for Production

```bash
npm run build
```

**Expected output:**
```
✓ 42 modules transformed.
dist/index.html                  0.83 kB │ gzip:   0.45 kB
dist/assets/index-*.js          437.49 kB │ gzip: 109.83 kB
✓ built in 632ms
```

---

### 3. Preview Production Build

```bash
npm run preview
```

**Mở**: http://localhost:4173

---

## 🔍 Testing Checklist

### ✅ Test 1: Build Check
```bash
npm run build
```

**Pass if:**
- ✓ No TypeScript errors
- ✓ Build completes successfully
- ✓ Output shows bundle size

---

### ✅ Test 2: Dev Server
```bash
npm run dev
```

**Pass if:**
- ✓ Server starts on port 3000
- ✓ No console errors
- ✓ Browser opens automatically (or open manually)

---

### ✅ Test 3: Check Components Load

**Browser**: http://localhost:3000

**Check:**
1. ✓ Header "Whisk → Veo 3.1 Automation" hiển thị
2. ✓ API Key selection screen hiện ra
3. ✓ Không có errors trong Console (F12)

---

### ✅ Test 4: API Key Input (Manual Entry)

**Steps:**
1. Click "Manual Entry" button
2. Nhập API key test: `AIzaSyCHECK_KEY_TEST_12345`
3. Click "Continue"

**Pass if:**
- ✓ Chuyển sang form nhập idea
- ✓ Không có errors

---

### ✅ Test 5: ConfigForm Settings

**Steps:**
1. Sau khi vào form, click "Show Advanced"
2. Check các settings:
   - ✓ Style dropdown: 11 options
   - ✓ Language: 7 options
   - ✓ Duration slider: 0.5-10 minutes
   - ✓ Aspect ratio buttons: 16:9, 9:16
   - ✓ Model dropdown: 4 options
   - ✓ Videos per prompt: 1-4

**Test custom style:**
1. Chọn style = "Custom (nhập tay)"
2. Input field hiện ra
3. Nhập: "retro 80s music video"

**Pass if:** Input field hiện và accept text

---

### ✅ Test 6: Duration Calculation

**Steps:**
1. Drag duration slider
2. Xem "≈ X scenes x 8s = Ys total"

**Test cases:**
- 0.5 min → 4 scenes x 8s = 32s ✓
- 1 min → 8 scenes x 8s = 64s ✓
- 2 min → 15 scenes x 8s = 120s ✓

**Pass if:** Calculation matches

---

### ✅ Test 7: Form Validation

**Steps:**
1. Nhập idea: "A chef cooking in Italian kitchen"
2. Leave script blank (optional)
3. Config:
   - Style: Cinematic
   - Language: Vietnamese
   - Duration: 1 minute
   - Mode: Auto
4. Click "Start Creation Pipeline"

**Pass if:**
- ✓ Button enabled when idea filled
- ✓ Button disabled when idea empty

---

### ✅ Test 8: Console Check

**Browser Console** (F12 → Console):

**Should NOT see:**
- ❌ TypeScript errors
- ❌ Module not found errors
- ❌ React errors

**OK to see:**
- ✓ Logger output (if testing generation)
- ✓ Network requests

---

### ✅ Test 9: LocalStorage

**Browser Console** (F12 → Console):

```javascript
// Test storage service
localStorage.getItem('veo_last_idea')
localStorage.getItem('veo_last_config')
```

**After using form once:**
- ✓ Should return saved data
- ✓ Or null if first time

---

### ✅ Test 10: Check All New Components Render

**Browser → Sources tab:**

Check these files exist:
```
components/
  ├── TabNav.tsx
  ├── SettingsTab.tsx
  ├── LogsTab.tsx
  ├── LogViewer.tsx
  ├── ScenePreviewCard.tsx
  └── ConfigForm.tsx (new version)

services/
  ├── loggerService.ts
  └── storageService.ts
```

---

## 🧪 Advanced Testing

### Test Logger Service

**Console** (F12):
```javascript
// Import logger
import { logger } from './services/loggerService'

// Test logs
logger.info('Test info log')
logger.success('Test success log')
logger.warning('Test warning log')
logger.error('Test error log')

// Export logs
logger.export()
```

**Expected:** Logs show in console and can be exported

---

### Test Storage Service

**Console** (F12):
```javascript
// Import storage
import { storageService } from './services/storageService'

// Save test data
storageService.saveLastIdea('Test idea')
storageService.saveLastScript('Test script')

// Retrieve
storageService.getLastIdea()  // "Test idea"
storageService.getLastScript()  // "Test script"

// Clear
storageService.clearAll()
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Port 3000 already in use

**Error:**
```
Port 3000 is already in use
```

**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

---

### Issue 2: Module not found

**Error:**
```
Module not found: Can't resolve 'X'
```

**Fix:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 3: API Key not working

**Symptoms:**
- API calls fail
- "Requested entity was not found" error

**Check:**
1. API key có đúng format? (AIza...)
2. API key có quyền truy cập Veo 3.1?
3. Check tại: https://aistudio.google.com/app/apikey

**Test với dummy key:**
```javascript
// Should show error but not crash
// This proves error handling works
```

---

### Issue 4: Build errors

**Error:**
```
TS2307: Cannot find module
```

**Fix:**
```bash
# Check TypeScript
npx tsc --noEmit

# If errors, check imports in:
# - App.tsx
# - All components
```

---

## 📊 Performance Testing

### Check Bundle Size

```bash
npm run build
```

**Expected:**
- Total: ~440KB
- Gzipped: ~110KB

**If larger:**
- Check for large dependencies
- Consider code splitting

---

### Check Build Time

```bash
time npm run build
```

**Expected:**
- < 1 second for dev
- < 5 seconds for production

---

## 🔄 Testing Workflow

### Full Test Flow (Without API key)

```bash
# 1. Clean start
npm install

# 2. Check build
npm run build

# 3. Start dev
npm run dev

# 4. Browser → http://localhost:3000

# 5. Check UI loads
# 6. Try manual API entry
# 7. Fill form with test data
# 8. Check validation
# 9. Open browser console - no errors
# 10. Stop server (Ctrl+C)
```

**Expected time:** 2-3 minutes

---

### Full Test Flow (With API key)

```bash
# 1. Start server
npm run dev

# 2. Browser → http://localhost:3000

# 3. Enter real API key

# 4. Fill form:
#    - Idea: "A chef cooking pasta"
#    - Script: (leave blank)
#    - Duration: 0.5 min (4 scenes)
#    - Mode: Auto

# 5. Click "Start Creation Pipeline"

# 6. Watch logs in console

# 7. Check:
#    - Prompts generated ✓
#    - Character variations ✓
#    - Scenes created ✓
#    - Videos generated ✓
```

**Expected time:** 5-10 minutes (depends on API)

---

## 📝 Test Report Template

```markdown
## Test Report

**Date:** 2025-10-24
**Tester:** [Your name]
**Build:** [git commit hash]

### Environment
- Node version:
- npm version:
- OS: macOS
- Browser:

### Tests Run
- [ ] Build check
- [ ] Dev server
- [ ] Components load
- [ ] API key input
- [ ] ConfigForm settings
- [ ] Duration calculation
- [ ] Form validation
- [ ] Console check
- [ ] LocalStorage
- [ ] Logger service
- [ ] Storage service

### Issues Found
1. [Issue description]
2. [Issue description]

### Pass/Fail
- Total tests: X
- Passed: Y
- Failed: Z

### Notes
[Additional observations]
```

---

## 🎯 Quick Test Commands

### Test Everything (Automated)

```bash
# Run all checks
npm install && \
npm run build && \
echo "✅ Build successful" && \
npm run dev
```

### Clean Restart

```bash
# Full clean
rm -rf node_modules package-lock.json dist
npm install
npm run dev
```

### Check Dependencies

```bash
# List installed
npm list --depth=0

# Check outdated
npm outdated

# Audit security
npm audit
```

---

## 🚀 Ready to Test?

### Minimal Test (1 minute)

```bash
cd ~/Desktop/whisk-to-veo-3.1-automation-tool
npm run build
npm run dev
```

Open browser → Check UI loads → Done ✓

---

### Full Test (5 minutes)

```bash
cd ~/Desktop/whisk-to-veo-3.1-automation-tool
npm run build                    # 1 min
npm run dev                      # Start server
# Open browser                   # 2 min
# Fill form & test               # 2 min
# Ctrl+C to stop
```

---

## 📞 Support

**If stuck:**
1. Check [UPDATE_SUMMARY.md](UPDATE_SUMMARY.md)
2. Check browser console (F12)
3. Check terminal output
4. Read error messages carefully

**Common commands:**
```bash
# Restart
Ctrl+C
npm run dev

# Full restart
rm -rf node_modules
npm install
npm run dev

# Check status
npm list
git status
```

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**
