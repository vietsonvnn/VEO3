# 🍎 Hướng dẫn chạy tool trên MacOS

## Yêu cầu hệ thống

- **MacOS**: 10.15+ (Catalina trở lên)
- **Node.js**: v18 hoặc mới hơn
- **Terminal**: Terminal mặc định hoặc iTerm2
- **Gemini API Key**: Lấy từ [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Bước 1: Cài đặt Node.js (nếu chưa có)

### Kiểm tra Node.js đã cài chưa:

```bash
node --version
```

Nếu hiện version (vd: `v20.10.0`) → Đã có, skip bước này

### Cài đặt Node.js:

#### Option 1: Dùng Homebrew (Khuyên dùng)

```bash
# Cài Homebrew (nếu chưa có)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài Node.js
brew install node
```

#### Option 2: Download trực tiếp

1. Vào: https://nodejs.org/
2. Download bản **LTS** (Long Term Support)
3. Chạy file `.pkg` và làm theo hướng dẫn

### Verify cài đặt:

```bash
node --version
npm --version
```

---

## Bước 2: Clone hoặc tải project

### Option 1: Clone từ GitHub

```bash
# Di chuyển đến Desktop
cd ~/Desktop

# Clone repository
git clone https://github.com/vietsonvnn/VEO3.git

# Vào thư mục project
cd VEO3
```

### Option 2: Tải ZIP

1. Vào: https://github.com/vietsonvnn/VEO3
2. Click **Code** → **Download ZIP**
3. Giải nén vào Desktop
4. Mở Terminal và chạy:

```bash
cd ~/Desktop/VEO3
```

---

## Bước 3: Cài đặt dependencies

```bash
npm install
```

Chờ khoảng 1-2 phút để cài xong.

**Nếu gặp lỗi permission:**
```bash
sudo npm install --unsafe-perm
```

---

## Bước 4: Tạo file API key

### Option 1: Tạo file .env.local

```bash
# Tạo file
touch .env.local

# Mở bằng TextEdit
open -a TextEdit .env.local
```

Paste vào file:
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Thay `AIza...` bằng API key thật của bạn

**Lưu file** (Cmd+S)

### Option 2: Dùng nano editor

```bash
nano .env.local
```

Paste:
```
GEMINI_API_KEY=your_api_key_here
```

- Nhấn **Ctrl+O** để save
- Nhấn **Enter** để confirm
- Nhấn **Ctrl+X** để thoát

---

## Bước 5: Chạy tool

```bash
npm run dev
```

Sẽ hiện:
```
  VITE v6.4.1  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## Bước 6: Mở trình duyệt

### Tự động:
Tool sẽ tự mở browser tại: `http://localhost:3000`

### Thủ công:
Mở Safari/Chrome và truy cập: **http://localhost:3000**

---

## 🎉 Bắt đầu sử dụng!

### Workflow cơ bản:

1. **Chọn API Key**
   - Click "Manual Entry"
   - Nhập Gemini API Key
   - (Optional) Upload file cookie.json nếu có
   - Click "Continue"

2. **Nhập ý tưởng**
   - Nhập idea vào textbox (VD: "A chef cooking in Italian kitchen")
   - (Optional) Nhập script cho voiceover
   - Chỉnh config:
     - Style: Cinematic
     - Language: Vietnamese
     - Scene Count: 3
     - Duration: 6s/scene
   - Click "Start Creation Pipeline"

3. **Chờ generation**
   - Prompting: ~5-10s
   - Character: ~40s (3 variations với delay)
   - Voice + Video: ~2-3 phút (tùy số scenes)

4. **Review & Download**
   - Xem video đã generate
   - Download video, ảnh, audio
   - Save project

---

## 🛑 Dừng tool

Trong Terminal, nhấn:
```
Ctrl + C
```

Hoặc đóng Terminal window

---

## 🐛 Troubleshooting

### Lỗi: `command not found: npm`
**Fix:**
```bash
# Cài Node.js lại bằng Homebrew
brew install node
```

### Lỗi: `EACCES: permission denied`
**Fix:**
```bash
sudo chown -R $USER ~/.npm
```

### Lỗi: `Port 3000 is already in use`
**Fix:**
```bash
# Kill process đang dùng port 3000
lsof -ti:3000 | xargs kill -9

# Hoặc dùng port khác
npm run dev -- --port 3001
```

### Lỗi: `API key invalid`
**Fix:**
1. Kiểm tra lại API key trong `.env.local`
2. Đảm bảo không có khoảng trắng thừa
3. Lấy API key mới tại: https://aistudio.google.com/app/apikey

### Tool chạy nhưng không hiện gì
**Fix:**
```bash
# Clear cache và rebuild
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Lỗi khi generate video
**Fix:**
1. Kiểm tra API key có quyền truy cập Veo 3.1 không
2. Giảm số scenes xuống (từ 10 → 3)
3. Check console log trong browser (F12 → Console)

---

## 📂 Cấu trúc thư mục

```
VEO3/
├── components/          # React components
├── services/           # API services (Gemini, Imagen, Veo)
├── utils/              # Utilities
├── .env.local          # API key (TỰ TẠO)
├── package.json        # Dependencies
└── README.md          # Documentation
```

---

## 🔒 Bảo mật

**QUAN TRỌNG:**
- KHÔNG commit file `.env.local` lên GitHub
- KHÔNG share API key với người khác
- File `cookie.txt` đã được ignore (không push lên git)

---

## 💡 Tips

### 1. Chạy background
```bash
# Chạy và không tắt khi đóng Terminal
nohup npm run dev > output.log 2>&1 &
```

### 2. Check logs
```bash
# Xem logs realtime
tail -f output.log
```

### 3. Build cho production
```bash
# Build static files
npm run build

# Preview production build
npm run preview
```

### 4. Clear projects
Projects được lưu trong browser LocalStorage. Để xóa:
- F12 → Application → Local Storage → Clear

---

## 📸 Screenshots expected

### 1. Terminal sau khi `npm run dev`:
```
  VITE v6.4.1  ready in 234 ms

  ➜  Local:   http://localhost:3000/
```

### 2. Browser hiện:
- Header: "Whisk → Veo 3.1 Automation"
- API Key selection screen

### 3. Sau khi nhập API key:
- Form nhập idea
- Config options
- "Start Creation Pipeline" button

---

## 🚀 Next Steps

Sau khi chạy thành công:

1. Đọc [FEATURES_ADDED.md](FEATURES_ADDED.md) để hiểu đầy đủ tính năng
2. Thử các modes khác nhau (Auto vs Review)
3. Export/Import projects
4. Customize config cho từng use case

---

## 💬 Hỗ trợ

Nếu gặp vấn đề:

1. Check [FEATURES_ADDED.md](FEATURES_ADDED.md)
2. Xem console log trong browser (F12)
3. Check Terminal output
4. Tạo Issue trên GitHub: https://github.com/vietsonvnn/VEO3/issues

---

## 📝 Checklist

- [ ] Đã cài Node.js
- [ ] Clone/download project
- [ ] `npm install` thành công
- [ ] Tạo file `.env.local` với API key
- [ ] `npm run dev` chạy không lỗi
- [ ] Browser mở http://localhost:3000
- [ ] Thấy màn hình API selection
- [ ] Test generate 1 video đơn giản

---

**✅ Done! Tool đã sẵn sàng sử dụng!**

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**
