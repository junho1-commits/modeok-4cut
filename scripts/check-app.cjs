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
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'assets/characters/characters.js'),'utf8'),sandbox);
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const script = html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
vm.runInContext(script,sandbox);
const run = code=>vm.runInContext(code,sandbox);
(async()=>{
  await run('assetsReady');
  assert.equal(run('characterImages.size'), 9);
  assert.equal(run('FONT_NAMES.length'), 4);
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
  for(const key of '1234')documentEvents.keydown({key,target:{closest:()=>null}});
  assert.ok(document.body.classList.contains('secret-unlocked'));
  assert.ok(elements.get('idle').classList.contains('active'),'Secret code must not start capture');
  for(const file of ['Jua-Regular.ttf','KirangHaerang-Regular.ttf','YeonSung-Regular.ttf','NanumPenScript-Regular.ttf']) {
    assert.equal(fs.readFileSync(path.join(root,'assets/fonts',file)).readUInt32BE(0),65536,'Valid TrueType signature');
  }
  console.log('PASS: asset loading, character drawing, rotation/size/hit testing, Korean font selection, typing guard, 60-second completion, secret code, font file signatures.');
  console.log('Scope: JavaScript integration with simulated DOM/canvas; not a real browser visual or printer test.');
})().catch(error=>{console.error(error);process.exitCode=1});
