# 听解数据录入统一规格（N1 unit2-15 / N5 全本 / N4 全本）

本文件是所有听解录入分片的**唯一格式基准**。开工前必须完整阅读本文件，并阅读「必读参考文件」中的现有数据文件，逐字段模仿其写法。

## 0. 总原则

- 纯录入任务：把书上的题目/词汇/知识如实转写进网站数据。**不得**自行编造题目、答案、词汇释义或知识内容；书上没有的内容就留空/省略。
- 答案一律以书**付録（附录）正解**为准。OCR/图像识别对浊音点、长音、促音经常误读，凡涉及答案（假名、汉字、○/×、选项序号）必须与付録核对后再落盘。
- 本网站只收题目/词汇/知识，**不制作音频**（音频靠教材二维码扫码播放）。
- **Furi 规则**：所有 `*Furi` 字段（`furi/textFuri/scriptFuri/answerFuri/kanjiFuri/wFuri/leFuri/reFuri/lFuri/rFuri/patternFuri/jpFuri/plainFuri/tFuri` 等）一律写 `""`（空字符串），**不要**手工编造 ruby，**不要**运行任何 gen_furi 脚本。前端对空 Furi 有回退（`jp()` 无 furi 时显示原文），空值安全。
- 只允许改动你自己分片名下的文件（见「分片范围」）。**禁止**修改：`src/data/listening-n1/index.js`、`src/data/listening-n1/unit1/*`、`src/data/listening/*`（N2 全部）、`src/` 下任何 `.vue`/`store` 文件、`package.json` 等。顶层 index.js 与前端接入由主控统一在数据齐备后完成。

## 1. 必读参考文件（先读再写，逐字段模仿）

- 本规格文件 `scripts/_listen_spec.md`
- `src/data/listening-n1/unit1/index.js`、`words.js`、`questions.js`、`knowledge.js` —— N1 基础编格式蓝本（本片若含基础编单元必读）
- `src/data/listening/unit1/index.js`、`questions.js` —— N2 基础编（含 `kana` 题型与 `example` 例题字段）
- 若分片含攻略编：`src/data/listening/unit9/questions.js`、`index.js`、`words.js`、`knowledge.js`（攻略编无词汇时 groups=[]）、`unit13/questions.js`（統合理解双问格式）
- 若分片含实践编：`src/data/listening/unit14/questions.js`（実践編题项：text/script 多为空串，仅选项+答案）

## 2. 分片范围与单元编号

### N1（书：`C:\Users\34166\Desktop\绿宝书 新日本语能力考试 听力\绿宝书 新日本语能力考试 n1 听解(详解+练习) (许小明).pdf`，262 页，有文本层）
书页→PDF 页：正文段 PDF≈书页+8，付録段 PDF≈书页+7，**以页脚印刷数字为准**。例如 unit2 書p.10 = PDF 18（0 基索引 17）。
- 基础编单元结构（unit1 已验证）：每个单元 5 个大题 section（select 听音选词 10 题 / phrase 补短语 10 题 / word 补句子 10 题 / conv 会话填空 10 空 / judge 正误 10 题），题号连续；另含「聴いてみよう」词汇组与「聴解の基礎知識」知识部分。各单元以书为准，若有出入按书转写。

