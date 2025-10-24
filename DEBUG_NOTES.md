# 🐛 DEBUG NOTES - Cookie Authentication Issues

## 📋 Current Status

**Date:** 2025-10-24
**Status:** ⚠️ BLOCKED - Cần debug API endpoints

---

## ✅ Đã Hoàn Thành

### 1. Cookie Authentication Architecture
- ✅ Created `cookieAuthService.ts` - Cookie management
- ✅ Created `directApiService.ts` - Direct API calls (nhưng CHƯA ĐÚNG endpoint)
- ✅ Created `hybridApiService.ts` - Auto-switch giữa API Key và Cookie Auth
- ✅ Integrated vào App.tsx
- ✅ UI components (ConfigForm, SettingsTab) với toggle và upload
- ✅ Complete documentation (3 guides)
- ✅ Build success (0 TypeScript errors)

### 2. Files Created
```
services/
  ├── cookieAuthService.ts (289 lines)
  ├── directApiService.ts (453 lines) ⚠️ Sai endpoint
  └── hybridApiService.ts (258 lines)

COOKIE_AUTH_GUIDE.md (400+ lines)
COOKIE_AUTH_UPDATE.md (300+ lines)
IMPLEMENTATION_SUMMARY.md (500+ lines)
```

---

## ❌ VẤN ĐỀ HIỆN TẠI

### Problem 1: Sai Service/API

**Code hiện tại đang target:**
- Service: Google AI Studio (aistudio.google.com)
- API: GenerativeLanguage public API
- Endpoint: `generativelanguage.googleapis.com/v1beta/...`
- Auth: SAPISIDHASH + Google OAuth cookies

**Nhưng cookies thực tế là:**
- Service: Google Labs (labs.google)
- API: Labs Internal API (CHƯA RÕ endpoint)
- Cookies: NextAuth session token
- Domain: `labs.google`

### Problem 2: Vẫn Bị 429 Quota Error

```json
{
  "error": {
    "code": 429,
    "message": "You exceeded your current quota...",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

**Nguyên nhân:**
- Đang gọi public API với cookies → Vẫn bị quota
- Cần gọi INTERNAL API của Labs như tool ABC

### Problem 3: Thiếu Thông Tin Về Tool ABC

**Cần biết:**
- Tool ABC gọi API endpoint NÀO?
- Request headers như thế nào?
- Request body format?
- Response format?

---

## 🔍 CẦN DEBUG

### Task 1: Capture Google Labs API Endpoints

**Steps:**
1. Mở browser: https://labs.google/fx/tools/flow
2. Login với account: guagency014@test.guagency.io.vn
3. F12 → Network tab → Filter: Fetch/XHR
4. Generate 1 video test
5. Capture:
   - Request URL (ví dụ: `labs.google/api/v1/generate`)
   - Request Method (POST/GET)
   - Request Headers (đặc biệt: Authorization, Cookie, X-Goog-*)
   - Request Body
   - Response

**Save to file:** `API_CAPTURE.json`

### Task 2: Hoặc Xem Source Code Tool ABC

**Nếu có source code tool ABC:**
- Tìm file gọi API (thường là Python/JS)
- Copy phần API call
- Paste vào file `TOOL_ABC_API_EXAMPLE.txt`

**Thông tin cần:**
```python
# Example
import requests

url = "https://labs.google/api/???"  # ← CẦN URL NÀY
headers = {
    "authorization": "Bearer ...",   # ← CẦN HEADERS NÀY
    "cookie": "...",
}
data = {...}  # ← CẦN BODY FORMAT NÀY

response = requests.post(url, headers=headers, json=data)
```

### Task 3: So Sánh 2 Services

**Google Labs vs AI Studio:**

| Feature | Google Labs | Google AI Studio |
|---------|-------------|------------------|
| URL | labs.google/fx/tools/flow | aistudio.google.com |
| Cookies | NextAuth session | SAPISID, __Secure-1PSID |
| API | Internal Labs API | GenerativeLanguage API |
| Endpoint | ??? (CẦN TÌM) | generativelanguage.googleapis.com |
| Auth | NextAuth token | SAPISIDHASH |

---

## 📁 Files Hiện Có

### Cookie Files
```
ABC/Whisk_cookie.txt          - Labs.google cookies (updated)
Flow_cookie.txt               - Labs.google cookies (updated)
public/cookie.txt             - Old cookies
```

**Cookie Format:**
```json
[
  {
    "domain": "labs.google",
    "name": "__Secure-next-auth.session-token",
    "value": "eyJhbGciOiJkaXIi...",
    "httpOnly": true,
    "secure": true
  }
]
```

### Service Files (CẦN SỬA)
```
services/directApiService.ts
- Line 30-37: ENDPOINTS object
- ❌ Đang dùng generativelanguage.googleapis.com
- ✅ Cần đổi sang labs.google/api/...

services/cookieAuthService.ts
- Line 50-80: getSAPISIDHash()
- ❌ Dùng SAPISIDHASH (cho Google OAuth)
- ✅ Cần dùng NextAuth token thay vì

