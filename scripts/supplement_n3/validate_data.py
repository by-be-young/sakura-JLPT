import re, json
p = r"D:\01-项目\日语自学网站\src\data\supplement-n3.js"
src = open(p, encoding="utf-8").read()
js = src[src.index("export const supplementN3Questions = ") + len("export const supplementN3Questions = "):].rstrip().rstrip(";")
d = json.loads(js)
print(len(d))
for i in [0, 24, 44, 100, 119, 120, 149]:
    q = d[i]
    print("\n---", q["id"], q["packId"], q["type"], q["partName"])
    print("S:", q["sentence"])
    print("F:", q.get("sentenceFurigana"))
    print("O:", q["options"], "ANS", q["answer"])
    print("T:", q["translation"])
    print("E:", q["explanation"])
# checks
bad = [q["id"] for q in d if len(q["options"]) != 4 or not (1 <= q["answer"] <= 4)]
print("bad options/answer:", bad)
empty = [q["id"] for q in d if not q["translation"] or not q["explanation"]]
print("empty zh:", empty)
