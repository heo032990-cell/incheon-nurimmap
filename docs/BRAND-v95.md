# 인천 누림지도 검색 아이덴티티

공식 시청 마크를 사용하지 않는 독립 아이콘입니다. 인천의 바다·다리·해를 지도 핀에 담았습니다.

## 자산
- `assets/nurim-icon.png`: 512px 대표 아이콘, 사이트 상단·공유 이미지
- `assets/nurim-icon-192.png`: 192px 홈 화면 아이콘
- `assets/nurim-touch-icon.png`: 180px Apple 아이콘
- `favicon.png`: 96px 검색용 파비콘 (안정적인 URL 유지)
- `favicon.ico`: 16/32/48px 브라우저 호환용 아이콘
- `assets/site.webmanifest`: 웹앱 이름·아이콘 메타정보

## 생성 방식
내장 ImageGen으로 제작 후 한 번 수정했습니다. Sharp로 배포 크기와 ICO 형식을 변환했습니다. 생성 API 키는 사용하지 않았습니다.

최초 프롬프트:
> Create a single polished favicon/app icon for Korean community welfare program website 'Incheon Nurim Map'. NO TEXT OR LETTERS. Flat minimal bold geometric logo, sea-teal rounded square background filling canvas, one large white map-location pin silhouette containing a very simple teal bridge arch over two ocean wave strokes, a small warm amber sun accent at upper right. Evokes Incheon coastal city, bridges and welcoming community. Original design, do NOT copy Incheon official municipal emblem. Icon must read at 32px: thick shapes, generous negative space, no fine lines, no photorealism, no shadows, no mockup, no border outside icon. Square 1024x1024 composition, entire canvas devoted to icon.

최종 수정 프롬프트:
> Refine this icon for production favicon. Preserve the recognizable white map pin, teal bridge, two waves and gold sun. CRITICAL: replace the entire background with a single completely opaque uniform flat solid teal #087F83, edge to edge. Remove ALL transparency, glow, shadow, gradients, textures and vignette. Flat 2D vector-like colors only. Keep pin centered with 12 percent safe padding on all edges so the tip is not close to bottom edge. Simplify bridge and waves as bold smooth solid shapes. Square icon only, no text, no surrounding mockup.

## 검색 반영
홈페이지에 `WebSite` JSON-LD, 모든 페이지에 `og:site_name`, 파비콘 및 공유 이미지 메타정보를 적용했습니다. 사이트명은 인천 누림지도, 대체명은 인천누림지도·누림지도입니다. 정부 공식 사이트를 뜻하는 Organization 정보는 추가하지 않았습니다.

검색 결과 표시는 검색엔진이 결정합니다. Google 재수집은 며칠~몇 주가 걸릴 수 있으며 아이콘·사이트명 표시를 보장하지 않습니다. 소유자의 Google Search Console URL 검사에서 홈페이지 색인 요청을 하면 재수집을 요청할 수 있습니다. Naver Search Advisor도 기존 소유자 계정에서 수집 요청을 확인할 수 있습니다. 이 작업에서는 해당 콘솔에 색인 요청을 제출하지 않았습니다.

`netlify.app`은 호스팅 주소입니다. 브랜드 사이트명·아이콘 개선과 별개로 주소 자체를 바꾸려면 별도 도메인이 필요합니다.

참고: https://developers.google.com/search/docs/appearance/site-names
참고: https://developers.google.com/search/docs/appearance/favicon-in-search
