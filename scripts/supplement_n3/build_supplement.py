import re, json, os, html as htmlmod, subprocess, sys

D = r"D:\01-项目\日语自学网站\scripts\supplement_n3"
nihongo = json.load(open(os.path.join(D, "nihongo_raw.json"), encoding="utf-8"))
coto = json.load(open(os.path.join(D, "coto_raw.json"), encoding="utf-8"))
zh1 = json.load(open(os.path.join(D, "zh_batch1.json"), encoding="utf-8"))
zh2 = json.load(open(os.path.join(D, "zh_batch2.json"), encoding="utf-8"))
zh3 = json.load(open(os.path.join(D, "zh_batch3.json"), encoding="utf-8"))
zhc = json.load(open(os.path.join(D, "zh_coto.json"), encoding="utf-8"))
gogaku = json.load(open(os.path.join(D, "gogaku_raw.json"), encoding="utf-8"))
zhg = json.load(open(os.path.join(D, "zh_gogaku.json"), encoding="utf-8"))
ZH = {**zh1, **zh2, **zh3}

SECTION_META = {
    "問題1": {"name": "漢字読み", "type": "文字"},
    "問題2": {"name": "表記", "type": "文字"},
    "問題3": {"name": "文脈規定", "type": "語彙"},
    "問題4": {"name": "言い換え類義", "type": "語彙"},
    "問題5": {"name": "用法", "type": "語彙"},
}

def norm_blank(s):
    s = s.replace("（　　）", "（　　）").replace("（）", "（　　）")
    return s

WORD_MEANING = {
    "編む": "编织", "はんこ": "印章", "メモ": "笔记、记录", "戻す": "放回原处",
    "スイッチ": "开关", "焦る": "焦急", "あわてる": "慌张", "面接": "面试",
    "飲み会": "酒会", "書き直す": "重写", "抜ける": "脱落、缺失", "押さえる": "按住",
    "外す": "取下", "刺さる": "扎入", "切れる": "断", "跳ねる": "弹跳",
    "破れる": "破损", "指す": "指向", "広げる": "摊开", "網": "网",
}

questions = []
for i, q in enumerate(nihongo, 1):
    sec = q["section"]
    meta = SECTION_META[sec]
    zh = ZH.get(q["qid"])
    if not zh:
        raise SystemExit("missing zh for " + q["qid"])
    sentence = norm_blank(q["stem"])
    if sec in ("問題1", "問題2") and "<u>" not in q["stem_html"]:
        raise SystemExit("no underline " + q["qid"])
    if sec == "問題5":
        word = q["stem"].strip()
        sentence = f"「<u>{word}</u>」の使い方として最もよいものを、一つえらびなさい。"
        translation = f"选出「{word}」（{WORD_MEANING.get(word, '')}）用法正确的句子。"
    else:
        translation = zh["t"]
    questions.append({
        "id": i,
        "no": i,
        "packId": "nw-vocab-120",
        "level": "N3",
        "type": meta["type"],
        "part": int(sec.replace("問題", "")),
        "partName": f"{sec} {meta['name']}",
        "unit": int(sec.replace("問題", "")),
        "sentence": sentence,
        "sentenceFurigana": norm_blank(q["stem_html"]) if sec != "問題5" else "",
        "options": q["options"],
        "answer": q["answer"],
        "translation": translation,
        "explanation": zh["e"],
    })

for q in coto:
    zh = zhc.get(str(q["no"]))
    if not zh:
        raise SystemExit("missing coto zh " + str(q["no"]))
    stem = q["stem"].replace("_______", "（　　）").strip()
    stem = re.sub(r"\s*（　　）\s*", "（　　）", stem)
    stem = stem.replace("（　　）。", "（　　）。")
    questions.append({
        "id": 200 + q["no"],
        "no": q["no"],
        "packId": "coto-vocab-30",
        "level": "N3",
        "type": "語彙",
        "part": 1,
        "partName": "語彙・文脈",
        "unit": 1,
        "sentence": stem,
        "options": q["options"],
        "answer": q["answer"],
        "translation": zh["t"],
        "explanation": zh["e"],
    })

def strip_ruby(s):
    s = re.sub(r"<rt>[\s\S]*?</rt>", "", s)
    s = re.sub(r"<rp>[\s\S]*?</rp>", "", s)
    s = re.sub(r"<[^>]+>", "", s)
    return htmlmod.unescape(s).strip()

# 文法题（Gogaku 第11回 問題1）
for idx, q in enumerate(gogaku, 1):
    zh = zhg.get(str(idx))
    if not zh:
        raise SystemExit("missing gogaku zh " + str(idx))
    sentence = strip_ruby(q["p"])
    sentence = sentence.replace("（ ）", "（　　）").replace("（　）", "（　　）").replace("()", "（　　）")
    frame = q["p"].replace("<br>", "<br>").replace("（ ）", "（　　）").replace("（　）", "（　　）")
    questions.append({
        "id": 300 + idx,
        "no": idx,
        "packId": "gogaku-grammar-13",
        "level": "N3",
        "type": "文法",
        "part": 1,
        "partName": "文法・文法形式",
        "unit": 1,
        "sentence": sentence,
        "sentenceFurigana": frame,
        "options": [strip_ruby(o) for o in q["o"]],
        "answer": q["a"] + 1,
        "translation": zh["t"],
        "explanation": zh["e"],
    })

