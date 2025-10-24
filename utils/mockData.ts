import type { VideoConfig } from '../types';

export const MOCK_API_KEY = 'AIzaSy_MOCK_KEY_FOR_TESTING_ONLY_1234567890';

export const MOCK_IDEAS = [
  'Hai cậu bé Cu Tí và Cu Tèo phiêu lưu trong rừng sâu tìm kho báu huyền thoại',
  'Một chú robot biết nói học cách làm bạn với con người',
  'Cô bé phù thủy nhỏ tập học phép thuật ở học viện ma thuật',
  'Hành trình của một con mèo đi khắp thế giới tìm chủ nhân',
  'Chuyến du hành thời gian về thời kỳ khủng long',
];

export const MOCK_SCRIPTS = [
  `Cu Tí và Cu Tèo là hai cậu bé tinh nghịch sống ở một ngôi làng nhỏ.
Một ngày nọ, họ tìm thấy tấm bản đồ cũ kỹ dẫn đến kho báu trong rừng sâu.
Với lòng dũng cảm và tình bạn thân thiết, hai cậu bắt đầu cuộc phiêu lưu đầy kỳ thú.`,

  `ROBO-01 là robot mới được tạo ra với trí tuệ nhân tạo tiên tiến.
Ban đầu chỉ biết làm theo lệnh, nhưng dần dần học được cảm xúc con người.
Câu chuyện về tình bạn giữa robot và một cậu bé nhỏ.`,

  `Luna là cô bé phù thủy 10 tuổi mới nhập học tại học viện Moonlight.
Cô phải học cách sử dụng phép thuật một cách khôn ngoan.
Cùng với những người bạn mới, Luna khám phá thế giới phép thuật kỳ diệu.`,

  `Whiskers là chú mèo nhà bị lạc khỏi chủ trong một chuyến di chuyển.
Quyết tâm tìm lại gia đình, chú bắt đầu hành trình xuyên suốt đất nước.
Trên đường đi, Whiskers gặp nhiều người bạn và trải nghiệm khó quên.`,

  `Nhóm nhà khoa học trẻ phát minh ra cỗ máy thời gian.
Chuyến du hành đầu tiên đưa họ về 65 triệu năm trước.
Họ phải sống sót giữa thế giới khủng long đầy nguy hiểm.`,
];

export const MOCK_CONFIGS: VideoConfig[] = [
  {
    style: 'cartoon',
    language: 'vi',
    totalDurationMinutes: 1,
    sceneCount: 8,
    aspectRatio: '16:9',
    veoModel: 'veo-3.1-fast',
    videosPerPrompt: 1,
    mode: 'review',
    useCharacterImage: false, // Prompt-only by default
    useCookieAuth: false, // API Key by default
  },
  {
    style: 'anime',
    language: 'vi',
    totalDurationMinutes: 2,
    sceneCount: 15,
    aspectRatio: '9:16',
    veoModel: 'veo-3.1-quality',
    videosPerPrompt: 2,
    mode: 'auto',
    useCharacterImage: false,
    useCookieAuth: false,
  },
  {
    style: 'cinematic',
    language: 'en',
    totalDurationMinutes: 1.5,
    sceneCount: 12,
    aspectRatio: '16:9',
    veoModel: 'veo-3.1-fast',
    videosPerPrompt: 1,
    mode: 'review',
    useCharacterImage: false,
    useCookieAuth: false,
  },
];

export function getRandomMockData() {
  const randomIndex = Math.floor(Math.random() * MOCK_IDEAS.length);
  return {
    idea: MOCK_IDEAS[randomIndex],
    script: MOCK_SCRIPTS[randomIndex],
    config: MOCK_CONFIGS[randomIndex % MOCK_CONFIGS.length],
  };
}