services/hybridApiService.ts
- Wrapper, không cần sửa nhiều
```

---

## 🎯 ACTION PLAN

### Phase 1: Research (CẦN LÀM TRƯỚC)

**Option A: Capture từ browser**
```bash
1. Open https://labs.google/fx/tools/flow
2. DevTools → Network
3. Generate test video
4. Export HAR file hoặc copy cURL
5. Analyze endpoints
```

**Option B: Reverse engineer tool ABC**
```bash
1. Tìm source code tool ABC
2. Locate API calling code
3. Copy endpoints + headers
4. Paste vào project này
```

**Option C: Ask tool ABC developer**
```bash
1. Hỏi người làm tool ABC
2. Họ đang dùng API nào?
3. Share example request
```

### Phase 2: Implement (SAU KHI CÓ THÔNG TIN)

**File: services/googleLabsApiService.ts** (NEW)
```typescript
// Tạo service mới cho Google Labs API
export class GoogleLabsApiService {
  private readonly ENDPOINTS = {
    // CẦN ĐIỀN ĐÚNG ENDPOINT TỪ RESEARCH
    GENERATE_VIDEO: 'https://labs.google/api/v1/video/generate',
    GENERATE_IMAGE: 'https://labs.google/api/v1/image/generate',
    // ...
  };

  async makeRequest(endpoint: string, body: any) {
    const headers = {
      'Cookie': this.getCookieHeader(),
      'Authorization': `Bearer ${this.getSessionToken()}`,
      // CẦN THÊM HEADERS TỪ RESEARCH
    };

    return fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }
}
```

### Phase 3: Test

```bash
1. Update directApiService.ts với đúng endpoints
2. npm run build
3. npm run dev
4. Test generate với cookies
5. Verify: Không còn 429 errors
```

---

## 📊 Current Architecture

```
┌─────────────────────────────────────────────────┐
│                   App.tsx                        │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│             hybridApiService                     │
│  (Auto-switch API Key vs Cookie Auth)           │
└──────────┬─────────────────────┬────────────────┘
           │                     │
           ▼                     ▼
┌──────────────────┐   ┌───────────────────────┐
│ directApiService │   │ geminiService (SDK)   │
│ ❌ WRONG         │   │ ✅ Works but 429      │
│ endpoints        │   │                       │
└──────────────────┘   └───────────────────────┘
           │                     │
           └──────────┬──────────┘
                      ▼
           ┌──────────────────────┐
           │   Google APIs        │
           │ ❌ Public API (429)  │
           │ ✅ Need Internal API │
           └──────────────────────┘
```

**Cần:**
```
┌─────────────────────────────────────────────────┐
│             hybridApiService                     │
└──────────┬─────────────────────┬────────────────┘
           │                     │
           ▼                     ▼
┌──────────────────────┐   ┌──────────────────┐
│ googleLabsApiService │   │ geminiService    │
│ ✅ Labs Internal API │   │ (fallback)       │
│ with NextAuth token  │   │                  │
└──────────────────────┘   └──────────────────┘
           │
           ▼
┌───────────────────────────┐
│  labs.google Internal API │
│  ✅ No quota limits       │
└───────────────────────────┘
```

---

## 🔐 Cookie Info

**Available cookies:**
- ABC/Whisk_cookie.txt - Google Labs (Whisk)
- Flow_cookie.txt - Google Labs (Flow)

**Key cookies:**
- `__Secure-next-auth.session-token` - Main session token
- `email` - User email
- `__Host-next-auth.csrf-token` - CSRF protection

**Missing cookies:**
- ❌ SAPISID (Google OAuth) - Không cần vì dùng Labs
- ❌ __Secure-1PSID (Google) - Không cần vì dùng Labs

---

## 💡 TIPS for Next Developer

### Để Continue Debug:

1. **Đọc file này đầu tiên**
2. **Check recent commits** để hiểu code changes
3. **Mở browser và capture API** theo hướng dẫn Task 1
4. **Update directApiService.ts** với đúng endpoints
5. **Test và verify** không còn 429 errors

### Useful Commands:

```bash
# Start dev server
npm run dev

# Build
npm run build

# View logs (in browser)
Open http://localhost:3001 → Logs tab

# Check cookies
cat ABC/Whisk_cookie.txt | jq
cat Flow_cookie.txt | jq
```

### Important Files to Check:

```
services/directApiService.ts   - Main file cần sửa
services/hybridApiService.ts   - Integration layer
App.tsx                        - Main app logic
components/ConfigForm.tsx      - Cookie Auth toggle
components/SettingsTab.tsx     - Cookie upload UI
```

---

## 🆘 NHANH NHẤT: Hỏi Tool ABC Developer

**Questions to ask:**

1. Bạn đang gọi API endpoint nào?
   - Full URL
   - Method (POST/GET)

2. Request headers như thế nào?
   - Authorization header?
   - Cookie format?
   - Có headers đặc biệt nào không?

3. Request body format?
   - JSON structure
   - Required fields

4. Response format?
   - Success response
   - Error response

5. Rate limits?
   - Có bị limit không?
   - Delay giữa requests?

**Với 5 câu trả lời này, có thể fix trong 30 phút!**

---

## 📞 Contact Info

**Project:** Whisk to Veo 3.1 Automation Tool
**Location:** /Users/macos/Desktop/whisk-to-veo-3.1-automation-tool
**Git:** Ready to commit
**Status:** Blocked on API endpoint research

**Next AI Session:**
1. Read this file first
2. Capture API endpoints
3. Update directApiService.ts
4. Test and verify

---

## 🎯 SUCCESS CRITERIA

**Khi nào biết đã fix xong:**

✅ Generate video KHÔNG bị 429 error
✅ Cookies được sử dụng đúng (NextAuth session token)
✅ Gọi đúng Labs internal API
✅ Rate limits reasonable (5s delay)
✅ Logs hiển thị "🚀 COOKIE AUTH (BYPASS QUOTA)"

**Current:** ❌ 429 errors khi generate
**Target:** ✅ Generate thành công với cookies

---

**🤖 Generated by Claude Code**
**Last updated:** 2025-10-24 22:10
**Status:** Waiting for API endpoint information