packs = [
    {
        "id": "nw-vocab-120",
        "level": "N3",
        "title": "N3 文字・語彙 120 题",
        "shortTitle": "文字・語彙 120",
        "type": "文字・語彙",
        "provider": "Nihongo World",
        "providerNote": "日语教师原创练习题，按 JLPT 五种题型编排，非真题",
        "url": "https://nihongo-world.com/materials/stories/n3/vocab/",
        "count": 120,
        "parts": [
            {"no": 1, "name": "問題1 漢字読み", "count": 24},
            {"no": 2, "name": "問題2 表記", "count": 20},
            {"no": 3, "name": "問題3 文脈規定", "count": 32},
            {"no": 4, "name": "問題4 言い換え類義", "count": 24},
            {"no": 5, "name": "問題5 用法", "count": 20},
        ],
    },
    {
        "id": "coto-vocab-30",
        "level": "N3",
        "title": "N3 语汇模拟 30 题",
        "shortTitle": "语汇模拟 30",
        "type": "語彙",
        "provider": "Coto Academy",
        "providerNote": "东京 Coto 日语学校自编语汇模拟题，非真题",
        "url": "https://cotoacademy.com/jlpt-n3-vocabulary-mock-test-free-sample-questions/",
        "count": 30,
        "parts": [{"no": 1, "name": "語彙・文脈規定", "count": 30}],
    },
    {
        "id": "gogaku-grammar-13",
        "level": "N3",
        "title": "N3 文法模拟 13 题",
        "shortTitle": "文法模拟 13",
        "type": "文法",
        "provider": "Gogaku Education",
        "providerNote": "日语学校 N3 文法模拟题第 11 回「問題1 文法形式」，非真题",
        "url": "https://gogakueducation.com/2026/10/17/jlpt-n3-grammar-mock-test-set-11/",
        "count": 13,
        "parts": [{"no": 1, "name": "問題1 文法形式", "count": 13}],
    },
]

def js(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2)

curated = {"packs": packs, "questions": questions}
for pack in packs:
    pack["origin"] = "external"
curated_path = os.path.join(D, "curated.json")
open(curated_path, "w", encoding="utf-8").write(js(curated))
print("written", curated_path, len(questions), "curated questions")

# 追加网页题库：Challenge JLPT（四选一）与資格ブートキャンプ（补充 21 题）
challenge = json.load(open(os.path.join(D, "challenge_raw.json"), encoding="utf-8"))
challenge_zh = json.load(open(os.path.join(D, "challenge_translations.json"), encoding="utf-8")) if os.path.exists(os.path.join(D, "challenge_translations.json")) else {}
shikaku_extra = json.load(open(os.path.join(D, "shikaku_extra.json"), encoding="utf-8"))

CHALLENGE_META = {
    "vocabulary": ("cj-vocab-325", "N3 网页语汇 325 题", "网页语汇 325", "語彙", "語彙・文脈"),
    "grammar": ("cj-grammar-241", "N3 网页文法 241 题", "网页文法 241", "文法", "文法・文法形式"),
    "kanji_choice": ("cj-kanji-250", "N3 网页汉字选择 250 题", "网页汉字 250", "文字", "漢字選択"),
}

def clean_question(s):
    s = (s or "").replace("\n", "<br>")
    s = re.sub(r"<span[^>]*class=\"kanji\"[^>]*>(.*?)</span>", r"<u>\1</u>", s)
    s = re.sub(r"（\s*）", "（　　）", s)
    s = s.replace("<br><br>", "<br>")
    return s.strip()

web_packs = []
web_qs = []
for kind, (pid, title, short, typ, part_name) in CHALLENGE_META.items():
    items = challenge[kind]
    for idx, q in enumerate(items, 1):
        zh = challenge_zh.get(q["id"], {})
        sentence = clean_question(q.get("question", ""))
        if kind == "kanji_choice" and q.get("instruction"):
            sentence = clean_question(q["instruction"] + "<br>" + q.get("question", ""))
        web_qs.append({
            "id": 5000 + len(web_qs) + 1,
            "no": idx,
            "packId": pid,
            "level": "N3",
            "type": typ,
            "part": 1,
            "partName": part_name,
            "unit": 1,
            "sentence": sentence,
            "sentenceFurigana": sentence,
            "options": q.get("choices") or [],
            "answer": (q.get("answer_index") or 0) + 1,
            "translation": zh.get("translation", ""),
            "explanation": zh.get("explanation") or q.get("explanation_ja", ""),
            "sourceId": q.get("id", ""),
        })
    web_packs.append({
        "id": pid,
        "level": "N3",
        "title": title,
        "shortTitle": short,
        "type": typ,
        "origin": "external",
        "provider": "Let's Challenge JLPT",
        "providerNote": "公开 N3 免费练习题，四选一，答案与日文解析来自原网页，非历年真题；中文译文由 MyMemory 分批生成，解析优先使用站点中文翻译",
        "url": "https://www.challenge-jlpt.com/n3-practice/",
        "count": len(items),
        "parts": [{"no": 1, "name": part_name, "count": len(items)}],
    })

web_packs.extend(shikaku_extra["packs"])
web_qs.extend(shikaku_extra["questions"])
packs.extend(web_packs)
questions.extend(web_qs)
print("added web questions", len(web_qs), "total", len(questions))

# 写入最终模块
final = (
    "// N3 补充题库：163 道外部精选 + 816 道 Challenge JLPT 网页题 + 21 道資格ブートキャンプ补充题。\n"
    "// 题目与选项均来自公开网页；不使用站内自动生成题。\n"
    "// 网页题句子中文译文已补齐；解析优先使用原站中文翻译，缺失时保留日文原解析。\n"
    "export const supplementPacks = " + js(packs) + ";\n\n"
    "export const supplementN3Questions = " + js(questions) + ";\n"
)
project_root = os.path.dirname(os.path.dirname(D))
out_path = os.path.join(project_root, "src", "data", "supplement-n3.js")
open(out_path, "w", encoding="utf-8").write(final)
print("written", out_path, len(questions), "questions")