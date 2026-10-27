# 스플래시 이미지

- 원본: `src/assets/images/bootsplash_logo.png`
- 재생성: `node scripts/generate-splash.js`
- 생성 도구: 내장 ImageGen, 기존 PNG를 참조한 투명 배경 이미지 편집.
- Android: 288dp 캔버스에 그림의 불투명 픽셀을 지름 188dp 원 안으로 맞춘다. 시스템의 지름 192dp 마스크에 보간 여유를 남긴다. 5개 밀도에서 마스크 밖 불투명 픽셀 0개 확인.
- mdpi 기준 불투명 영역: 기존 118×127dp → 137×155dp. 배경 장식을 없애 캐릭터와 제목의 실질적인 크기도 확대했다.
- iOS: 248pt 정사각형 안에 종횡비를 유지한다. Storyboard에 너비·높이 제약을 명시했다.
- 기존 배경색 `#FAF0DC` 유지. 네이티브 리소스 변경이므로 재빌드가 필요하다.
- 공식 Android 규격: https://developer.android.com/develop/ui/views/launch/splash-screen#dimensions

## 이미지 편집 프롬프트

Edit the supplied Korean proverb quiz app splash illustration. Preserve this exact cute warm cream rabbit mascot, winking face, brown traditional Korean gat hat, peach cheeks, warm parchment scroll, rich cocoa brown outlines, friendly Korean folk identity. Refine for polished modern app splash and very small sizes: ONE compact clean centered mascot illustration on truly transparent background. Remove ALL concentric background rings, clouds, flowers, sparkles, corner marks, bottom title, subtitles, tiny text, footnotes, and floor shadows. Enlarge the rabbit and parchment relative to the image. The rabbit head/ears/hat and its two paws holding a clean parchment scroll should form a compact nearly square silhouette, keep ample transparent corners so it can fit inside a circular Android icon safe zone. The scroll must contain ONLY the exact bold highly legible Korean lettering on TWO lines: first line '속담', second line '퀴즈!' . No other text anywhere. Refine clean smooth outlines, restrained warm ochre highlights, subtle smooth shading, no grain, no concentric lines, no busy decoration. Preserve the original character recognizability and illustration spirit. High quality 1024 square transparent PNG, illustration occupies ~88% image height with no clipping.
