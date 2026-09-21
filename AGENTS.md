# 모덕 네컷 (인생네컷 포토부스)

단일 파일 웹앱(`index.html`) + 내장 에셋. 웹캠으로 찍어 캐논 SELPHY CP1500(100×148mm, 1181×1748px)에 인쇄하고, 완성 사진을 Google Drive 에 올려 QR 로 전달한다.

- 진행 상황과 할 일: `작업내역_및_할일.md` 를 먼저 읽을 것
- 운영 설명: `사용설명서.md` / QR 서버: `qr-server/설치방법.md` / 에셋: `assets/README.md`
- 검사: `node scripts/check-app.cjs` (DOM·캔버스 모의; 브라우저·프린터 검사는 아님). 에셋 변경 후 `node scripts/build-assets.cjs`
- 흐름: 행사 세팅(첫 화면, `S.title/titleFont/shots/frameId/decoTheme`, 바꾸면 즉시 저장) → 부스 시작 → 촬영 → (6·8장) 사진 선택 → 프레임(`S.frameId` 고정이면 생략) → 꾸미기(`S.decoTheme` 탭부터) → 인쇄 매수 선택 → 촬영으로 복귀(반복, Esc 로 세팅). 화면 전환은 `go(id)`, 단계 호출 체인은 `startBooth → chooseMode → startShoot → showPick/goFrame → goDeco → compose → doPrint`
- 실행은 `실행.bat`(크롬 앱 모드, 자동 인쇄) — 경로에 한글·공백이 있어 퍼센트 인코딩 URL 로 넘김
- 사용자는 초등학교 교사. 답변은 한국어로, 기술 용어는 풀어서.
