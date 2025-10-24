# Tính năng mới đã bổ sung

## Tổng quan
Đã nâng cấp tool từ version đơn giản sang version đầy đủ với quản lý dự án, multi-scene, batch processing và nhiều tính năng nâng cao.

---

## 1. ✅ API Key Management với Cookie Import

### Components: `ApiKeySelector.tsx`

**Tính năng:**
- Nhập API key thủ công
- Upload file cookie.json để authenticate
- Hỗ trợ cả AI Studio selection và manual entry

**Cách dùng:**
1. Chọn "Manual Entry"
2. Nhập Gemini API Key
3. (Optional) Upload file `cookie.json` đã export từ browser
4. Click "Continue"

**Cookie format:** JSON array theo chuẩn browser export (xem file `cookie.txt`)

---

## 2. ✅ Video Configuration (Style, Language, Scenes, Duration)

### Components: `ConfigForm.tsx`, `IdeaForm.tsx`

**Tính năng:**
- **Style**: Cinematic, Documentary, Cartoon, Realistic, Anime
- **Language**: English, Vietnamese, Japanese, Korean, Chinese, French, Spanish
- **Scene Count**: 1-10 scenes (slider)
- **Duration per Scene**: 3-15 seconds
- **Resolution**: 720p, 1080p, 4K
- **Mode**: Auto (không dừng) hoặc Review (edit từng scene)

**Cách dùng:**
- Trong form nhập idea, expand "Video Configuration"
- Chỉnh các settings
- Tool sẽ generate theo config đã chọn

---

## 3. ✅ Review/Auto-Export Mode

### Components: `SceneReview.tsx`, Updated `App.tsx`

**Auto Mode:**
- Generate thẳng tất cả scenes
- Không dừng, tự động download khi xong
- Nhanh nhưng không kiểm soát

**Review Mode:**
- Sau khi generate prompts → Hiển thị tất cả scenes
- User có thể:
  - Edit video prompt của từng scene
  - Edit voice script của từng scene
  - Click "Regenerate" để tạo lại scene
- Approve → Mới bắt đầu generate videos

**Flow Review Mode:**
```
Input Idea → Generate Prompts (Gemini)
           → Generate 3 Character Variations (Imagen)
           → Show SceneReview Component
           → User edits & approves
           → Batch generate all scenes (với rate limiting)
           → Results
```

---

## 4. ✅ Batch Processing Multi-Scenes

### Services: `geminiService.ts` - `generateScenesVideos()`

**Tính năng:**
- Tự động generate nhiều scenes tuần tự
- **Rate limiting**: Sleep 12 giây giữa mỗi API call để tránh vi phạm
- Progress tracking cho từng scene
- Error handling: Scene nào fail vẫn tiếp tục scenes khác

**Flow:**
```
For each scene:
  1. Generate voice (Gemini TTS)
  2. Wait 12s (rate limit)
  3. Generate video (Veo 3.1 với reference character image)
  4. Wait 12s (rate limit)
  5. Next scene...
```

**Callback progress:**
```typescript
onProgress?: (sceneId: string, status: 'pending' | 'success' | 'error', result?: any) => void
```

---

## 5. ✅ Import/Export Metadata

### Utils: `projectUtils.ts`

**Export Project:**
```typescript
exportProjectToFile(project: ProjectMetadata) // Download JSON
```

**Import Project:**
```typescript
importProjectFromFile() // Upload JSON → Load lại project
```

**Batch Template:**
```typescript
exportBatchTemplate() // Download template để fill batch ideas
importBatchItems() // Import batch để process nhiều videos
```

**Format Batch JSON:**
```json
[
  {
    "id": "1",
    "idea": "Your idea here",
    "script": "Optional script",
    "status": "pending"
  }
]
```

---

## 6. ✅ Multiple Character Images cho Consistency

### Components: `CharacterSelector.tsx`
### Services: `generateCharacterVariations()`

**Tính năng:**
- Generate 3 variations của cùng 1 character prompt
- User chọn variation phù hợp nhất
- **Mục đích**: Đảm bảo character nhất quán trong TẤT CẢ scenes

**Flow:**
1. Generate character prompt từ idea
2. Call Imagen 3 lần (với rate limiting 12s giữa mỗi call)
3. Hiển thị 3 variations
4. User click chọn → Variation đó được dùng cho ALL scenes

**Rate Limiting:**
- Mỗi image generation cách nhau 12 giây
- Tránh bị rate limit từ Google API

---

## 7. ✅ Project Management (CRUD)

### Components: `ProjectManager.tsx`

**Tính năng:**
- **List**: Hiển thị tất cả projects đã tạo
- **Create**: Tạo project mới
- **Edit**: Load project cũ và tiếp tục
- **Delete**: Xóa project (có confirm)
- **Export**: Download project thành JSON
- **Import**: Upload JSON để restore
- **Search**: Tìm kiếm theo tên/idea

**Storage:**
- LocalStorage key: `veo_projects`
- Format: Array of `ProjectMetadata`

