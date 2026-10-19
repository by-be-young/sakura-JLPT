# -*- coding: utf-8 -*-
import re, io, os, glob
BASE = r'D:\01-项目\日语自学网站\src\data'
ASSETS = r'D:\01-项目\日语自学网站\src\assets'
used = set()
files = 0
for root in ('listening-n1', 'listening-n5', 'listening-n4'):
    for f in glob.glob(os.path.join(BASE, root, 'unit*', '*.js')):
        files += 1
        txt = io.open(f, encoding='utf-8').read()
        # qrPage: 42 / "qrPage": 42 / "qrPages": [42, 43]
        for v in re.findall(r'qrPage[s]?["\']?\s*[:=]\s*["\']?(\d+)', txt):
            used.add((root, int(v)))
        for v in re.findall(r'qrPages["\']?\s*[:=]\s*\[([^\]]*)\]', txt):
            for x in re.findall(r'\d+', v):
                used.add((root, int(x)))
missing = [ (r, p) for r, p in sorted(used)
            if not os.path.exists(os.path.join(ASSETS, r, f'qr_p{p}.png')) ]
print('files scanned:', files)
print('referenced qrPages (%d):' % len(used))
for r, p in sorted(used):
    print('  %s/qr_p%d.png' % (r, p))
print('MISSING FILES:', missing if missing else 'none')
