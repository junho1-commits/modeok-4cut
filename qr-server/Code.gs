/* ============================================================
   모덕 네컷 — QR 사진 전달용 Google Apps Script
   - 촬영 PC(index.html)가 완성 사진(JPEG)을 POST 로 보내면
     학교 Google Drive 의 FOLDER_NAME 폴더에 저장하고
     "링크가 있는 사람은 볼 수 있음" 으로 공유한 뒤 주소를 돌려줍니다.
   - 앱은 그 주소를 QR 로 그려 학생/학부모 휴대폰으로 열게 합니다.
   - 휴대폰 앱(mobile/)은 print:true 로 보내 "인쇄 대기" 로 저장하고,
     PC 의 인쇄 대기 화면(print-station/)이 list → get → done 순으로 가져가 인쇄합니다.
     (파일 이름 앞에 print_ 가 붙어 있으면 아직 안 뽑은 사진, done_ 이면 인쇄 완료)
   - 사진은 자동으로 지우지 않습니다 (예전엔 7일 뒤 휴지통으로 보냈으나 2026-09-22 에 없앰). 정리는 Drive 에서 직접.
   배포 방법은 같은 폴더의 설치방법.md 참고
   ============================================================ */

const FOLDER_NAME = '네컷사진';   // Drive 에 자동 생성되는 폴더 이름

function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// GET
//   (없음)          : 앱 설정 화면의 "연결 확인" — 배포가 살아 있는지 확인용
//   action=list     : 인쇄 대기 사진 목록 (오래된 순) [{ id, name, copies, created }]
//   action=get&id=… : 사진 한 장을 data URL 로 (인쇄 대기 화면이 <img> 에 넣고 인쇄)
//   action=done&id=…: 인쇄 완료 표시 (이름 print_ → done_)
//   action=resetNumber: 오늘 사진 번호를 1번부터 다시
function doGet(e) {
  try {
    const q = (e && e.parameter) || {};
    if (q.action === 'list') {
      const files = folder_().getFiles(), list = [];
      while (files.hasNext()) {
        const f = files.next(), name = f.getName();
        if (name.indexOf('print_') !== 0) continue;
        const m = /_x(\d)\.jpg$/.exec(name);
        list.push({ id: f.getId(), name: name, copies: m ? Number(m[1]) : 1, created: f.getDateCreated().getTime() });
      }
      list.sort((a, b) => a.created - b.created);
      return json_({ ok: true, list: list.slice(0, 20) });
    }
    if (q.action === 'get') {
      const f = DriveApp.getFileById(q.id);
      return json_({ ok: true, id: q.id, name: f.getName(), image: 'data:image/jpeg;base64,' + Utilities.base64Encode(f.getBlob().getBytes()) });
    }
    if (q.action === 'done') {
      const f = DriveApp.getFileById(q.id);
      if (f.getName().indexOf('print_') === 0) f.setName('done_' + f.getName().slice(6));
      return json_({ ok: true });
    }
    if (q.action === 'resetNumber') {   // 오늘 사진 번호를 1번부터 다시 (휴대폰 고급 설정 버튼)
      PropertiesService.getScriptProperties().deleteProperty('seq_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd'));
      return json_({ ok: true });
    }
    return json_({ ok: true, folder: FOLDER_NAME, queue: true, numbering: true });   // numbering: 사진 제출 번호 기능이 있는 배포
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// 촬영 PC 에서 { image: "data:image/jpeg;base64,....", name: "4cut_20260917..." } 를 text/plain 으로 POST
// 휴대폰 앱은 { ..., submit: true, copies: 1~4 } 를 보냄 → 그날 순서 번호로 이름 붙여 저장(0922-037_2장.jpg)하고 number 를 돌려줌
// (선택) print: true 면 이름 앞에 print_ 가 붙어 PC 인쇄 대기열(print-station)에 들어감
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(body.image || '');
    if (!m) return json_({ ok: false, error: 'image 필드가 비었거나 JPEG 데이터 URL 이 아니에요' });
    let name = String(body.name || 'photo').replace(/[^\w가-힣-]/g, '_').slice(0, 60);
    const copies = Math.max(1, Math.min(4, Number(body.copies) || 1));
    let number = null;
    if (body.submit) {   // 휴대폰 "사진 제출": 그날 1번부터 순서대로 번호를 매겨 파일 이름으로 (여러 폰이 동시에 보내도 안 겹치게 잠금)
      const lock = LockService.getScriptLock(); lock.waitLock(10000);
      try {
        const props = PropertiesService.getScriptProperties();
        const key = 'seq_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
        number = Number(props.getProperty(key) || 0) + 1;
        props.setProperty(key, String(number));
      } finally { lock.releaseLock(); }
      name = Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMdd') + '-' + ('00' + number).slice(-3) + '_' + copies + '장';   // 예: 0922-037_2장
    }
    if (body.print) name = 'print_' + name + '_x' + copies;
    name += '.jpg';
    const blob = Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/jpeg', name);
    const file = folder_().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return json_({
      ok: true,
      number: number,            // 사진 제출이면 학생에게 알려줄 번호
      name: name,
      id: file.getId(),
      url: 'https://drive.google.com/file/d/' + file.getId() + '/view',   // 휴대폰에서 열면 미리보기 + 다운로드 버튼
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// 예전의 "7일 뒤 휴지통" 자동 정리를 없앰. 이미 등록된 트리거가 있으면 이 함수를 편집기에서 한 번 실행해 지우세요.
function removeCleanupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  folder_();   // 폴더는 없으면 만들어 둠
  console.log('자동 삭제 트리거 ' + triggers.length + '개 지움. 사진은 이제 자동으로 지워지지 않습니다. 폴더: ' + FOLDER_NAME);
}
