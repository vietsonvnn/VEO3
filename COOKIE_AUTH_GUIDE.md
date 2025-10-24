# 🚀 Cookie Authentication Guide - Bypass Quota Limits!

## Vấn Đề: Rate Limit 429 Errors

Khi sử dụng API key thông thường, bạn thường gặp lỗi **429 Rate Limit Exceeded**:
- Giới hạn requests/phút rất thấp
- Không thể tạo nhiều videos liên tiếp
- Bị block khi generate batch scenes

## Giải Pháp: Cookie-Based Authentication

Tool này giờ hỗ trợ **authenticated cookies từ Google AI Studio**, cho phép bạn:
- ✅ **Bypass API quota limits**
- ✅ **Không bị 429 errors**
- ✅ **Rate limit nhanh hơn** (5s vs 12s delay)
- ✅ **Giống như dùng web interface** - sử dụng session của user đã login
- ✅ **Miễn phí** - không cần upgrade plan

---

## 📋 Cách Export Cookies

### Bước 1: Cài Browser Extension

**Chrome:**
- [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)

**Firefox:**
- [Cookie Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### Bước 2: Login vào Google AI Studio

1. Mở browser → Vào https://aistudio.google.com
2. Login với tài khoản Google của bạn
3. Đảm bảo bạn thấy giao diện AI Studio (đã login thành công)

### Bước 3: Export Cookies

1. Click vào **extension icon** (EditThisCookie hoặc Cookie Editor)
2. Chọn **Export cookies**
3. Format: **JSON**
4. Copy toàn bộ JSON data

### Bước 4: Save Cookie File

**Option 1: Upload qua UI**
1. Trong tool, vào tab **Settings**
2. Click **Upload cookie.json**
3. Chọn file cookies đã save

**Option 2: Place vào public folder**
1. Save cookies vào file: `public/cookie.txt`
2. Format: JSON array
3. Tool sẽ tự động load khi khởi động

**Ví dụ cookie.txt:**
```json
[
  {
    "domain": ".google.com",
    "name": "SAPISID",
    "value": "abc123...",
    "path": "/",
    "secure": true,
    "httpOnly": false,
    "sameSite": "None"
  },
  {
    "domain": ".google.com",
    "name": "__Secure-1PSID",
    "value": "xyz789...",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "None"
  }
]
```

---

## ⚙️ Cách Sử Dụng Cookie Auth

### 1. Upload Cookies (Settings Tab)

```
Settings Tab → Upload cookie.json → Save Configuration
```

Tool sẽ hiển thị:
- ✅ Cookies loaded: X cookies
- ✅ API Key configured

### 2. Enable Cookie Auth (Create Tab)

Trong **Video Configuration**, click **Show Advanced**, sau đó:

```
☑️ Bypass Quota Limits với Cookie Auth
```

Khi checkbox được bật:
- Badge: **ACTIVE** sẽ hiện
- Message: "✅ Sử dụng authenticated cookies - Không bị limit quota 429!"

### 3. Generate Video

Click **Start Creation Pipeline** như bình thường.

Tool sẽ tự động:
- 🚀 Sử dụng Direct API calls với cookies
- 🚀 Bypass quota limits
- 🚀 Faster rate limits (5s delay thay vì 12s)

---

## 🔍 Kiểm Tra Auth Mode

Trong **Logs**, bạn sẽ thấy:

**Cookie Auth Mode:**
```
🎬 Starting video generation
   authMode: 🚀 COOKIE AUTH (BYPASS QUOTA)
   useCookieAuth: true

🚀 Using Direct API (Cookie Auth) - Bypassing quota!
```

**API Key Mode:**
```
🎬 Starting video generation
   authMode: 🔑 API KEY
   useCookieAuth: false

🔑 Using SDK API (API Key) - Standard quota
```

---

## 🛠️ Troubleshooting

### ❌ Cookies không hoạt động

**Nguyên nhân:**
- Cookies đã expire (timeout)
- Login session hết hạn
- Cookies không đúng format

**Giải pháp:**
1. Logout khỏi aistudio.google.com
2. Login lại
3. Export cookies mới
4. Re-upload vào tool

### ❌ Vẫn bị 429 errors

**Kiểm tra:**
1. Checkbox "Bypass Quota Limits" đã bật chưa?
2. Cookies đã upload chưa?
3. Check logs để xem auth mode: phải là "🚀 COOKIE AUTH"

**Fix:**
- Vào Settings → Re-upload cookies
- Vào Create → Advanced → Bật Cookie Auth toggle
- Click "Start Creation Pipeline" lại

### ❌ Invalid cookie format error

**Nguyên nhân:**
- File không phải JSON
- Format sai

**Giải pháp:**
Đảm bảo cookies là **JSON array**:
```json
[
  { "name": "...", "value": "...", "domain": "..." },
  { "name": "...", "value": "...", "domain": "..." }
]
```

---

## 🔐 Bảo Mật

### ⚠️ Important Security Notes

1. **Cookies chứa session của Google account**
   - Có thể truy cập vào tài khoản Google của bạn
   - **NEVER share cookie file** với người khác

2. **Storage Policy**
   - Cookies lưu trong **sessionStorage** (chỉ trong tab hiện tại)
   - Cleared khi đóng browser tab
   - Không lưu vào localStorage (persistent)

3. **Best Practices**
   - Logout khỏi aistudio.google.com sau khi export cookies
   - Định kỳ re-export cookies mới
   - Không commit cookie file vào Git

4. **Recommendation**
   - Dùng cookie từ tài khoản test, không dùng account chính
   - Tạo Google account riêng cho AI Studio
   - Enable 2FA trên account

---

## 🆚 So Sánh: Cookie Auth vs API Key

| Feature | Cookie Auth 🚀 | API Key 🔑 |
|---------|----------------|-----------|
| **Quota Limits** | ❌ Không bị limit | ✅ Bị limit nghiêm |
| **Rate Delay** | 5s | 12s |
| **429 Errors** | ❌ Không bị | ✅ Thường xuyên |
| **Setup** | Phức tạp (export cookies) | Dễ (chỉ API key) |
| **Security** | ⚠️ Cần cẩn thận | ✅ An toàn hơn |
| **Free Tier** | ✅ Hoạt động tốt | ⚠️ Bị limit nặng |

**Khuyến nghị:**
- **Production / Batch processing**: Dùng Cookie Auth
- **Testing / Small projects**: Dùng API Key
- **Personal use**: Cookie Auth (nếu bạn trust tool này)

---

## 📚 Technical Details

### Cách Cookie Auth Hoạt Động

1. **Browser Login**
   - User login vào aistudio.google.com
   - Browser nhận cookies từ Google (SAPISID, __Secure-1PSID, ...)

2. **Export Cookies**
   - Extension extract cookies từ browser
   - Export dưới dạng JSON

3. **Direct API Calls**
   - Tool gửi HTTP requests **trực tiếp** đến Google APIs
   - Attach cookies vào header `Cookie`
   - Generate `SAPISIDHASH` cho authentication

4. **Bypass Quota**
   - Google APIs nhận request như từ **logged-in user**
   - Không tính vào API key quota
   - Rate limits giống như web interface

### Endpoints Được Sử Dụng

```
Gemini:  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
Imagen:  https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages
Veo 3.1: https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateVideos
TTS:     https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent
```

### Headers Gửi Kèm

```http
Cookie: SAPISID=...; __Secure-1PSID=...; ...
Authorization: SAPISIDHASH 1234567890_abc123...
Content-Type: application/json
Origin: https://aistudio.google.com
Referer: https://aistudio.google.com/
User-Agent: Mozilla/5.0 ...
```

---

## 🎯 FAQ

### Q: Cookies có bị expire không?
**A:** Có. Google cookies thường expire sau vài ngày/tuần. Bạn cần re-export định kỳ.

### Q: Có thể dùng cookies từ nhiều accounts không?
**A:** Không. Chỉ dùng 1 set cookies tại một thời điểm.

### Q: Cookie Auth có an toàn không?
**A:** Tương đối. Cookies chỉ lưu trong session, nhưng bạn nên dùng account test, không dùng account chính.

### Q: Tại sao tool ABC dùng Chrome automation mà tool này import manual?
**A:**
- Chrome automation phức tạp, cần Puppeteer/Selenium
- Tool này đơn giản hơn: export 1 lần, dùng mãi
- Giảm dependencies, dễ deploy

### Q: Có thể automate export cookies không?
**A:** Có thể dùng Puppeteer script, nhưng hiện tại manual export đơn giản hơn.

---

## 🚀 Quick Start

**TL;DR - 5 bước để bypass quota:**

1. Install [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
2. Login https://aistudio.google.com
3. Export cookies → Save as `cookie.json`
4. Upload vào Settings tab
5. Enable "Bypass Quota Limits" toggle trong Create tab

**Done!** Không còn 429 errors! 🎉

---

## 📞 Support

**Nếu gặp vấn đề:**
1. Check Logs tab → Xem auth mode
2. Re-export cookies mới
3. Clear browser cache và login lại
4. Verify cookies format (phải là JSON array)

**Common Issues:**
- "No authentication method" → Upload cookies hoặc API key
- "429 Rate Limit" → Bật Cookie Auth toggle
- "Invalid cookies" → Re-export với format đúng
- "Request failed 401" → Cookies expired, re-export

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

Last updated: 2025-10-24
