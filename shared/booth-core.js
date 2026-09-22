/* ============================================================
   모덕 네컷 — PC(index.html)·휴대폰(mobile/)·인쇄 대기(print-station/) 공통 코드
   - 인쇄 규격, 프레임, 스티커 묶음, 글꼴 목록, 페이지(합성) 그리기
   - 전역 변수 방식(모듈 아님): 각 앱이 <script src="…/shared/booth-core.js"> 로 먼저 읽음
   - 각 앱이 제공해야 하는 전역: S (설정 객체: title·footer·showDate·titleFont)
   - 스티커 문구·프레임을 바꾸려면 이 파일만 고치면 PC·휴대폰 모두 반영됨
   ============================================================ */
/* ============================================================
   규격 (캐논 SELPHY CP1500 엽서 100×148mm, 300dpi)
   - 인화지 1장 = 1181 × 1748 px
   - 세로형 사진 4장을 2×2 로 배치, 아래에 학교명/날짜 영역
   ============================================================ */
const W = 1181, H = 1748;
const BLEED = 24;                 // 셀피는 가장자리 약 1~2mm가 잘리므로 여유
const LAYOUT = {
  side: 44,            // 좌우 여백
  top: 46 + BLEED,     // 위 여백
  gap: 22,             // 사진 사이 간격
  photoH: 690,         // 사진 높이 (세로형)
};
LAYOUT.photoW = Math.floor((W - LAYOUT.side * 2 - LAYOUT.gap) / 2);   // 535
const PHOTO_RATIO = LAYOUT.photoW / LAYOUT.photoH;                    // ≈0.775 (세로형)
const FOOTER_TOP = LAYOUT.top + LAYOUT.photoH * 2 + LAYOUT.gap;       // 1472 → 아래 약 250px 여백
document.documentElement.style.setProperty('--ratio', PHOTO_RATIO);

// 사진 칸 위치 (0:좌상 1:우상 2:좌하 3:우하)
function cell(i) {
  const col = i % 2, row = Math.floor(i / 2);
  return { x: LAYOUT.side + col * (LAYOUT.photoW + LAYOUT.gap), y: LAYOUT.top + row * (LAYOUT.photoH + LAYOUT.gap), w: LAYOUT.photoW, h: LAYOUT.photoH };
}

/* ============================================================
   프레임 정의
   - bg: 배경색, text: 문구색
   - back(ctx): 사진 뒤에 그리는 배경 장식
   - front(ctx): 사진 위에 그리는 장식 (여백 부분만)
   ============================================================ */
const F = {  // 장식용 헬퍼
  dots(ctx, color, step, r) {
    ctx.fillStyle = color;
    for (let y = step / 2; y < H; y += step)
      for (let x = step / 2 + ((Math.floor(y / step) % 2) ? step / 2 : 0); x < W; x += step) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
  },
  gingham(ctx, color, step) {
    ctx.fillStyle = color;
    for (let x = 0; x < W; x += step * 2) ctx.fillRect(x, 0, step, H);
    for (let y = 0; y < H; y += step * 2) ctx.fillRect(0, y, W, step);
  },
  stripes(ctx, colors, side) {   // 좌우 세로 무지개 줄
    const w = side / colors.length;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * w, 0, w, H);
      ctx.fillRect(W - side + i * w, 0, w, H);
    });
  },
  emojiRow(ctx, emojis, y, size, spread = 0.6) {
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const n = emojis.length, span = W * spread, start = (W - span) / 2;
    emojis.forEach((e, i) => ctx.fillText(e, start + (n === 1 ? span / 2 : span * i / (n - 1)), y));
    ctx.textBaseline = 'alphabetic';
  },
  corners(ctx, color, len, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    const m = BLEED + 12, X = m, Y = m, X2 = W - m, Y2 = H - m;
    [[X, Y, 1, 1], [X2, Y, -1, 1], [X, Y2, 1, -1], [X2, Y2, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + dy * len); ctx.lineTo(x, y); ctx.lineTo(x + dx * len, y); ctx.stroke();
    });
  },
  border(ctx, color, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    const m = BLEED + 8 + width / 2;
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  },
  sprockets(ctx, color) {   // 필름 구멍 (좌우)
    ctx.fillStyle = color;
    for (let y = 30; y < H; y += 44) {
      ctx.fillRect(10, y, 18, 26);
      ctx.fillRect(W - 28, y, 18, 26);
    }
  },
  gradient(ctx, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  cloud(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    [[0, 0, 1], [-0.9, 0.2, 0.7], [0.9, 0.2, 0.75], [-0.3, -0.5, 0.8], [0.4, -0.45, 0.7]].forEach(([dx, dy, r]) => {
      ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
    });
  },
  puzzle(ctx, x, y, s, color) {  // 퍼즐 조각 (장애인식 상징)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + s * 0.35, y);
    ctx.arc(x + s * 0.5, y, s * 0.15, Math.PI, 0, true);
    ctx.lineTo(x + s, y); ctx.lineTo(x + s, y + s * 0.35);
    ctx.arc(x + s, y + s * 0.5, s * 0.15, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(x + s, y + s); ctx.lineTo(x, y + s); ctx.closePath(); ctx.fill();
  },
  stars(ctx, color, n, seed = 7) {   // 흩뿌린 작은 별
    ctx.fillStyle = color;
    let s = seed;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = rnd() * H, r = 6 + rnd() * 10;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = Math.PI / 5 * k - Math.PI / 2, rr = k % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    }
  },
};

