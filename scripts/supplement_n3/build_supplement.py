import re, json, os, html as htmlmod

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

out = """// 补充题库 · N3（非红蓝宝书题库，独立数据模块，请勿并入 questions.js）
// 数据来源：Nihongo World 原创练习题、Coto Academy 语汇模拟题、Gogaku Education 文法模拟题
// 全部题目均明确标注 N3；均为练习题/模拟题，不是历年真题。
// 由 scripts/supplement_n3/build_supplement.py 生成。

export const supplementPacks = """ + js(packs) + """

export const supplementN3Questions = """ + js(questions) + """
"""
path = r"D:\01-项目\日语自学网站\src\data\supplement-n3.js"
open(path, "w", encoding="utf-8").write(out)
print("written", path, len(questions), "questions")
