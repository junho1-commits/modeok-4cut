/* ============================================================
   모덕 네컷 — QR 사진 전달용 Google Apps Script
   - 촬영 PC(index.html)가 완성 사진(JPEG)을 POST 로 보내면
     학교 Google Drive 의 FOLDER_NAME 폴더에 저장하고
     "링크가 있는 사람은 볼 수 있음" 으로 공유한 뒤 주소를 돌려줍니다.
   - 앱은 그 주소를 QR 로 그려 학생/학부모 휴대폰으로 열게 합니다.
   - cleanup() 을 매일 실행하는 트리거를 걸어 KEEP_DAYS 일이 지난 사진은 휴지통으로 보냅니다.
   배포 방법은 같은 폴더의 설치방법.md 참고
   ============================================================ */

const FOLDER_NAME = '네컷사진';   // Drive 에 자동 생성되는 폴더 이름
const KEEP_DAYS = 7;             // 사진 보관 일수 (지나면 휴지통)

function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 앱 설정 화면의 "연결 확인" 이 호출 — 배포가 살아 있는지 확인용
function doGet() {
  return json_({ ok: true, folder: FOLDER_NAME, keepDays: KEEP_DAYS });
}

// 촬영 PC 에서 { image: "data:image/jpeg;base64,....", name: "4cut_20260917..." } 를 text/plain 으로 POST
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(body.image || '');
    if (!m) return json_({ ok: false, error: 'image 필드가 비었거나 JPEG 데이터 URL 이 아니에요' });
    const name = String(body.name || 'photo').replace(/[^\w가-힣-]/g, '_').slice(0, 60) + '.jpg';
    const blob = Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/jpeg', name);
    const file = folder_().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return json_({
      ok: true,
      id: file.getId(),
      url: 'https://drive.google.com/file/d/' + file.getId() + '/view',   // 휴대폰에서 열면 미리보기 + 다운로드 버튼
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// 보관 기간이 지난 사진을 휴지통으로 (installCleanupTrigger 로 매일 새벽 3시에 실행)
function cleanup() {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  const files = folder_().getFiles();
  let n = 0;
  while (files.hasNext()) {
    const f = files.next();
    if (f.getDateCreated().getTime() < cutoff) { f.setTrashed(true); n++; }
  }
  console.log('휴지통으로 보낸 사진: ' + n + '장');
}

// 편집기에서 한 번만 실행 (권한 승인 창이 뜨면 허용)
function installCleanupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('cleanup').timeBased().everyDays(1).atHour(3).create();
  folder_();   // 폴더도 미리 만들어 둠
  console.log('매일 03시 cleanup 트리거 등록 완료, 폴더: ' + FOLDER_NAME);
}