const RAINBOW = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
const FOOT_Y = FOOTER_TOP + 190;   // 하단 장식 이모지 기준선

const FRAMES = [
  { id: 'white', name: '화이트', bg: '#ffffff', text: '#333333' },
  { id: 'dotwhite', name: '화이트 도트', bg: '#ffffff', text: '#333333',
    back: c => F.dots(c, '#3a3a3a', 30, 3) },
  { id: 'black', name: '블랙', bg: '#111111', text: '#ffffff' },
  { id: 'film', name: '필름', bg: '#1a1a1a', text: '#f5e6a8',
    front: c => F.sprockets(c, '#f5e6a8') },
  { id: 'grad', name: '졸업', bg: '#1c2a4a', text: '#f4d27a',
    back: c => { F.stars(c, 'rgba(244,210,122,.35)', 40); F.border(c, '#f4d27a', 4); },
    front: c => F.emojiRow(c, ['🎓', '✨', '🎓'], FOOT_Y, 56, 0.5) },
  { id: 'enter', name: '입학', bg: '#ffe4ec', text: '#d24d72',
    back: c => F.dots(c, 'rgba(255,255,255,.8)', 56, 11),
    front: c => F.emojiRow(c, ['🌸', '🎒', '🌸'], FOOT_Y, 56, 0.5) },
  { id: 'together', name: '함께', bg: '#ffffff', text: '#2c7a5b',
    back: c => F.stripes(c, RAINBOW, 22),
    front: c => RAINBOW.forEach((col, i) => F.puzzle(c, W / 2 - 3 * 62 + i * 62 + 8, FOOT_Y - 20, 40, col)) },
  { id: 'sky', name: '하늘', bg: '#bfe3ff', text: '#2a5d9f',
    back: c => { F.gradient(c, [[0, '#8fd0ff'], [1, '#eaf6ff']]);
      F.cloud(c, 140, 40, 18); F.cloud(c, 1000, 60, 16); F.cloud(c, 260, FOOT_Y, 18); F.cloud(c, 930, FOOT_Y + 10, 16); } },
  { id: 'rainbow', name: '무지개', bg: '#ffffff', text: '#5a4a8a',
    back: c => F.gradient(c, [[0, '#ffd1dc'], [0.25, '#ffe8c8'], [0.5, '#fdfdc8'], [0.75, '#d3f5e2'], [1, '#d6e4ff']]) },
  { id: 'gingham', name: '체크', bg: '#ffffff', text: '#c94b4b',
    back: c => F.gingham(c, 'rgba(230,80,80,.28)', 24) },
  { id: 'dot', name: '노랑 도트', bg: '#fff1a8', text: '#7a5c00',
    back: c => F.dots(c, '#ffffff', 48, 10) },
  { id: 'mint', name: '민트', bg: '#d8f5e8', text: '#1f7a55',
    back: c => F.corners(c, '#1f7a55', 90, 5) },
  { id: 'xmas', name: '크리스마스', bg: '#1f5c3a', text: '#ffffff',
    back: c => F.dots(c, 'rgba(255,255,255,.35)', 64, 6),
    front: c => F.emojiRow(c, ['🎄', '⭐', '🎄'], FOOT_Y, 56, 0.5) },
];

