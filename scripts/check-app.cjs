const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const elements = new Map(), intervals = new Map(), documentEvents = {};
let nextInterval = 1, imageDraws = 0;
const ctx = new Proxy({ measureText: text => ({width:text.length * 38}), drawImage: () => imageDraws++ }, {
  get(target,key) { return key in target ? target[key] : () => {}; },
});
function element(id='') {
  const classes = new Set(id === 'idle' ? ['screen','active'] : ['screen']);
  const el = { id, value:'', textContent:'', children:[], style:{setProperty(){}}, events:{},
    classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){v?classes.add(k):classes.delete(k)}},
    appendChild(child){this.children.push(child)}, append(...children){this.children.push(...children)},
    addEventListener(k,fn){this.events[k]=fn}, getContext:()=>ctx, toDataURL:()=> 'data:image/jpeg;base64,test',
    getBoundingClientRect:()=>({left:0,top:0,width:1181,height:1748}), setPointerCapture(){}, closest:()=>null,
  };
  return el;
}
const screens = ['idle','frame','shoot','pick','deco','result'].map(id=>{const el=element(id);elements.set(id,el);return el});
const document = { documentElement:element(), body:element(),
  fonts:{load:()=>Promise.resolve([])}, createElement:()=>element(),
  getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)},
  querySelectorAll:selector=>selector === '.screen' ? screens : [],
  querySelector:()=>screens.find(s=>s.classList.contains('active')),
  addEventListener:(key,fn)=>documentEvents[key]=fn,
};
const sandbox = {document,window:{},console,Date,Math,Promise,localStorage:{getItem:()=>null},
  Image:class{constructor(){this.naturalWidth=1254;this.naturalHeight=1254}set src(value){this._src=value;queueMicrotask(()=>this.onload?.())}},
  setInterval(fn){const id=nextInterval++;intervals.set(id,fn);return id}, clearInterval:id=>intervals.delete(id), setTimeout,clearTimeout,
  AbortController:class{constructor(){this.signal={}}abort(){}}, fetch:async()=>({json:async()=>({ok:false,error:'test sandbox has no network'})}),
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'assets/characters/characters.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'shared/booth-core.js'),'utf8'),sandbox);   // PC·휴대폰 공통 코드
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const script = html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
vm.runInContext(script,sandbox);
const run = code=>vm.runInContext(code,sandbox);
(async()=>{
  await run('assetsReady');
  assert.equal(run('characterImages.size'), 16);
  assert.equal(run('FONT_NAMES.length'), 13);
  assert.equal(run('STICKER_FONTS.length'), run('FONT_NAMES.length'), 'Font name list must match font list');
  await run('goDeco()');
  assert.equal(elements.get('decoTimer').textContent,'꾸미기 60초');
  run("addSticker(['i','jibbitz','입체 지비츠'])");
  assert.ok(imageDraws>0,'Image stickers must use canvas drawImage');
  run('stkRotate(15); stkScale(1.2)');
  assert.equal(run('stickers[0].size'),372);
  assert.ok(run('stickerHit(document.getElementById("stickerCanvas").getContext("2d"),stickers[0],stickers[0].x,stickers[0].y)'));
  run("addSticker(['t','모덕초 친구들','#315b78']); setStickerFont(STICKER_FONTS[3])");
  assert.equal(run('stickers[1].font'),run('STICKER_FONTS[3]'));
  const count = run('stickers.length');
  documentEvents.keydown({key:'Delete',target:{closest:()=>({})}});
  assert.equal(run('stickers.length'),count,'Typing must not trigger sticker deletion');
  const tick = intervals.get(run('decoTimer'));
  for(let i=0;i<60;i++)tick();
  assert.ok(elements.get('result').classList.contains('active'),'Timer must compose the result');
  assert.equal(run('decoTimer'),null);
  run("go('idle')");
  assert.ok(run("document.getElementById('setupFont').children.length"), 13, 'Setup font list must be filled');
  run("document.getElementById('setupTitle').value='모덕초 졸업식'; document.getElementById('setupFooter').value='졸업을 축하해요'; document.getElementById('setupFont').value='9'; document.getElementById('setupDate').checked=false; document.getElementById('setupShots').value='6'; document.getElementById('setupFrame').value='grad'; document.getElementById('setupTheme').value='입학'; setupChanged()");
  assert.equal(run('S.title'),'모덕초 졸업식'); assert.equal(run('S.footer'),'졸업을 축하해요'); assert.equal(run('S.titleFont'),9);
  assert.equal(run('S.showDate'),false); assert.equal(run('S.shots'),6); assert.equal(run('S.frameId'),'grad'); assert.equal(run('S.decoTheme'),'입학');
  assert.ok(elements.get('idle').classList.contains('active'),'Changing setup must not start capture');
  await run('goFrame()');
  assert.ok(elements.get('deco').classList.contains('active'),'Fixed frame must skip the frame screen');
  assert.equal(run('selectedFrame.id'),'grad');
  assert.equal(run('STICKER_THEMES[decoTab].name'),'입학','Deco must open on the configured theme');
  run("go('idle'); document.getElementById('setupFrame').value=''; setupChanged()");
  await run('goFrame()');
  assert.ok(elements.get('frame').classList.contains('active'),'Student choice must show the frame screen');
  for(const file of fs.readdirSync(path.join(root,'assets/fonts')).filter(f=>f.endsWith('.ttf'))) {
    assert.equal(fs.readFileSync(path.join(root,'assets/fonts',file)).readUInt32BE(0),65536,'Valid TrueType signature');
  }
  console.log('PASS: asset loading, character drawing, rotation/size/hit testing, Korean font selection, typing guard, 60-second completion, event setup (title font, fixed frame, sticker theme), font file signatures.');
  console.log('Scope: JavaScript integration with simulated DOM/canvas; not a real browser visual or printer test.');
})().catch(error=>{console.error(error);process.exitCode=1});
