import re, json, os
p = r"D:\01-项目\日语自学网站\scripts\supplement_n3\gogaku_grammar11.js"
src = open(p, encoding="utf-8").read()
m = re.search(r"const SET11Q=(\[[\s\S]*?\]);", src)
data = json.loads(m.group(1))
print(len(data))
for i, q in enumerate(data[:13], 1):
    print(f"{i}. {q['p']} | {' / '.join(q['o'])} | A={q['a']+1} | {q['why']}")
json.dump(data[:13], open(r"D:\01-项目\日语自学网站\scripts\supplement_n3\gogaku_raw.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