/* ============================================================
   스티커 테마
   - ['e', 이모지]            : 이모지 스티커
   - ['t', 문구, 배경색]      : 말풍선형 문구 스티커
   ============================================================ */
const STICKER_THEMES = [
  { name: '졸업', items: [
    ['e', '🎓'], ['e', '📜'], ['e', '🎉'], ['e', '🏆'], ['e', '✨'], ['e', '🌟'], ['e', '💐'], ['e', '🎊'],
    ['t', '졸업 축하해!', '#1c2a4a'], ['t', 'GRADUATION', '#c9a227'], ['t', '꿈을 향해 GO!', '#e3496c'], ['t', '자랑스러운 졸업생', '#2c7a5b'], ['t', '6년 동안 수고했어', '#4a6fd9'],
  ] },
  { name: '입학', items: [
    ['e', '🌸'], ['e', '🎒'], ['e', '🌷'], ['e', '📚'], ['e', '🐣'], ['e', '🌱'], ['e', '🎈'], ['e', '🍀'],
    ['t', '입학을 축하해요', '#d24d72'], ['t', 'WELCOME!', '#ff924c'], ['t', '1학년이 되었어요', '#1982c4'], ['t', '설레는 첫날', '#8ac926'], ['t', '반가워 친구야', '#6a4c93'],
  ] },
  { name: '장애인식', items: [
    ['e', '🧩'], ['e', '🤝'], ['e', '💛'], ['e', '🌈'], ['e', '♿'], ['e', '🫶'], ['e', '🌻'], ['e', '🕊️'],
    ['t', '함께 가요', '#2c7a5b'], ['t', '다름은 특별함', '#6a4c93'], ['t', '모두가 소중해요', '#ff595e'], ['t', '틀린 게 아니라 다른 거야', '#1982c4'], ['t', '우리는 하나', '#ff924c'], ['t', '배려하는 마음', '#c9a227'],
  ] },
  { name: '학교', items: [
    ['e', '🏫'], ['e', '✏️'], ['e', '📏'], ['e', '🍎'], ['e', '🔔'], ['e', '📖'], ['e', '🧑‍🏫'], ['e', '⚽'],
    ['t', '모덕초 최고!', '#e3496c'], ['t', '우리 반 파이팅', '#1982c4'], ['t', '선생님 사랑해요', '#ff595e'], ['t', '운동회', '#8ac926'], ['t', '학예회', '#6a4c93'], ['t', '현장체험학습', '#ff924c'],
  ] },
  { name: '기본', items: [
    ['e', '💖'], ['e', '⭐'], ['e', '😍'], ['e', '😎'], ['e', '🥳'], ['e', '👑'], ['e', '🎀'], ['e', '🌙'], ['e', '🍀'], ['e', '🔥'], ['e', '💫'], ['e', '🐻'],
    ['t', 'BEST FRIENDS', '#e3496c'], ['t', '오늘 최고', '#1982c4'], ['t', 'LOVE', '#ff595e'], ['t', '행복해', '#ff924c'], ['t', 'HAPPY DAY', '#8ac926'],
  ] },
  { name: '계절', items: [
    ['e', '🌷'], ['e', '☀️'], ['e', '🍉'], ['e', '🍂'], ['e', '🍁'], ['e', '❄️'], ['e', '⛄'], ['e', '🎄'], ['e', '🎃'], ['e', '🌊'],
    ['t', '봄 소풍', '#ff6b8b'], ['t', '여름방학', '#1982c4'], ['t', '가을 운동회', '#ff924c'], ['t', '메리 크리스마스', '#1f5c3a'], ['t', '새해 복 많이', '#c9a227'],
  ] },
];

