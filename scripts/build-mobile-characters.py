# 휴대폰용 캐릭터 스티커 만들기: assets/characters/*.png(1.5MB 안팎)을 가로 640px WebP(투명 유지) 로 줄여 mobile/characters/ 에 저장
# 실행: python scripts/build-mobile-characters.py   (필요: pip install pillow)
# 목록(id·이름)은 scripts/build-assets.cjs 의 characters 배열과 같음
import os, re, json
from PIL import Image
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
src = open('scripts/build-assets.cjs', encoding='utf-8').read()
chars = re.findall(r"\['([a-z_]+)',\s*'([^']+)'\]", src)
os.makedirs('mobile/characters', exist_ok=True)
out = []
for cid, label in chars:
    im = Image.open(f'assets/characters/{cid}.png').convert('RGBA')
    w = 640; h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(f'mobile/characters/{cid}.webp', 'WEBP', quality=88, method=6)
    out.append({'id': cid, 'label': label, 'src': f'characters/{cid}.webp'})
    print(cid, os.path.getsize(f'mobile/characters/{cid}.webp') // 1024, 'KB')
open('mobile/characters/list.js', 'w', encoding='utf-8').write('// scripts/build-mobile-characters.py 가 만듦. PC 의 characters.js 와 같은 모양이지만 파일 주소를 씀\nwindow.BOOTH_CHARACTERS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print(len(out), 'characters')
