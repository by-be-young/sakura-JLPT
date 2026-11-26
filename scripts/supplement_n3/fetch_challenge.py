import json, os, re, time, sys
import html as htmlmod
import requests

D = os.path.dirname(os.path.abspath(__file__))
API = "https://www.challenge-jlpt.com/api/questions.php"
TRANS = "https://www.challenge-jlpt.com/api/translate.php"
MYMEMORY = "https://api.mymemory.translated.net/get"
TARGETS = {"vocabulary": 325, "grammar": 241, "kanji_choice": 250}
RAW_PATH = os.path.join(D, "challenge_raw.json")
TRANS_PATH = os.path.join(D, "challenge_translations.json")
HEADERS = {"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "Mozilla/5.0"}


def request_json(url, body, retries=4):
    last = None
    for attempt in range(retries):
        try:
            r = requests.post(url, json=body, headers=HEADERS, timeout=45)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(2 + attempt * 2)
                last = r
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            last = e
            time.sleep(1.5 + attempt * 2)
    raise RuntimeError(f"request failed: {url}: {last}")


def collect(kind, target):
    items, seen = [], set()
    while len(items) < target:
        body = {"level": "N3", "type": kind, "count": min(50, target - len(items)),
                "mode": "unseen", "studied": list(seen), "review": []}
        data = request_json(API, body)
        batch = data.get("items") or []
        new = 0
        for q in batch:
            qid = q.get("id")
            if qid and qid not in seen:
                seen.add(qid)
                items.append(q)
                new += 1
        print(f"{kind}: {len(items)}/{target} (batch={len(batch)}, new={new})", flush=True)
        if not batch or not new:
            break
        time.sleep(0.35)
    if len(items) < target:
        raise SystemExit(f"{kind} only collected {len(items)} / {target}")
    return items[:target]


def collect_all():
    raw = {}
    for kind, target in TARGETS.items():
        raw[kind] = collect(kind, target)
    json.dump(raw, open(RAW_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("written", RAW_PATH, {k: len(v) for k, v in raw.items()})


def extract_translation(zh):
    if not zh:
        return ""
    # 站点解析通常以「完整句子是「…」（中文译文）」结尾
    patterns = [
        r"完整(?:的)?句子是[「『]([^」』]+)[」』][（(]([^）)]*[\u4e00-\u9fff][^）)]*)[）)]",
        r"完整(?:的)?句子是[「『]([^」』]+)[」』][。.]?[（(]([^）)]*[\u4e00-\u9fff][^）)]*)[）)]",
    ]
    for p in patterns:
        m = re.search(p, zh)
        if m:
            return m.group(2).strip()
    return ""


def translate_one(q):
    qid = q["id"]
    data = request_json(TRANS, {"id": qid, "target": "zh-CN"})
    zh = (data.get("translation") or "").strip()
    return qid, zh, extract_translation(zh)


def load_all():
    raw = json.load(open(RAW_PATH, encoding="utf-8"))
    return [q for kind in TARGETS for q in raw[kind]]


def load_cache():
    return json.load(open(TRANS_PATH, encoding="utf-8")) if os.path.exists(TRANS_PATH) else {}


def save_cache(cache):
    json.dump(cache, open(TRANS_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def clean_ja(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    s = htmlmod.unescape(s).strip()
    s = re.sub(r"[。.]{2,}", "。", s)
    return s


def mymemory(text):
    params = {"q": text, "langpair": "ja|zh-CN"}
    last = None
    for attempt in range(5):
        try:
            r = requests.get(MYMEMORY, params=params, headers={"User-Agent": "Mozilla/5.0"}, timeout=35)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(8 + attempt * 8)
                last = f"HTTP {r.status_code}"
                continue
            r.raise_for_status()
            data = r.json()
            if data.get("quotaFinished"):
                raise RuntimeError("MyMemory quota finished")
            text = (data.get("responseData") or {}).get("translatedText") or ""
            text = htmlmod.unescape(text).strip()
            if not text or "MYMEMORY WARNING" in text.upper():
                raise RuntimeError(f"empty or warning translation: {text[:80]}")
            return text
        except Exception as e:
            last = e
            time.sleep(3 + attempt * 3)
    raise RuntimeError(f"MyMemory failed: {last}")


def translate_sentences(limit=None):
    all_items = load_all()
    cache = load_cache()
    todo = [q for q in all_items if not cache.get(q["id"], {}).get("translation")]
    if limit:
        todo = todo[:limit]
    print(f"sentences: {len(cache)} cached, {len(todo)} to do", flush=True)
    done = 0
    for q in todo:
        text = clean_ja(q.get("correct_sentence") or q.get("question"))
        if not text:
            print("SKIP empty sentence", q["id"], flush=True)
            continue
        try:
            zh = mymemory(text)
            entry = cache.setdefault(q["id"], {})
            entry["translation"] = zh
            done += 1
            print(f"[{done}/{len(todo)}] {q['id']} {zh[:60]}", flush=True)
        except Exception as e:
            print("FAIL sentence", q["id"], e, flush=True)
        if done and done % 10 == 0:
            save_cache(cache)
        time.sleep(2.0)
    save_cache(cache)
    missing = sum(1 for q in all_items if not cache.get(q["id"], {}).get("translation"))
    print("sentences complete; missing translation:", missing)


def translate_explanations(limit=None):
    all_items = load_all()
    cache = load_cache()
    todo = [q for q in all_items if not cache.get(q["id"], {}).get("explanation")]
    if limit:
        todo = todo[:limit]
    print(f"explanations: {len(cache)} cached, {len(todo)} to do", flush=True)
    done = 0
    for q in todo:
        try:
            data = request_json(TRANS, {"id": q["id"], "target": "zh-CN"})
            zh = (data.get("translation") or "").strip()
            if zh:
                entry = cache.setdefault(q["id"], {})
                entry["explanation"] = zh
                done += 1
                print(f"[{done}/{len(todo)}] {q['id']} {zh[:60]}", flush=True)
            else:
                print("EMPTY explanation", q["id"], flush=True)
        except Exception as e:
            print("FAIL explanation", q["id"], e, flush=True)
        if done and done % 10 == 0:
            save_cache(cache)
        time.sleep(0.8)
    save_cache(cache)
    missing = sum(1 for q in all_items if not cache.get(q["id"], {}).get("explanation"))
    print("explanations complete; missing explanation:", missing)


def translate_all(limit=None):
    translate_sentences(limit)
    translate_explanations(limit)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "collect"
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    if mode == "collect":
        collect_all()
    elif mode == "translate":
        translate_all(limit)
    elif mode == "translate-sentences":
        translate_sentences(limit)
    elif mode == "translate-explanations":
        translate_explanations(limit)
    else:
        raise SystemExit("usage: fetch_challenge.py collect|translate|translate-sentences|translate-explanations [limit]")
