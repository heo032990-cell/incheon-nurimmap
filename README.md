# 인천 누림지도 · 실제 운영 소스

이 저장소는 인천 누림지도의 실제 운영 소스를 관리하는 기준 저장소입니다. **앞으로 main에서 작업합니다.**

| 구분 | 링크 |
| --- | --- |
| 실제 서비스 | [인천 누림지도](https://incheon-nurimmap.netlify.app/) |
| 실제 운영 소스 | [이 저장소](https://github.com/heo032990-cell/incheon-nurimmap) |
| 재사용용 공개 오픈소스 | [오픈소스 저장소](https://github.com/heo032990-cell/incheon-nurimmap-open-source) |

공개 오픈소스와 운영판은 설정과 일부 구성에 차이가 있습니다.

## 현재 기준

- 운영 웹 배포 v109의 파일 내용을 기준으로 동기화했습니다. 파일 이름에 남아 있는 이전 번호는 그대로 사용 중인 파일의 이름이며, 모두 v109로 바꾸지 않았습니다.
- 루트의 HTML·JavaScript·CSS와 assets/는 운영 웹 코드입니다.
- backend/deployed/에는 실제 배포에서 확인한 신청·설문 서버 함수와 포함 모듈이 있습니다.
- backend/google-apps-script.gs와 설치 SQL은 저장된 최신 자료입니다. Google Apps Script·DB의 실제 배포 상태와 완전히 일치하는지는 별도 확인이 필요합니다.
- 기존 테스트, 문서, 작업 이력은 보존했습니다. 이전 RELEASE 문서와 번호가 붙은 백엔드 파일은 과거 작업 기록입니다.
- main과 기존 codex/survey-integration 브랜치를 이번 정리 시점의 같은 커밋으로 맞췄습니다. 이후 작업은 main을 사용하세요.

## 작업 시작

```sh
git clone https://github.com/heo032990-cell/incheon-nurimmap.git
cd incheon-nurimmap
npm test
npm run build
```

기존 회사·노트북 작업 폴더에서는 미커밋 작업을 먼저 보관한 뒤 main을 가져오세요. 로컬 변경을 강제로 초기화하지 마세요. GitHub 저장소를 갱신하는 것만으로 현재 운영 사이트에 자동 배포되지는 않습니다.
