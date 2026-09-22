# 모덕 네컷 (인생네컷 포토부스)

웹앱 + 내장 에셋. 웹캠으로 찍어 캐논 SELPHY CP1500(100×148mm, 1181×1748px)에 인쇄하고, 완성 사진을 Google Drive 에 올려 QR 로 전달한다.

- 구성: `index.html`(PC 부스) · `shared/booth-core.js`(규격·프레임·스티커·글꼴 목록·합성 — PC/휴대폰 공통, 전역 변수 방식) · `mobile/`(휴대폰 PWA, https 로 열어야 카메라 됨, 완성 사진을 Drive `네컷사진` 폴더에 `네컷_시각_N장.jpg` 로 올림 → 교사가 직접 출력, QR 표시) · `print-station/`(선택: PC 자동 인쇄 대기 화면, `인쇄대기.bat`, 휴대폰 고급 설정 autoQueue 켜야 함) · `qr-server/Code.gs`(Apps Script: QR 업로드 + 인쇄 대기열 list/get/done)
- 프레임·스티커 문구를 바꿀 땐 `shared/booth-core.js` 만 고치면 PC·휴대폰 모두 반영. 휴대폰 글꼴은 4종만(`mobile/fonts.css`, 번호는 PC 와 동일 0·3·4·9), 캐릭터는 WebP 축소본(`mobile/characters/`). 다시 만들기: `python scripts/build-mobile-fonts.py`, `python scripts/build-mobile-characters.py`

- 진행 상황과 할 일: `작업내역_및_할일.md` 를 먼저 읽을 것
- 운영 설명: `사용설명서.md` / QR 서버: `qr-server/설치방법.md` / 에셋: `assets/README.md`
- 검사: `node scripts/check-app.cjs` (DOM·캔버스 모의; 브라우저·프린터 검사는 아님). 에셋 변경 후 `node scripts/build-assets.cjs`
- 흐름: 행사 세팅(첫 화면, `S.title/titleFont/shots/frameId/decoTheme`, 바꾸면 즉시 저장) → 부스 시작 → 촬영 → (6·8장) 사진 선택 → 프레임(`S.frameId` 고정이면 생략) → 꾸미기(`S.decoTheme` 탭부터) → 인쇄 매수 선택 → 촬영으로 복귀(반복, Esc 로 세팅). 화면 전환은 `go(id)`, 단계 호출 체인은 `startBooth → chooseMode → startShoot → showPick/goFrame → goDeco → compose → doPrint`
- 실행은 `실행.bat`(크롬 앱 모드, 자동 인쇄) — 경로에 한글·공백이 있어 퍼센트 인코딩 URL 로 넘김
- 사용자는 초등학교 교사. 답변은 한국어로, 기술 용어는 풀어서.