| 片 | 单元目录 | id | 题号 | 书页 | 付録答案 |
|---|---|---|---|---|---|
| N1-A | unit2 学校生活2 | 2 | 問題51-100 | 書p.10-18 (PDF 18-26) | 付録 Part1 正解&スクリプト 書p.242+ (PDF 249+) |
| N1-A | unit3 会社1 | 3 | 101-150 | 書p.19-26 (PDF 27-34) | 同上 |
| N1-A | unit4 会社2 | 4 | 151-200 | 書p.27-38 (PDF 35-46) | 同上 |
| N1-B | unit5 文化・教養 | 5 | 201-250 | 書p.39-51 (PDF 47-59) | 同上 |
| N1-B | unit6 社会一般 | 6 | 251-300 | 書p.52-62 (PDF 60-70) | 同上 |
| N1-B | unit7 日常生活 | 7 | 301-350 | 書p.63-73 (PDF 71-81) | 同上 |
| N1-B | unit8 自然・環境 | 8 | 351-400 | 書p.74-86 (PDF 82-94) | 同上 |
| N1-C | unit9 攻略編U1 課題理解 | 9 | 例題401-405+実践406-420 | 書p.87-92+93-115 (PDF 95-123) | 付録各题正解 |
| N1-C | unit10 攻略編U2 ポイント理解 | 10 | 例題421-425+実践426-440 | 書p.116-121+122-145 (PDF 124-153) | 同上 |
| N1-C | unit11 攻略編U3 概要理解 | 11 | 例題441-445+実践446-460 | 書p.146-149+150-167 (PDF 154-175) | 同上 |
| N1-D | unit12 攻略編U4 即時応答 | 12 | 例題461-470+実践471-525 | 書p.168-174+175-213 (PDF 176-221) | 同上 |
| N1-D | unit13 攻略編U5 統合理解 | 13 | 例題526-528+実践529-532 | 書p.214-220+221-229 (PDF 222-237) | 同上 |
| N1-D | unit14 実践編 第1回 | 14 | 1-34 | 書p.230-235 (PDF 238-243) | Part3 正解 書p.255 (PDF 262) |
| N1-D | unit15 実践編 第2回 | 15 | 1-34 | 書p.236-241 (PDF 244-249) | 同上 |

攻略编结构（照抄 N2 unit9 做法）：sections = 「例題解説 問題XXX～XXX」+「実践練習 その1/その2/…」；每题含 text(场景+提问)、options(4 个)、answer("1"-"4")、script(听力原文，付録有则录)、vocab(生词)、analysis(精讲，例题书上有解説则录，実践书付録无精讲可不录/空数组)。実践编：每题 n、audio、options、answer；text/script 留空串（录音中播放），付録正解为答案。

### N5/N4（书：`C:\Users\34166\Desktop\绿宝书 新日本语能力考试 听力\绿宝书 新日本语能力考试N5、N4听解 (Pdg2Pic, 许小明).pdf`，315 页，**无文本层**，纯扫描）
PDF 第 1 页=封面、第 2 页=封底。书页→PDF 页偏移**自行从页脚确定**（读几个关键页的页脚印刷数字反推；建议先读 N5 基础编 Unit1 書p.4 与 N5 附录答案書p.267 所在 PDF 页，求出两个偏移是否一致——正文与付録偏移可能不同）。

N5 结构（書 p.4-133 正文，付録 書p.267+）：
| 片 | 单元 | id | 题号 | 书页 | 内容 |
|---|---|---|---|---|---|
| N5-A | unit1 生活 | 1 | 练习1-50 | 書p.4-8 | 词汇+表达讲解+练习 |
| N5-A | unit2 时间 | 2 | 51-100 | 書p.9-13 | 同上 |
| N5-A | unit3 数量 | 3 | 101-150 | 書p.14-18 | 同上 |
| N5-A | unit4 人物 | 4 | 151-200 | 書p.19-23 | 同上 |
| N5-A | unit5 学校 | 5 | 201-250 | 書p.24-28 | 同上 |
| N5-A | unit6 场所 | 6 | 251-300 | 書p.29-35 | 同上 |
| N5-B | unit7 攻略U1 課題理解 | 7 | 例題1-5+実践6-15 | 書p.36-52 | 例题+実践 |
| N5-B | unit8 攻略U2 要点理解 | 8 | 16-20+21-30 | 書p.53-67 | 同上 |
| N5-B | unit9 攻略U3 发话表达 | 9 | 31-35+36-55 | 書p.68-90 | 同上 |
| N5-B | unit10 攻略U4 即时应答 | 10 | 56-60+61-82 | 書p.91-109 | 同上 |
| N5-B | unit11 実践編 第1回 | 11 | 1-24 | 書p.110-120 | 模拟试题 |
| N5-B | unit12 実践編 第2回 | 12 | 1-24 | 書p.121-133 | 同上 |

