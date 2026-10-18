# -*- coding: utf-8 -*-
import io, re, json, sys

GRAMMAR = r"D:\01-项目\日语自学网站\src\data\grammar.js"

def load_levels():
    t = io.open(GRAMMAR, encoding="utf-8").read()
    m = re.search(r"export const grammarLevels = (\[\.*\]);?\s*$", t, re.S)
    if not m:
        m = re.search(r"export const grammarLevels = (\[.*\]);?\s*$", t, re.S)
    return t, json.loads(m.group(1))

def main(level_id, additions_path):
    raw = io.open(additions_path, encoding="utf-8").read()
    adds = json.loads(raw)
    t, data = load_levels()
    lv = [x for x in data if x["id"] == level_id][0]
    unit = lv["units"][-1]
    # renumber ids: continue after existing max
    existing_ids = [p["id"] for p in unit["points"]]
    maxnum = max(int(i.split("-")[1]) for i in existing_ids)
    for p in adds:
        maxnum += 1
        p["id"] = f"{level_id}-{maxnum}"
        unit["points"].append(p)
    # re-serialize compactly (matches existing minified format)
    out = re.sub(r"export const grammarLevels = \[.*\]\s*$",
                 "export const grammarLevels = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                 t, flags=re.S)
    io.open(GRAMMAR, "w", encoding="utf-8").write(out)
    print(f"{level_id}: now {len(unit['points'])} points (added {len(adds)})")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
