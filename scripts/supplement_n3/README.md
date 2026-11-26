# 补充题库 · N3（非红蓝宝书）

本目录保存补充题库的原始资料、解析脚本与可选的中文辅助，最终数据写入
`src/data/supplement-n3.js`（独立数据模块，不并入 `questions.js`）。

## 收录规则

- 只收**明确标注 N3** 的练习题；未写级别的题目一律不采用。
- 不收历年真题（网站真题板块已单独覆盖）。
- 题目与选项全部来自公开网页，不使用站内自动生成题。
- 与红蓝宝书题库完全分开：单独数据文件、单独入口、单独答题统计。

## 题源

| 原始来源 | 数量 | 说明 |
| --- | --- | --- |
| Nihongo World「JLPT N3 語彙 練習問題」<br>https://nihongo-world.com/materials/stories/n3/vocab/ | 120 | 日语教师公开练习题，按 JLPT 問題1〜5 五种题型编排，页面标注 N3、非過去問 |
| Coto Academy「JLPT N3 Vocabulary Mock Test」<br>https://cotoacademy.com/jlpt-n3-vocabulary-mock-test-free-sample-questions/ | 30 | 东京 Coto 日语学校公开语汇模拟题，标题标注 N3 |
| Gogaku Education「JLPT N3 Grammar Mock Test Set 11」<br>https://gogakueducation.com/2026/10/17/jlpt-n3-grammar-mock-test-set-11/ | 13 | 日语学校公开 N3 文法模拟题第 11 回「問題1 文法形式」 |
| Let's Challenge JLPT「N3 Practice」<br>https://www.challenge-jlpt.com/n3-practice/ | 816 | 语汇 325 / 文法 241 / 汉字选择 250；公开 N3 四选一题，答案与日文解析来自原网页 |
| 資格ブートキャンプ「JLPT N3 WEB問題」<br>https://shikaku-bootcamp.com/shikaku/jlpt-n3/practice/ | 21 | 公开 N3 四选一混合题，附正解与日文解说；页面说明非过去问 |

外部精选 163 题 + Challenge JLPT 816 题 + 資格ブートキャンプ 21 题 = 合计 **1000 题**。

## 题包结构

与 N2 对齐，最终数据只生成两个题包，不按原题源或小题型拆分：

| 题包 | 内容 | 数量 |
| --- | --- | --- |
| `n3-vocab` | 文字・語彙（汉字、语汇、用法等） | 736 |
| `n3-grammar` | 文法 | 264 |

每个题包的 `parts` 只保留「全部题目」，页面不显示子题型筛选；题目仍保留
`sourceId` 便于回查原网页。

抓取日期：2026-11-26。

> 说明：Challenge JLPT 的 816 道题已通过 MyMemory 分批补齐句子中文译文；
> 解析优先使用原站中文翻译，未取到的题目保留日文原解析。`sb-extra-21` 已有中文译文与中文摘要。
> 所有题目均保留 `sourceId`，便于回查原网页。

## 文件

- `nihongo_n3_vocab.html` / `coto_n3_vocab.html` / `gogaku_n3_grammar.html`：原始网页存档
- `gogaku_grammar11.js`：Gogaku 第 11 回题目数据（站点 CBT 使用）
- `nihongo_raw.json` / `coto_raw.json` / `gogaku_raw.json`：结构化解析结果
- `zh_batch*.json` / `zh_coto.json` / `zh_gogaku.json`：中文译文与解析
- `parse_nihongo.py` / `parse_coto.py` / `parse_gogaku.py`：网页解析脚本
- `fetch_challenge.py`：分批抓取 Challenge JLPT 的 325 语汇、241 文法、250 汉字选择题；支持 `translate-sentences` 与 `translate-explanations` 分批补译文
- `challenge_raw.json`：Challenge JLPT 原始题目
- `challenge_translations.json`：句子中文译文与中文解析缓存（按条保存，中断可续跑）
- `fetch_shikaku.py`：抓取資格ブートキャンプ题库并生成 21 道补充题
- `shikaku_raw.json` / `shikaku_extra.json`：資格ブートキャンプ原始数据与补充题
- `build_supplement.py`：生成 163 道精选题目，合并网页题并写出最终数据模块
- `curated.json`：163 道外部精选题的中间数据
- `validate_data.py`：校验题目数量、选项、答案、解析与来源分组

## 重建

```powershell
python scripts/supplement_n3/parse_nihongo.py
python scripts/supplement_n3/parse_coto.py
python scripts/supplement_n3/parse_gogaku.py
python scripts/supplement_n3/fetch_challenge.py collect
python scripts/supplement_n3/fetch_challenge.py translate-sentences
python scripts/supplement_n3/fetch_challenge.py translate-explanations
python scripts/supplement_n3/fetch_shikaku.py
python scripts/supplement_n3/build_supplement.py
python scripts/supplement_n3/validate_data.py
```

`build_supplement.py` 会先写出 `curated.json`，再合并 `challenge_raw.json` 与
`shikaku_extra.json`，最终生成 `src/data/supplement-n3.js`。Challenge 的句子译文与
中文解析可分别用 `fetch_challenge.py translate-sentences` / `translate-explanations`
分批补；脚本每 10 条保存一次缓存，源站限流时可稍后重跑。

## 数据字段

`id / no / packId / level / type / part / partName / unit /
sentence / sentenceFurigana / options / answer / translation / explanation / sourceId / legacyKey`

`supplement.js` 会为每题补上 `key`；新题使用 `sup:N3:<packId>:<no>`，合并题保留原 7 题包的 `legacyKey`（如 `sup:N3:cj-vocab-325:12`），这样升级后旧答题进度仍能计入新题包。`useStore` 对 `sup:` 前缀只记答题状态，不写入 N5〜N1 的分级计数，避免污染红蓝宝书题库统计。

题包元数据中的 `origin` 取 `external` / `original`，用于数据追溯；当前 N3 题包全部为 `external`，页面按 `type` 归入語彙 / 文法分组。同时存在的 N2 题包使用同一字段。