N4 结构（書 p.134-266 正文，付録2 書p.286+）：
| 片 | 单元 | id | 题号 | 书页 | 内容 |
|---|---|---|---|---|---|
| N4-A | unit1 日常生活 | 1 | 练习1-50 | 書p.134-139 | 词汇+表达讲解+练习 |
| N4-A | unit2 校园、职场 | 2 | 51-100 | 書p.140-145 | 同上 |
| N4-A | unit3 动作行为1 | 3 | 101-150 | 書p.146-151 | 同上 |
| N4-A | unit4 动作行为2 | 4 | 151-200 | 書p.152-156 | 同上 |
| N4-A | unit5 状态描述 | 5 | 201-250 | 書p.157-162 | 同上 |
| N4-A | unit6 状态、程度描述 | 6 | 251-300 | 書p.163-170 | 同上 |
| N4-B | unit7 攻略U1 課題理解 | 7 | 1-5+6-15 | 書p.171-188 | 例题+実践 |
| N4-B | unit8 攻略U2 要点理解 | 8 | 16-20+21-30 | 書p.189-202 | 同上 |
| N4-B | unit9 攻略U3 发话表达 | 9 | 31-35+36-55 | 書p.203-226 | 同上 |
| N4-B | unit10 攻略U4 即时应答 | 10 | 56-60+61-84 | 書p.227-247 | 同上 |
| N4-B | unit11 実践編 第1回 | 11 | 1-28 | 書p.248-257 | 模拟试题 |
| N4-B | unit12 実践編 第2回 | 12 | 1-28 | 書p.258-266 | 同上 |

N5/N4 基础篇单元组成：词汇组（如「生活相关词汇」，每单元 3-4 组，含音频）+ 表达/句型讲解（knowledge，如「疑问的表达」）+ 练习题 50 题（题型照书：多为选择/填空/会话填空/正误，映射到现有 section type）。题号书内连续（Unit1 练习1-50，Unit2 51-100…）。攻略篇题目编号全书连续（如 N5 攻略篇 1-82、N4 1-84），跨单元连续，按上表。実践篇每回从 1 重新编号。
N5/N4 答案与听力原文在附录（N5 附录答案書p.267+；N4 附录2 書p.286+ 含 Part1 答案及听力原文、Part3 答案書p.305 附近）。实做时以书为准定位。

## 3. 每个单元 4 个文件（放 `src/data/listening-n1|n5|n4/unitN/`）

### 3.1 index.js
```js
// 听解 Unit2 学校生活2 · 单元索引
import words from './words.js'
import questions from './questions.js'
import knowledge from './knowledge.js'

export default {
  id: 2,
  title: '学校生活2',
  theme: '聴いてみよう＜学校生活に関する語彙2＞',   // 基础编=聴いてみよう标题；攻略/実践编用书内主题或音频范围
  questionsRange: '問題51-100',
  knowledgeTitle: '聴解の基礎知識2＜…＞',           // 攻略编可写「試験対策」等书内标题
  words, questions, knowledge,
}
```
id 必须与目录 unitN 的 N 一致；标题照书（基础编中文标题如「学校生活2」，攻略编「攻略編 Unit1 課題理解」、実践编「実践編 第1回」）。

### 3.2 words.js（攻略编/実践编无词汇 → `"groups": []`）
```js
export default {
  "groups": [
    {
      "group": 1,
      "title": "核心词汇1",          // 书上每组的小标题；含「重要短语」字样的组名照书保留（前端会据此显示「表現のまとめ」）
      "audio": "2-1",                // 照抄书上印刷的音频编号（耳机/二维码旁）；书未印则按单元内顺序 组1=单元号-1 … 
      "qrPage": 17,                  // 见 §6 二维码
      "list": [
        { "w": "アプローチ", "m": "探讨；接近", "kana": "アプローチ", "furi": "" }
      ]
    }
  ]
}
```
词汇照书转写：w=词/短语、m=中文释义（书上有中文译文照抄）、kana=读音（假名）、furi=""。

### 3.3 questions.js（题目板块）
```js
export default {
  "title": "問題51-100",            // 可选，与书对应；攻略编可写「問題401-420」
  "audio": "2-5～2-9",              // 可选，本单元音频总范围
  "qrPage": 19,                     // 可选，本单元题目默认二维码页（大题无独立页时兜底）
  "sections": [ ... ]
}
```
section 通用字段：`section`(从1递增的大题号)、`type`、`audio`(照抄书印编号)、`qrPage`(该大题二维码所在 PDF 0 基索引页；与 section 共享同一二维码时填同一页号；无独立二维码可填 0 或省略但推荐填实际页)、`title`(书上的题型说明，中文)。

