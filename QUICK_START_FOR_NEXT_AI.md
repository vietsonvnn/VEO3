# 🚀 QUICK START - For Next AI Session

## 📍 Current Situation

**Commit:** `ca8c8b9` - feat: Add Cookie Authentication (WIP)
**Status:** ⚠️ BLOCKED - Cần research Google Labs API endpoints
**Problem:** Vẫn bị 429 quota errors

---

## 🎯 Mục Tiêu

Implement Cookie Authentication để bypass API quota limits (giống tool ABC)

---

## ❓ VẤN ĐỀ CHÍNH

Code hiện tại gọi **SAI API**:

```typescript
// ❌ ĐANG DÙNG (SAI)
https://generativelanguage.googleapis.com/v1beta/...
// Public API → Vẫn bị quota 429

// ✅ CẦN DÙNG (ĐÚNG)
https://labs.google/api/v1/...
// Internal Labs API → Bypass quota
```

---

## 📋 3 BƯỚC ĐỂ FIX

### Bước 1: Capture API Endpoints (5 phút)

```bash
1. Open: https://labs.google/fx/tools/flow
2. Login: guagency014@test.guagency.io.vn
3. F12 → Network → Fetch/XHR
4. Generate 1 test video
5. Find POST request
6. Right-click → Copy as cURL
```

**Save to:** `API_CAPTURE.txt`

### Bước 2: Update Code (15 phút)

**File:** `services/directApiService.ts`

```typescript
// Line 20-30: ENDPOINTS object
private readonly ENDPOINTS = {
  // ❌ Xóa dòng cũ
  GEMINI_GENERATE: 'https://generativelanguage.googleapis.com/...',

  // ✅ Thêm dòng mới (từ Bước 1)
  GEMINI_GENERATE: 'https://labs.google/api/v1/generate',
  // ... other endpoints
};

// Line 100-150: makeRequest method
// ✅ Update headers theo capture
const headers = {
  'authorization': `Bearer ${sessionToken}`, // Từ NextAuth cookie
  'cookie': cookieHeader,
  // ... headers khác từ Bước 1
};
```

### Bước 3: Test (2 phút)

```bash
npm run build
npm run dev
# Open http://localhost:3001
# Generate test video
# Check Logs tab → Không còn 429!
```

---

## 📁 KEY FILES

### Cần Sửa:
- `services/directApiService.ts` - **CHÍNH**
- `services/cookieAuthService.ts` - Auth logic

### Cookies Available:
- `ABC/Whisk_cookie.txt` - Labs cookies
- `Flow_cookie.txt` - Labs cookies

### Documentation:
- **`DEBUG_NOTES.md`** ⭐ **ĐỌC FILE NÀY TRƯỚC**
- `COOKIE_AUTH_GUIDE.md` - User guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details

---

## 🔍 DEBUG CHECKLIST

```bash
# 1. Check current endpoint
grep -A 5 "ENDPOINTS" services/directApiService.ts

# 2. View cookies
cat ABC/Whisk_cookie.txt | jq '.[] | select(.name | contains("session"))'

# 3. Check if dev server running
curl -s http://localhost:3001 | head -1

# 4. View logs
# Open browser → http://localhost:3001 → Logs tab

# 5. Test API call
# Open browser → Create tab → Generate → Check Network tab
```

---

## 💡 NHANH NHẤT

**Nếu có source code tool ABC:**
```bash
# Tìm file Python/JS gọi API
grep -r "labs.google" tool_abc_folder/
grep -r "requests.post" tool_abc_folder/

# Copy API endpoint + headers
# Paste vào directApiService.ts
```

**Hoặc hỏi developer tool ABC:**
- "Bạn đang gọi API endpoint nào?"
- "Request headers như thế nào?"
- "Body format ra sao?"

---

## ⚙️ Useful Commands

```bash
# Start dev
npm run dev

# Build
npm run build

# Git status
git status

# View recent commit
git log -1

# View file changes
git diff HEAD~1 services/directApiService.ts
```

---

## 🎓 Context

**Tool ABC làm gì:**
1. Chrome automation login vào labs.google
2. Export cookies (NextAuth session token)
3. Gọi INTERNAL API của Labs với cookies
4. → Bypass quota!

**Tool này đang làm gì:**
1. ✅ Import cookies thủ công (có rồi)
2. ✅ UI để toggle Cookie Auth (có rồi)
3. ❌ Gọi SAI API (public API thay vì internal)
4. ❌ Vẫn bị 429

**Cần fix:** Điểm 3 - Gọi đúng internal API

---

## 📊 Success Criteria

**Hiện tại:**
```json
{
  "error": {
    "code": 429,
    "message": "exceeded quota"
  }
}
```

**Mục tiêu:**
```json
{
  "video_url": "https://...",
  "status": "success"
}
```

**Logs mục tiêu:**
```
🚀 Using Direct API (Cookie Auth) - Bypassing quota!
✅ API request successful
✅ Video generated
```

---

## 🆘 If Stuck

1. **Read:** `DEBUG_NOTES.md` (chi tiết hơn)
2. **Check:** Git history: `git log --oneline`
3. **Review:** Recent changes: `git diff HEAD~1`
4. **Search:** Code: `grep -r "labs.google" .`

---

## 📞 Quick Summary

**What was done:**
- Cookie auth architecture ✅
- UI components ✅
- Documentation ✅
- Build passes ✅

**What's missing:**
- Correct API endpoints ❌
- Test with real API ❌

**What you need to do:**
1. Capture Labs API endpoints (5 min)
2. Update directApiService.ts (15 min)
3. Test (2 min)

**Total time:** ~22 minutes

---

## 🎯 START HERE

```bash
# 1. Read DEBUG_NOTES.md
cat DEBUG_NOTES.md

# 2. Capture API (Option A)
# Open labs.google → DevTools → Capture

# 2. Or find tool ABC code (Option B)
# Copy API example from tool ABC

# 3. Update code
code services/directApiService.ts

# 4. Test
npm run dev
```

---

**Good luck! 🚀**

Commit: ca8c8b9
Branch: main
Status: Pushed to GitHub
URL: https://github.com/vietsonvnn/VEO3
