import re, json, html
p = r"D:\01-项目\日语自学网站\scripts\supplement_n3\coto_n3_vocab.html"
raw = open(p, encoding="utf-8").read()
qs = {}
for m in re.finditer(r"<p>Q(\d+)\.\s*(.*?)<br>\s*A\.\s*(.*?)<br>\s*B\.\s*(.*?)<br>\s*C\.\s*(.*?)<br>\s*D\.\s*(.*?)</p>", raw, re.S):
    n = int(m.group(1))
    stem = re.sub(r"<[^>]+>", "", m.group(2)).strip()
    opts = [re.sub(r"<[^>]+>", "", m.group(i)).strip() for i in (3,4,5,6)]
    qs[n] = {"stem": stem, "options": opts}
ans = {}
head = raw.find("Answer key")
for m in re.finditer(r"Q(\d+)\.\s*([A-D])\.", raw[head:]):
    ans[int(m.group(1))] = "ABCD".index(m.group(2)) + 1
print(len(qs), len(ans))
missing = [n for n in range(1,31) if n not in qs or n not in ans]
print("missing", missing)
for n in range(1,31):
    print(n, qs[n]["stem"], qs[n]["options"], ans.get(n))
json.dump([{"no":n, **qs[n], "answer":ans[n]} for n in range(1,31)], open(r"D:\01-项目\日语自学网站\scripts\supplement_n3\coto_raw.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
