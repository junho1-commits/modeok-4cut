# 꾸미기 에셋

## 사용 방법

촬영 후 꾸미기 화면에서 **학교 캐릭터** 탭을 선택하세요. 입체 지비츠, 3D 애니메이션, 봉제인형과 행사별 3D 캐릭터(졸업 4종·장애 공감 5종·입학 4종, 총 16종)를 누르면 두 캐릭터가 한 쌍으로 사진에 붙습니다. 드래그 이동, 회전 손잡이, 크기 조절을 사용할 수 있습니다.

**문구 글꼴**은 13종(주아·기랑해랑·연성·나눔손글씨 펜·개구쟁이·동글·큐트폰트·싱글데이·나눔손글씨 붓·도현·검은고딕·베이글팻·송명)에서 고를 수 있습니다. 선택한 문구와 이후 추가하는 문구에 적용됩니다. 글꼴과 캐릭터 준비가 끝난 뒤 30초 편집 시간이 시작됩니다.

프로그램을 옮길 때 `index.html`과 `assets` 폴더를 함께 복사하세요. 인터넷 연결이나 Windows 글꼴 설치는 필요하지 않습니다. 변경한 실행 방식은 앱을 닫은 뒤 `실행.bat`으로 다시 열어 적용합니다.

## 파일

- `characters/jibbitz.png`: 입체 고무 장식 스타일
- `characters/animation.png`: 픽사풍 3D 애니메이션 스타일
- `characters/plush.png`: 봉제인형 스타일
- `characters/characters.js`: 로컬 실행 및 이미지 저장용 데이터 URL 묶음
- `characters/제작기록.md`: 내장 이미지 생성 도구에 사용한 최종 프롬프트
- 원본 캐릭터 참고 이미지는 `캐릭터/결과물.png` (앱 실행에는 필요 없음)
- `fonts/*.ttf`: 실제 한글 글꼴 파일
- `fonts/*-OFL.txt`: 글꼴별 배포 라이선스 원문
- `fonts/fonts.css`: 인터넷 없이 사용하는 글꼴 묶음
- `qr/qrcode.min.js`: QR 코드 생성 라이브러리 (qrcode-generator 1.4.4, MIT — `qr/LICENSE-qrcode-generator.txt`)

글꼴 배포 출처: https://github.com/google/fonts/tree/main/ofl (jua, kiranghaerang, yeonsung, nanumpenscript, gaegu, dongle, cutefont, singleday, nanumbrushscript, dohyeon, blackhansans, bagelfatone, songmyung). 글꼴을 추가하려면 ttf 와 OFL.txt 를 `fonts/` 에 넣고 `scripts/build-assets.cjs` 의 fonts 배열과 `index.html` 의 STICKER_FONTS/FONT_NAMES 에 같은 순서로 추가한 뒤 `node scripts/build-assets.cjs` 를 실행합니다.

에셋 파일을 교체한 개발자는 `node scripts/build-assets.cjs`로 묶음을 갱신할 수 있습니다. `node scripts/check-app.cjs`는 DOM과 캔버스를 모의한 기능 검사이며, 실제 브라우저 화면/인쇄 검사를 대체하지 않습니다.

## 휴대폰판 에셋 (`mobile/`)
- `mobile/fonts/*.woff2` + `mobile/fonts.css`: 주아·나눔손글씨 펜·개구쟁이·도현 4종을 한글 2350자 범위로 잘라 압축(합계 약 1MB). `python scripts/build-mobile-fonts.py` 로 재생성 (pip install fonttools brotli)
- `mobile/characters/*.webp` + `list.js`: 캐릭터 16종을 가로 640px WebP 로 축소(합계 약 1.5MB). `python scripts/build-mobile-characters.py` 로 재생성 (목록은 `scripts/build-assets.cjs` 의 characters 배열을 읽음)
- 캐릭터를 추가할 때는 PC 용 `node scripts/build-assets.cjs` 와 휴대폰용 스크립트를 둘 다 실행