**type 与 item 结构（与前端渲染一一对应，必须精确）：**
- `select`（听音选词/选择）：`items:[{n, text, options:[...], answer, script?, textFuri:"", scriptFuri:"", vocab?:[{w,m,wFuri:""}], analysis?:[{t,tFuri:""}]}]`
  - 2 个选项 answer 用 `"a"/"b"`（对应选项序），4 个选项用 `"1"/"2"/"3"/"4"`；**answer 值必须是选项序号键，不是选项文本**（judge 例外，见下）。
  - 双问（統合理解）：`{n, text, questions:[{q:"質問1", options:[...], answer:"1"}, {q:"質問2", options:[...], answer:"2"}], script, vocab, analysis}`
- `judge`（正误）：`items:[{n, text, options:["○","×"], answer:"○"|"×", script?, textFuri:"", scriptFuri:""}]` —— answer 直接用 ○ 或 × 符号本身。
- `kana`（用假名补全，并写汉字）：section 可带 `example:{text, kanji}`；`items:[{n, sub?:"a"/"b", text, answer(假名), kanji?(对应汉字), textFuri:"", answerFuri:""}]`。书問題 2 有 a/b 两小问时拆成两个 item：同 n、sub 分别为 "a"/"b"。
- `phrase`（补短语）：`items:[{n, text, answer, textFuri:"", answerFuri:"", scriptFuri:""}]`（不写 script，书付録不给原文就不给；unit1 的 phrase 无 script 字段）。
- `word`（补句子）：`parts:[{name, items:[{n, text, answer, kana?, textFuri:"", answerFuri:""}]}]`。answer 有多个空时用「、」连接（如 `"論文、テーマ"`）。
- `keigo`（发话表达/敬语）：`items:[{n, text, textFuri:"", answers:[{answer, answerFuri:"", plain, plainFuri:""}]}]`（answer=敬语形，plain=普通形）。
- `conv`（会话填空）：`convs:[{name:"会話1", lines:[{who:"学生"/"先生"/…, text(含数字序号与＿＿＿＿), textFuri:""}], answers:[{n, answer, answerFuri:""}]}]`。会话行内的空以 `31) ＿＿＿＿` 形式标注（号码照书），answers 的 n 对应号码。
- 実践编（模拟测试）：用 `select` type，`items:[{n, sub:"", audio, text:"", options:[...], answer:"1"-"4", questions:null, textFuri:"", script:"", scriptFuri:"", vocab:[], analysis:[]}]`（照 N2 unit14 的样式，text/script 留空串，仅选项+答案，答案=付録正解）。
- 题目 audio：照抄书印编号（如 `"2-2"`、`"2-137～2-139"`）；书未印则按顺序合理编号。

题号规则：基础编照书问题号（51-100 等），a/b 小问同 n 加 sub；攻略编/実践编按书问题号连续编号（字符串或数字均可，照参考文件用字符串如 "401" 或数字均可，但**与参考文件风格一致**：N2 攻略/実践用字符串，N1 unit1 基础编用数字）。

### 3.4 knowledge.js（补充知识）
```js
export default {
  "title": "音声の特徴",
  "audio": "2-10～2-14",
  "qrPages": [21],                    // 二维码所在 PDF 0 基索引页数组
  "intro": "……（书上的引导说明，中文）",
  "parts": [
    {
      "heading": "1. 長音と短音",
      "audio": "2-10",
      "kind": "table",
      "head": ["短音","词","長音","词"],          // head 长度≥5 时自动启用 c 分类列（l/le/r/re 前加 c）
      "pairs": [
        {"c":"","l":"いどう","le":"異動","r":"いど","re":"緯度","lFuri":"","leFuri":"","rFuri":"","reFuri":""}
      ]
    },
    {
      "heading": "2. ～てください",
      "kind": "card",                 // 表现/句型卡片
      "items": [
        {"no":"①","pattern":"～てください","patternFuri":"","meaning":"请……","desc":"……","lines":[{"who":"","jp":"……","jpFuri":"","cn":"……"}]}
      ]
    }
  ]
}
```
- kind=`table`：对比表（pairs 用 l/le/r/re）；kind=`card`：句型卡片（items 用 no/pattern/meaning/desc/lines）。
- 书上的知识板块有什么就录什么：N1 基础编是「聴解の基礎知識」（音声对比表等），N5/N4 基础篇是「表达/句型讲解」（疑问的表达、时间表达等，多为卡片式），攻略编是「試験対策」（出题形式表等），実践编如书有「构成正解」等也照录。

