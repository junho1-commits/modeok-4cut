// Bundle original local files as data URLs so file:// also exports an untainted canvas.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const fonts = [   // [CSS family, ttf] — index.html 의 STICKER_FONTS / FONT_NAMES 와 순서를 맞출 것
  ['BoothJua', 'Jua-Regular.ttf'], ['BoothKirang', 'KirangHaerang-Regular.ttf'],
  ['BoothYeon', 'YeonSung-Regular.ttf'], ['BoothPen', 'NanumPenScript-Regular.ttf'],
  ['BoothGaegu', 'Gaegu-Bold.ttf'], ['BoothDongle', 'Dongle-Bold.ttf'],
  ['BoothCute', 'CuteFont-Regular.ttf'], ['BoothSingle', 'SingleDay-Regular.ttf'],
  ['BoothBrush', 'NanumBrushScript-Regular.ttf'], ['BoothDoHyeon', 'DoHyeon-Regular.ttf'],
  ['BoothBlackHan', 'BlackHanSans-Regular.ttf'], ['BoothBagel', 'BagelFatOne-Regular.ttf'],
  ['BoothSongMyung', 'SongMyung-Regular.ttf'],
];
fs.writeFileSync(path.join(root, 'assets/fonts/fonts.css'), fonts.map(([family, file]) => {
  const data = fs.readFileSync(path.join(root, 'assets/fonts', file)).toString('base64');
  return `@font-face { font-family:"${family}"; src:url("data:font/ttf;base64,${data}") format("truetype"); font-weight:400; font-style:normal; font-display:block; }`;
}).join('\n'));
const characters = [
  ['jibbitz', '입체 지비츠'],
  ['animation', '3D 기본'],
  ['plush', '포근한 봉제인형'],
  ['animation_grad_diploma', '3D 졸업 · 졸업장과 V'],
  ['animation_grad_bouquet', '3D 졸업 · 축하 꽃다발'],
  ['animation_grad_cheer', '3D 졸업 · 학사모와 환호'],
  ['animation_grad_heart', '3D 졸업 · 손하트'],
  ['animation_awareness_sign', '3D 장애인식 · 사랑의 수어'],
  ['animation_awareness_wheelchair', '3D 장애인식 · 함께 가요'],
].map(([id, label]) => ({
  id, label, src: 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets/characters', id + '.png')).toString('base64'),
}));
fs.writeFileSync(path.join(root, 'assets/characters/characters.js'), 'window.BOOTH_CHARACTERS = ' + JSON.stringify(characters) + ';\n');
console.log(`Bundled ${fonts.length} Korean fonts and ${characters.length} transparent character assets.`);
