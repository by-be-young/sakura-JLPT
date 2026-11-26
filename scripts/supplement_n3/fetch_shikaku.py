import json, os, re, time, urllib.parse, sys
import requests

D = os.path.dirname(os.path.abspath(__file__))
SRC = "https://shikaku-bootcamp.com/data/jlpt-n3/releases/20261115-001/questions.json"
RAW_PATH = os.path.join(D, "shikaku_raw.json")
OUT_PATH = os.path.join(D, "shikaku_extra.json")
CACHE_PATH = os.path.join(D, "shikaku_translations.json")
TARGET_COUNT = 21


def ensure_raw():
    if os.path.exists(RAW_PATH):
        return json.load(open(RAW_PATH, encoding="utf-8"))
    r = requests.get(SRC, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    data = r.json()
    json.dump(data, open(RAW_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return data


def norm(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    s = re.sub(r"[\s　]+", "", s)
    return s


def translate(text):
    if not text:
        return ""
    u = "https://api.mymemory.translated.net/get?q=" + urllib.parse.quote(text) + "&langpair=ja|zh-CN"
    for attempt in range(3):
        try:
            r = requests.get(u, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            data = r.json()
            if data.get("responseStatus") == 200:
                return (data.get("responseData") or {}).get("translatedText", "") or ""
            time.sleep(1 + attempt)
        except Exception:
            time.sleep(1 + attempt)
    return ""


def pick(data, challenge_raw):
    challenge_sentences = set()
    for items in challenge_raw.values():
        for q in items:
            challenge_sentences.add(norm(q.get("question", "")))
    by_tag = {}
    for q in data:
        if q.get("subject") not in ("文字・語彙", "文法"):
            continue
        if q.get("type") != "4choice" or len(q.get("choices") or []) != 4:
            continue
        if not isinstance(q.get("answer"), int) or not (0 <= q["answer"] <= 3):
            continue
        if norm(q.get("question", "")) in challenge_sentences:
            continue
        by_tag.setdefault((q["subject"], q.get("tag", "")), []).append(q)
    plan = {
        "文字・語彙": [("漢字読み", 3), ("表記", 2), ("文脈規定", 2), ("言い換え類義", 2), ("用法", 2)],
        "文法": [("文法形式の判断", 5), ("文の組み立て", 3), ("文章の文法", 2)],
    }
    selected = []
    for subject, specs in plan.items():
        for tag, n in specs:
            pool = by_tag.get((subject, tag), [])
            selected.extend(pool[:n])
    if len(selected) < TARGET_COUNT:
        raise SystemExit(f"only selected {len(selected)} / {TARGET_COUNT}")
    return selected[:TARGET_COUNT]


def build():
    data = ensure_raw()
    challenge_raw = json.load(open(os.path.join(D, "challenge_raw.json"), encoding="utf-8"))
    items = pick(data, challenge_raw)
    cache = json.load(open(CACHE_PATH, encoding="utf-8")) if os.path.exists(CACHE_PATH) else {}
    questions = []
    for i, q in enumerate(items, 1):
        qid = q["id"]
        question = q["question"].replace("\n", "<br>")
        question = re.sub(r"【([^】]+)】", r"<u>\1</u>", question)
        sentence = re.sub(r"（\s*）", "（　　）", question)
        summary = q["explain"].split("総合解説：")[-1].strip() if "総合解説：" in q["explain"] else q["explain"].strip()
        if qid not in cache:
            cache[qid] = {
                "translation": translate(q.get("correct_sentence") or re.sub(r"<[^>]+>", "", question)),
                "explanation": translate(summary),
            }
            json.dump(cache, open(CACHE_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            time.sleep(0.25)
        zh = cache[qid]
        questions.append({
            "id": 7000 + i,
            "no": i,
            "packId": "sb-extra-21",
            "level": "N3",
            "type": "文字・語彙" if q["subject"] == "文字・語彙" else "文法",
            "part": 1,
            "partName": "外部补充混合",
            "unit": 1,
            "sentence": sentence,
            "sentenceFurigana": sentence,
            "options": q["choices"],
            "answer": q["answer"] + 1,
            "translation": zh.get("translation") or "（本题为网页原题，译文暂缺）",
            "explanation": zh.get("explanation") or q["explain"],
            "sourceId": qid,
        })
    pack = {
        "id": "sb-extra-21",
        "level": "N3",
        "title": "N3 外部补充 21 题",
        "shortTitle": "外部补充 21",
        "type": "文字・語彙・文法",
        "origin": "external",
        "provider": "資格ブートキャンプ",
        "providerNote": "公开 N3 WEB 问题，四选一，附正解与日文解说，非历年真题；中文译文由机器翻译辅助",
        "url": "https://shikaku-bootcamp.com/shikaku/jlpt-n3/practice/",
        "count": TARGET_COUNT,
        "parts": [{"no": 1, "name": "文字・語彙・文法 混合", "count": TARGET_COUNT}],
    }
    out = {"packs": [pack], "questions": questions}
    json.dump(out, open(OUT_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("written", OUT_PATH, len(questions), "questions")
    print("empty translation", sum(1 for x in questions if not x["translation"]))


if __name__ == "__main__":
    build()