## 4. OCR 转写流程

- **N1（有文本层）**：先用 `python scripts/_pdf_text.py "<PDF路径>" 起始页 结束页` 或直接写 pypdf 脚本批量提取题目页文本加速；**再**用 Read 工具按页读 PDF 图像核对关键内容（尤其是浊音/长音、汉字写法、付録正解）。文本层可能有错字/乱序，必须以图像为准。
- **N5/N4（无文本层）**：直接用 Read 工具按页读 PDF（一次 ≤20 页，返回整页图像），逐页转写。页脚数字确认书页↔PDF页偏移。
- 付録正解页必须逐题核对 answer 后再写文件。

## 5. 验证要求（交付前必须全部通过）

1. **JS 可解析**：写 python 脚本，对每个新 js 文件：去掉 `import` 行与 `//` 注释、去掉 `export default`、去尾随逗号后用 `json.loads` 解析，全部通过。
2. **题数与书一致**：
   - N1：unit2-8 每单元 50 题（items 总数 + conv 的 answers 总数 + word 的 parts items 总数 = 50，kana a/b 拆题算 2）；unit9/10/11=20、unit12=65、unit13=7、unit14/15=34。
   - N5：unit1-6 各 50；unit7=15、unit8=15、unit9=25、unit10=27；unit11/12 各 24。
   - N4：unit1-6 各 50；unit7=15、unit8=15、unit9=25、unit10=29；unit11/12 各 28。
3. **答案与付録一致**：抽查每单元至少 10 题（select/judge 逐题、填空类逐题）与付録正解比对一致；`unitSummary` 口径下 conv 每题计入 answers 条数。
4. 汇报中列出：每单元实际录入题数、单词数、知识条数。

## 6. 二维码工作流（每个词汇组/题目 section/知识部分所在书页都有音频二维码）

1. 定位：二维码在书页右上角耳机图标旁。用 python（fitz 已装）渲染目标页：`import fitz; doc=fitz.open(路径); pix=doc[页0基索引].get_pixmap(matrix=fitz.Matrix(6,6))`。
2. 检测：`cv2.QRCodeDetector().detectAndDecode(img)` 全页检测；失败时限定右上区域（`img[int(h*0.02):int(h*0.32), int(w*0.5):w]`）再检测。
3. 裁剪：按检测到的 4 角点 min/max 取包围框，向外扩 22% 作 padding，裁成正方形（白底补齐）。
4. 保存：**`qr_p{qrPage}.png`，其中 `qrPage` = 0 基索引页号（即 `doc[qrPage]` 就是这一页）**。
   - N1 → `src/assets/listening-n1/qr_p{N}.png`（目录已存在；unit1 已有 qr_p9/11/13，新页号不会冲突）
   - N5 → `src/assets/listening-n5/qr_p{N}.png`（新建目录）
   - N4 → `src/assets/listening-n4/qr_p{N}.png`（新建目录）
5. 解码验证：对保存的图再 `detectAndDecode`，解不出则放大 3 倍（LANCZOS）再解；仍解不出视为失败，重裁。
6. 数据里所有引用该二维码的 `qrPage` 字段写同一个页号（如一个单元词汇组 1-4 组共用词汇页二维码，就都填那页页号；参考 unit1 全部填 9）。
7. 参考脚本：`scripts/crop_qr_n1_unit1.py`（N1 页式）、`scripts/crop_qr_tight.py`（通用）。目录用项目真实路径 `D:\01-项目\日语自学网站\src\assets\...`。

## 7. 交付与报告

完成后在最终汇报中给出（结构化）：
1. 本片单元清单：每单元 id/title/题数/词汇组数/知识条数/qrPage 清单；
2. 生成的文件绝对路径清单（unitN 四个 js + 二维码 png）；
3. 验证结果：JS 解析通过数、题数核对表、答案抽查结论；
4. 遇到的疑难（如书页与提示不符、某页扫不清、付録缺失等）如实列出，不得隐瞒。

## 8. 红线

- 不改动任何现有文件（参考文件、unit1、N2 全部、前端、store、顶层 index.js）。
- 不编造答案/释义/知识；不确定时以书图像为准，仍不确定在报告中注明。
- Furi 一律空串；不运行 furi 脚本。
- 每题答案必须来自付録正解（基础编/攻略编/実践编各自对照相应附录）。