// scripts/build-assets.cjs 의 fonts 배열과 같은 순서
const STICKER_FONTS = [
  '"BoothJua", "Malgun Gothic", sans-serif',
  '"BoothKirang", "Malgun Gothic", sans-serif',
  '"BoothYeon", "Malgun Gothic", sans-serif',
  '"BoothPen", "Malgun Gothic", cursive',
  '"BoothGaegu", "Malgun Gothic", cursive',
  '"BoothDongle", "Malgun Gothic", sans-serif',
  '"BoothCute", "Malgun Gothic", sans-serif',
  '"BoothSingle", "Malgun Gothic", cursive',
  '"BoothBrush", "Malgun Gothic", cursive',
  '"BoothDoHyeon", "Malgun Gothic", sans-serif',
  '"BoothBlackHan", "Malgun Gothic", sans-serif',
  '"BoothBagel", "Malgun Gothic", sans-serif',
  '"BoothSongMyung", "Batang", serif',
];
const FONT_NAMES = [
  '주아체 · 동글동글', '기랑해랑체 · 장난스럽게', '연성체 · 따뜻하게', '나눔손글씨 펜 · 다이어리',
  '개구쟁이 · 삐뚤빼뚤 손글씨', '동글 · 말랑말랑', '큐트폰트 · 아기자기', '싱글데이 · 또박또박 손글씨',
  '나눔손글씨 붓 · 붓글씨', '도현체 · 굵고 또렷', '검은고딕 · 아주 굵게', '베이글팻 · 통통한 제목', '송명체 · 차분한 명조',
];
// 글꼴마다 같은 px 여도 보이는 크기가 달라서 보정 (동글은 유난히 작음)
const FONT_SCALE = { 5: 1.35 };
function titleFontSpec(px) {
  const i = STICKER_FONTS[S.titleFont] ? S.titleFont : 0;
  return { font: STICKER_FONTS[i], px: Math.round(px * (FONT_SCALE[i] || 1)) };
}
const characterImages = new Map();

// 웹캠은 어두우면 노이즈를 지우느라 얼굴을 뭉개 놓음 → 줄인 뒤 윤곽을 되살림 (언샤프 마스크: 원본 + amount × (원본 − 흐림))
const SHARPEN = 0.6;   // 0 이면 끔. 0.4~0.8 정도가 자연스러움
function sharpen(ctx, w, h, amount) {
  if (!amount) return;
  const img = ctx.getImageData(0, 0, w, h), src = img.data, out = new Uint8ClampedArray(src);
  const W4 = w * 4;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * W4 + x * 4;
      for (let k = 0; k < 3; k++) {
        const j = i + k;
        const blur = (src[j - W4 - 4] + src[j - W4] + src[j - W4 + 4] + src[j - 4] + src[j] + src[j + 4] + src[j + W4 - 4] + src[j + W4] + src[j + W4 + 4]) / 9;
        out[j] = src[j] + amount * (src[j] - blur);
      }
    }
  }
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
}

