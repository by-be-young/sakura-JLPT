# -*- coding: utf-8 -*-
import pykakasi, sys
sys.stdout.reconfigure(encoding='utf-8')
kks = pykakasi.kakasi()
cases = [
    ("せっかくのチャンスを失ってしまった。", "うしなって"),
    ("彼は舞台芸術に一生を捧げました。", "げいじゅつ"),
    ("車の運転免許を持っていますか。", "めんきょ"),
    ("わたしは沖縄出身です。", "しゅっしん"),
    ("帰宅途中、携帯電話を失くした。", "とちゅう"),
    ("インターネットを使って新製品を宣伝します。", "せんでん"),
    ("きのうは非常に暑かったです。", "ひじょう"),
]
for s, opt in cases:
    print('SENT:', s, '| OPT:', opt)
    for it in kks.convert(s):
        print('    ', it['orig'], '->', it['hira'])
    print()
