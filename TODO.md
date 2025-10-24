# ✅ TODO List

## 🚨 URGENT - BLOCKED

- [ ] **Capture Google Labs API endpoints** ⭐ PRIORITY 1
  - Method: Open labs.google → DevTools → Network → Generate video → Copy cURL
  - Save to: `API_CAPTURE.txt`
  - Need: URL, headers, body format

## 📝 Implementation

- [ ] Update `services/directApiService.ts`
  - [ ] Fix ENDPOINTS object (line 20-30)
  - [ ] Update makeRequest headers (line 100-150)
  - [ ] Replace SAPISIDHASH with NextAuth token

- [ ] Test with real cookies
  - [ ] Upload cookies from `ABC/Whisk_cookie.txt`
  - [ ] Enable Cookie Auth toggle
  - [ ] Generate test video
  - [ ] Verify no 429 errors

## 📚 Documentation

- [x] DEBUG_NOTES.md - Detailed debug guide
- [x] QUICK_START_FOR_NEXT_AI.md - Quick start guide
- [ ] Update README.md with Cookie Auth instructions
- [ ] Add API endpoint documentation once captured

## 🔧 Nice to Have

- [ ] Auto-detect cookie expiration
- [ ] Cookie validation on upload
- [ ] Better error messages for API failures
- [ ] Retry logic for failed requests

---

**Current Status:** Waiting for API endpoint capture
**Blocked On:** Step 1 - Capture Labs API info
**Next Action:** Open labs.google + DevTools

**See:** DEBUG_NOTES.md for detailed instructions