**Metadata Structure:**
```typescript
{
  id: string
  name: string
  idea: string
  script: string
  config: VideoConfig
  creativeAssets: CreativeAssets | null
  generatedData: GeneratedData
  createdAt: string
  updatedAt: string
}
```

---

## 8. ✅ Scene Editing & Regeneration

### Components: `SceneReview.tsx`

**Edit Scene:**
- Click "Edit" → Textareas appear
- Sửa `videoPrompt` hoặc `voiceScript`
- Save → Scene được update

**Regenerate Scene:**
- Click "Regenerate"
- TODO: Implement single scene regeneration
- (Hiện tại hiển thị "Coming soon")

---

## Cấu trúc Files mới

```
components/
├── ApiKeySelector.tsx       (Updated - Cookie import)
├── ConfigForm.tsx           (NEW - Video settings)
├── IdeaForm.tsx            (Updated - Integrated ConfigForm)
├── SceneReview.tsx         (NEW - Review & edit scenes)
├── CharacterSelector.tsx   (NEW - Select character variation)
├── ProjectManager.tsx      (NEW - CRUD projects)
├── icons.tsx               (Updated - Added icons)

services/
└── geminiService.ts        (Updated - Multi-scene, rate limiting)

utils/
├── fileUtils.ts            (Existing)
└── projectUtils.ts         (NEW - Import/export)

types.ts                     (Updated - New interfaces)
App.tsx                      (Completely rewritten)
App.old.tsx                  (Backup old version)
```

---

## API Rate Limiting Strategy

**Problem:** Google API có giới hạn requests/minute

**Solution:**
- Constant `API_DELAY = 12000` ms (12 giây)
- Sleep giữa mỗi:
  - Character variation generation
  - Scene voice generation
  - Scene video generation

**Example:**
```typescript
for (let i = 0; i < count; i++) {
  await generateImage();
  if (i < count - 1) {
    await sleep(API_DELAY); // Wait 12s
  }
}
```

---

## Types mới quan trọng

```typescript
// Video configuration
interface VideoConfig {
  style: 'cinematic' | 'documentary' | 'cartoon' | 'realistic' | 'anime'
  language: 'en' | 'vi' | 'ja' | 'ko' | 'zh' | 'fr' | 'es'
  sceneCount: number
  durationPerScene: number
  resolution: '720p' | '1080p' | '4k'
  mode: 'auto' | 'review'
}

// Scene với full data
interface Scene {
  id: string
  index: number
  prompt: string
  videoPrompt: string
  voiceScript: string
  characterImage: string | null
  audioUrl: string | null
  videoUrl: string | null
  status: 'idle' | 'pending' | 'success' | 'error'
}

// Character variation để chọn
interface CharacterVariation {
  id: string
  imageUrl: string
  prompt: string
  selected: boolean
}
```

---

## Workflow hoàn chỉnh

### Auto Mode:
```
1. Input idea + config
2. Generate prompts & scenes structure (Gemini)
3. Generate 3 character variations (Imagen) [~36s với rate limiting]
4. Auto select first variation
5. Batch generate all scenes:
   - Scene 1: Voice → Video [~12s delay]
   - Scene 2: Voice → Video [~12s delay]
   - ...
6. Show results với all scenes
```

### Review Mode:
```
1. Input idea + config
2. Generate prompts & scenes structure (Gemini)
3. Generate 3 character variations (Imagen)
4. ⏸️ PAUSE → Show SceneReview
   - User selects character
   - User edits scene prompts/scripts
   - User clicks "Approve"
5. Batch generate approved scenes
6. Show results
```

---

## Lưu ý khi sử dụng

1. **Rate Limiting**: Với nhiều scenes, thời gian chờ sẽ lâu (12s x số scenes x 2)
   - 3 scenes = ~72 giây chỉ cho delays
   - Chưa tính thời gian API xử lý

2. **API Key**: Cần API key có quyền truy cập:
   - Gemini 2.5 Flash
   - Imagen 4.0
   - Gemini TTS
   - Veo 3.1

3. **Storage**: Projects lưu trong LocalStorage
   - Giới hạn ~5-10MB
   - Video URLs là blob URLs (temporary)
   - Nên export projects quan trọng

4. **Cookie Import**: Optional, dùng để enhance authentication
   - Không bắt buộc nếu có valid API key

---

## Testing Checklist

- [x] Build successfully (no TypeScript errors)
- [ ] Manual API key entry works
- [ ] Cookie import works
- [ ] Config form changes video generation
- [ ] Review mode stops at scene review
- [ ] Auto mode runs through
- [ ] Character selection works
- [ ] Scene editing saves
- [ ] Project save/load works
- [ ] Import/export works
- [ ] Multi-scene generation with rate limiting works

---

## Next Steps (Optional)

1. Implement single scene regeneration
2. Add video stitching để nối nhiều scenes thành 1 video
3. Add batch processing UI (process nhiều ideas cùng lúc)
4. Better error handling cho từng scene
5. Progress bar chi tiết hơn (% complete)
6. Preview mode trước khi approve
7. Undo/Redo cho scene edits

---

## Build & Run

```bash
npm install
npm run dev    # Development
npm run build  # Production
npm run preview # Preview build
```

Port: http://localhost:3000
