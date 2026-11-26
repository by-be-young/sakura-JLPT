import re, json, sys
p = r"D:\01-项目\日语自学网站\src\data\supplement-n3.js"
src = open(p, encoding="utf-8").read()

# 读取题包与题目（模块里是两份 export，用标记切分）
pack_src = src[src.index("export const supplementPacks = ") + len("export const supplementPacks = "):src.index("export const supplementN3Questions = ")].rstrip().rstrip(";")
packs = json.loads(pack_src)
js = src[src.index("export const supplementN3Questions = ") + len("export const supplementN3Questions = "):].rstrip().rstrip(";")
d = json.loads(js)
print("total questions:", len(d))
for pack in packs:
    count = sum(1 for q in d if q["packId"] == pack["id"])
    print(f"{pack['id']}: {count} / {pack['count']}")

# checks
bad = [q["id"] for q in d if len(q["options"]) != 4 or not (1 <= q["answer"] <= 4)]
print("bad options/answer:", bad)
missing_translation = [q["id"] for q in d if not q["translation"]]
empty = [q["id"] for q in d if not q["explanation"]]
print("missing translation:", len(missing_translation))
print("empty explanation:", empty)
duplicates = [q["packId"] + ":" + str(q["no"]) for q in d]
dup_keys = sorted(k for k in set(duplicates) if duplicates.count(k) > 1)
if dup_keys:
    print("duplicate keys:", dup_keys)

# 题包来源分组字段必须规范
bad_origin = [(p["id"], p.get("origin")) for p in packs if p.get("origin") not in ("external", "original")]
print("bad origin:", bad_origin)

# 题目数应与题包元数据一致；总量 1000（163 外部精选 + 816 Challenge + 21 Shikaku）
mismatch = [(p["id"], p["count"]) for p in packs if sum(1 for q in d if q["packId"] == p["id"]) != p["count"]]
if bad or missing_translation or empty or mismatch or bad_origin or dup_keys or len(d) != 1000:
    print("VALIDATION FAILED", {"bad": bad, "missing_translation": missing_translation, "empty": empty, "mismatch": mismatch, "bad_origin": bad_origin, "dup": dup_keys, "total": len(d)})
    sys.exit(1)
print("VALIDATION OK")