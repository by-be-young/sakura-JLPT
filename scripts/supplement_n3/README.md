# 补充题库 · N3（非红蓝宝书）

本目录保存补充题库的原始资料、解析脚本与中文译文，最终数据写入
`src/data/supplement-n3.js`（独立数据模块，不并入 `questions.js`）。

## 收录规则

- 只收**明确标注 N3** 的练习题；未写级别的题目一律不采用。
- 不收历年真题（网站真题板块已单独覆盖）。
- 与红蓝宝书题库完全分开：单独数据文件、单独入口、单独答题统计。

## 题源

| 题包 | 来源 | 数量 | 说明 |
| --- | --- | --- | --- |
| `nw-vocab-120` | Nihongo World「JLPT N3 語彙 練習問題」<br>https://nihongo-world.com/materials/stories/n3/vocab/ | 120 | 日语教师原创题，按 JLPT 問題1〜5 五种题型编排，官方页面明确标注 N3、并说明“非過去問” |
| `coto-vocab-30` | Coto Academy「JLPT N3 Vocabulary Mock Test」<br>https://cotoacademy.com/jlpt-n3-vocabulary-mock-test-free-sample-questions/ | 30 | 东京 Coto 日语学校自编语汇模拟题，标题明确标注 N3 |
| `gogaku-grammar-13` | Gogaku Education「JLPT N3 Grammar Mock Test Set 11」<br>https://gogakueducation.com/2026/10/17/jlpt-n3-grammar-mock-test-set-11/ | 13 | 日语学校 N3 文法模拟题第 11 回「問題1 文法形式」，标题与题头均标注 N3 |

合计 163 题。

抓取日期：2026-11-25。

## 文件

- `nihongo_n3_vocab.html` / `coto_n3_vocab.html` / `gogaku_n3_grammar.html`：原始网页存档
- `gogaku_grammar11.js`：Gogaku 第 11 回题目数据（站点 CBT 使用）
- `nihongo_raw.json` / `coto_raw.json` / `gogaku_raw.json`：结构化解析结果
- `zh_batch*.json` / `zh_coto.json` / `zh_gogaku.json`：中文译文与解析
- `parse_nihongo.py` / `parse_coto.py` / `parse_gogaku.py`：网页解析脚本
- `build_supplement.py`：生成 `src/data/supplement-n3.js`
- `validate_data.py`：校验题目数量、选项与答案

## 重建

```powershell
python scripts/supplement_n3/parse_nihongo.py
python scripts/supplement_n3/parse_coto.py
python scripts/supplement_n3/parse_gogaku.py
python scripts/supplement_n3/build_supplement.py
python scripts/supplement_n3/validate_data.py
```

## 数据字段

`id / no / packId / level / type / part / partName / unit /
sentence / sentenceFurigana / options / answer / translation / explanation`

`supplement.js` 会为每题补上 `key = sup:N3:<packId>:<no>`；`useStore` 对
`sup:` 前缀只记答题状态，不写入 N5〜N1 的分级计数，避免污染红蓝宝书题库统计。
