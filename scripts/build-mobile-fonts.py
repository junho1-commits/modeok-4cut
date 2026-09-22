# 휴대폰용 글꼴 만들기: assets/fonts 의 ttf 4종을 한글 2350자+영문 범위로 잘라 woff2 로 압축
# 실행: python scripts/build-mobile-fonts.py   (필요: pip install fonttools brotli)
# 글꼴 번호는 shared/booth-core.js 의 STICKER_FONTS 순서와 같아야 PC 와 설정이 호환됨
import os, shutil
from fontTools import subset
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
FONTS = [(0, 'Jua-Regular.ttf', 'BoothJua', 'jua'), (3, 'NanumPenScript-Regular.ttf', 'BoothPen', 'nanumpenscript'),
         (4, 'Gaegu-Bold.ttf', 'BoothGaegu', 'gaegu'), (9, 'DoHyeon-Regular.ttf', 'BoothDoHyeon', 'dohyeon')]
UNICODES = 'U+0020-007E,U+00A0-00FF,U+2013-2026,U+3131-318E,U+AC00-D7A3,U+FF01-FF5E'
os.makedirs('mobile/fonts', exist_ok=True)
css = ['/* 휴대폰용 글꼴 4종 (OFL). 원본 ttf 는 assets/fonts/, 만드는 스크립트는 scripts/build-mobile-fonts.py */']
for idx, ttf, fam, short in FONTS:
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.hinting = False
    f = subset.load_font(f'assets/fonts/{ttf}', opts)
    sb = subset.Subsetter(opts); sb.populate(unicodes=subset.parse_unicodes(UNICODES)); sb.subset(f)
    subset.save_font(f, f'mobile/fonts/{short}.woff2', opts)
    shutil.copy(f'assets/fonts/{short}-OFL.txt', f'mobile/fonts/{short}-OFL.txt')
    css.append(f'@font-face {{ font-family:"{fam}"; src:url("fonts/{short}.woff2") format("woff2"); font-display:swap; }}')
    print(short, os.path.getsize(f'mobile/fonts/{short}.woff2') // 1024, 'KB')
open('mobile/fonts.css', 'w', encoding='utf-8').write('\n'.join(css) + '\n')