/* ---------- 페이지 그리기 ---------- */
const MAX_STK_W = W - 80;   // 문구 스티커 최대 폭
function stickerBox(ctx, s) {     // 스티커의 폭/높이 (회전 전 기준)
  if (s.kind === 'i') {
    const img = characterImages.get(s.text), ratio = img ? img.naturalWidth / img.naturalHeight : 1;
    return { w: s.size * Math.min(ratio,1), h:s.size / Math.max(ratio,1), fs:s.size };
  }
  if (s.kind === 'e') return { w: s.size * 1.1, h: s.size * 1.1, fs: s.size };
  let fs = s.size * 0.42;
  ctx.font = `400 ${fs}px ${s.font || STICKER_FONTS[0]}`;
  let w = ctx.measureText(s.text).width + fs * 1.2;
  if (w > MAX_STK_W) { fs *= MAX_STK_W / w; ctx.font = `400 ${fs}px ${s.font || STICKER_FONTS[0]}`; w = ctx.measureText(s.text).width + fs * 1.2; }
  return { w, h: fs * 1.7, fs };
}
function drawSticker(ctx, s, highlight) {
  const b = stickerBox(ctx, s);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rot * Math.PI / 180);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (s.kind === 'i') {
    const img = characterImages.get(s.text);
    if (img) ctx.drawImage(img, -b.w/2, -b.h/2, b.w, b.h);
  } else if (s.kind === 'e') {
    ctx.font = `${b.fs}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = b.fs * .08; ctx.shadowOffsetY = b.fs * .05;
    ctx.lineWidth = Math.max(5, b.fs * .055); ctx.strokeStyle = '#fff';
    ctx.strokeText(s.text, 0, 0);
    ctx.fillText(s.text, 0, 0);
    ctx.shadowColor = 'transparent';
  } else {
    ctx.font = `400 ${b.fs}px ${s.font || STICKER_FONTS[0]}`;
    ctx.fillStyle = s.bg;
    ctx.shadowColor = 'rgba(41,26,32,.20)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 7;
    ctx.beginPath();
    if (s.style === 'tape') ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 12);
    else if (s.style === 'caption') ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 5);
    else ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, b.h / 2);
    ctx.fill(); ctx.shadowColor = 'transparent';
    if (s.style === 'caption') { ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.fillRect(-b.w / 2, -b.h / 2, 12, b.h); }
    if (s.style === 'tape') {
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.setLineDash([12, 9]);
      ctx.strokeRect(-b.w / 2 + 9, -b.h / 2 + 9, b.w - 18, b.h - 18); ctx.setLineDash([]);
    }
    ctx.fillStyle = '#fff';
    ctx.fillText(s.text, 0, b.fs * 0.06);
  }
  if (highlight) {
    ctx.strokeStyle = '#ff6b8b'; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.roundRect(-b.w / 2 - 10, -b.h / 2 - 10, b.w + 20, b.h + 20, 18); ctx.stroke();
    ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(0, -b.h / 2 - 10); ctx.lineTo(0, -b.h / 2 - 56); ctx.stroke();
    ctx.fillStyle = '#ff6b8b'; ctx.beginPath(); ctx.arc(0, -b.h / 2 - 64, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 21px sans-serif'; ctx.fillText('↻', 0, -b.h / 2 - 63);
  }
  ctx.restore();
}
function stickerHit(ctx, s, px, py) {   // 회전을 고려한 사각형 판정
  const b = stickerBox(ctx, s);
  const a = -s.rot * Math.PI / 180, dx = px - s.x, dy = py - s.y;
  const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(lx) <= b.w / 2 + 10 && Math.abs(ly) <= b.h / 2 + 10;
}
function rotationHandleHit(ctx, s, px, py) {
  const b = stickerBox(ctx, s), a = -s.rot * Math.PI / 180, dx = px - s.x, dy = py - s.y;
  const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.hypot(lx, ly + b.h / 2 + 64) <= 34;
}

function drawPage(ctx, frame, photos, opts = {}) {
  ctx.fillStyle = frame.bg;
  ctx.fillRect(0, 0, W, H);
  if (frame.back) frame.back(ctx);
  // 사진 4장 (2×2)
  photos.forEach((p, i) => {
    const c = cell(i);
    ctx.drawImage(p, c.x, c.y, c.w, c.h);
  });
  if (frame.img) ctx.drawImage(frame.img, 0, 0, W, H);
  if (frame.front) frame.front(ctx);
  // 하단 문구
  ctx.fillStyle = frame.text;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const tf = titleFontSpec(76);
  ctx.font = `400 ${tf.px}px ${tf.font}`;
  const maxTitleW = W - 140;   // 긴 행사 이름은 폭에 맞춰 줄임
  const tw = ctx.measureText(S.title).width;
  if (tw > maxTitleW) ctx.font = `400 ${Math.floor(tf.px * maxTitleW / tw)}px ${tf.font}`;
  ctx.fillText(S.title, W / 2, FOOTER_TOP + 100);
  const sf = titleFontSpec(38);
  ctx.font = `400 ${sf.px}px ${sf.font}`;
  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const sub = [S.footer, S.showDate ? dateStr : ''].filter(Boolean).join('  ·  ');
  if (sub) ctx.fillText(sub, W / 2, FOOTER_TOP + 156);
  // 스티커
  if (opts.stickers) opts.stickers.forEach((s, i) => drawSticker(ctx, s, opts.highlight === i));
}

function makePageCanvas(frame, photos, opts) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';   // 큰 사진을 칸 크기로 줄일 때 계단 현상 없이 부드럽게
  drawPage(ctx, frame, photos, opts);
  return c;
}
