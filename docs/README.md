# 樱花日语 · 项目文档

面向 N5–N1 的日语自学应用（Vue 3 + Vite，纯前端 + 可选 Supabase 云同步），同一套源码打包为 **Windows 桌面版（Electron）**、**Android（Capacitor）** 与 **iOS（PWA）** 三端。

> 打包、签名、GitHub Releases 发布与 Supabase 建表的详细步骤见仓库根目录 [`README.md`](../README.md)（那份文档是"发布与运维手册"，本文档是"产品与技术说明"）。

---

## 一、文档索引

| 文档 | 内容 | 适合谁读 |
| --- | --- | --- |
| [SRS.md](./SRS.md) | 需求规格说明书：角色、功能需求（FR）、非功能需求（NFR）、界面与数据需求、验收标准、变更记录 | 产品 / 开发 / 验收 |
| [业务对象清单.md](./业务对象清单.md) | 业务对象与数据字典：静态内容对象、用户状态对象、云端对象、字段级说明、关系与不变量 | 开发 / 数据 |
| [用户故事.md](./用户故事.md) | 按 Epic 拆分的用户故事与验收标准（Given/When/Then），含优先级与迭代记录 | 产品 / 测试 |
| [README.md](./README.md) | 本文档：项目概览、快速开始、目录结构、功能地图、移动端排版约定 | 所有新加入的人 |
| [../README.md](../README.md) | 多平台打包与更新指南、Supabase 配置与 RLS 建表 SQL | 发布 / 运维 |

---

## 二、快速开始

```bash
npm install
npm run dev          # 本地开发（Vite，默认 http://localhost:5173）
npm run build:web    # 生产构建（同步版本号 + 校验 Supabase 密钥）
npm run build:win    # Windows 安装包（NSIS，输出到 release/）
npm run build:android# Android debug APK
```

- 版本号唯一来源是 `package.json` 的 `version`，构建时自动写入 `public/version.json`。
- 不填 Supabase 配置时应用进入**纯本地模式**：全部功能可用（除账号、云同步、反馈、反馈管理）。
- 语法糖：`$router` 使用 hash 路由（`#/study/n3`），可直接用于本地静态托管。

### 数据规模（由 `src/data/*` 实算）

| 模块 | 数据源 | 规模 |
| --- | --- | --- |
| 背词 | `src/data/words.js` | 7 200 词 |
| 文法 | `src/data/grammar.js` | 26 单元 / 801 文法点 |
| 题库 | `questions-n2.js` / `questions-n3.js` | 2 000 题 + 10 回模拟卷（每级 5 回） |
| 读解 | `reading-n1.js` / `reading-n2.js` | 276 篇 |
| 听解 | `listening/index.js`、`listening-n1/-n4/-n5` | 54 单元；词汇 3 967 条、题目 2 148 题、知识卡 1 142 条 |

按等级的内容覆盖情况（"—" 表示该等级暂无此模块数据，入口显示"待补充"）：

| 等级 | 背词 | 文法（单元 / 点） | 题库 | 模拟 | 读解 | 听解（单元） |
| --- | --- | --- | --- | --- | --- | --- |
| N5 | 617 | 10 / 121 | — | — | — | 12 |
| N4 | 694 | 11 / 166 | — | — | — | 12 |
| N3 | 1 980 | 2 / 216 | 1 000 | 5 回 | — | — |
| N2 | 1 921 | 2 / 198 | 1 000 | 5 回 | 138 篇 | 15 |
| N1 | 1 988 | 1 / 210 | — | — | 138 篇 | 15 |

> 读解与听解的 `id` 只在**当前等级内**唯一（各等级都从 1 开始编号），页面按全局等级路由到对应的数据集。

---

## 三、目录结构（关键部分）

```
src/
  App.vue                  壳：顶部导航 / 底部 Dock / 路由过渡 / 花瓣背景 / 滚动进度
  router/index.js          全部路由（17 个页面 + 3 条兼容重定向，见下表）
  views/                   页面组件（Home / Learn / Quiz / GrammarReader / ReadingView ...）
  components/              共享组件（QuestionCard / QuestionPicker / AuthModal / FeedbackModal ...）
  components/word/         背词专用组件（WordCard / WordQuiz / OptionsList / WordNoteModal）
  composables/             组合式逻辑（认证、云同步、更新检查、振假名、题型生成、动效）
  store/                   本地状态（题库 / 背词 / 文法 / 每日打卡 / 等级 / 主题）
  data/                    静态内容（词库、文法、题库、读解、听解、封面 SVG）
  styles/main.css          设计令牌 + 全局样式（含全部断点）
electron/                  主进程（窗口、electron-updater）
android/                   Capacitor 工程
public/                    manifest / sw.js / version.json / update-config.js / 图标
scripts/                   构建与数据生成脚本（图标、版本号、密钥校验、数据解析）
```

### 路由表

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | Home | 今日目标环、连续打卡、近 7 天、学习与练习入口 |
| `/learn` | Learn | 练习中心：题库 / 模拟 / 读解 / 听解 |
| `/quiz/:mode` | Quiz | `sequential` / `random` / `unit` / `mock` / `wrong` / `favorites` |
| `/units` | UnitSelect | 按单元起练（单元模式） |
| `/words` | WordLearn | 背词首页：新学 / 复习 / 熟词 / 笔记 |
| `/words/learn`、`/words/review` | WordStudy / WordReview | 新学流程、复习流程 |
| `/study`、`/study/:level` | Study / GrammarReader | 文法概览、文法阅读器（分页 / 顺序） |
| `/reading`、`/reading/:id` | ReadingList / ReadingView | 读解列表、文章 + 答题 + 译文难句 |
| `/listening`、`/listening/:unit` | Listening / ListeningUnit | 听解单元列表 / 单元（词汇·题目·知识） |
| `/my` | My | 学习数据、错题本、收藏、文法卡、账号、反馈入口 |
| `/settings` | Settings | 主题、目标、数据管理、备份导入导出、关于 |
| `/admin/feedback` | FeedbackAdmin | 管理员审核反馈（需在 `admins` 表） |
| `/result` | Result | 模拟测试结果页 |
| `/stats`、`/wrong`、`/favorites` | 重定向 | 分别跳到 `/my`、`/my?tab=wrong`、`/my?tab=favorites`（旧链接兼容） |

---

## 四、功能地图

| 模块 | 核心能力 |
| --- | --- |
| 全局 | 等级 N5–N1 切换、浅色/深色/跟随系统、振假名（**作答期间锁定**）、页面切换过渡、滚动进度条、更新提示 |
| 首页 | 今日目标环（答题/背词双目标）、连续打卡、近 7 天柱状、学习卡（背词/文法进度）、练习卡（题库/模拟/读解/听解） |
| 刷题 | 顺序 / 随机（可全随机洗牌）/ 单元 / 模拟 / 错题重做 / 收藏练习；答题卡跳转；即时判定 + 解析；收藏与错题自动记录 |
| 模拟 | 按回次抽题、计时得分、成绩留存（`mockResults`） |
| 背词 | 新学（每日目标）、复习（错误 ≥2 次或 2 天未复习即"生疏"）、熟词标记、笔记、6+3 种题型 |
| 文法 | 概览 → 阅读器：分页（翻书动效）/ 顺序滚动、右侧目录抽屉、★ 标记、阅读进度百分比、最近阅读位置记忆；概览页可分别清空标记/进度 |
| 读解 | 文章 + 逐题作答 + 解析；**答完全部题目解锁**全文翻译与难句拆解 |
| 听解 | 单元分三大板块（词汇 / 题目 / 补充知识）、教材音频二维码弹窗、翻页器 |
| 我的 | 正确率、题库/答对/错题统计、按级进度、错题本与收藏列表、文法学习卡、登录状态、反馈管理入口（管理员） |
| 设置 | 目标设定、主题、7 类数据独立清除、JSON 导出/导入、清空全部、意见反馈、关于与版本 |
| 账号 | 邮箱注册/登录/找回密码、`admins` 判定管理员、登录后自动拉取合并 + 3 秒防抖上传 |
| 反馈 | 答题页按题反馈（自动带题号）、设置页"意见反馈"；管理员可查看全部并标记已处理 |
| 更新 | Electron：electron-updater 增量更新；Android：跳系统浏览器下载 APK；PWA：跳 Releases 页 |

---

## 五、数据与同步一览

| 存储 | 键 / 表 | 内容 |
| --- | --- | --- |
| localStorage | `sakura_japanese_state_v1` | 题库答题记录、错题、收藏、按级计数、模拟成绩 |
| localStorage | `sakura_word_state_v1` | 背词已学、熟词、笔记、背词设置 |
| localStorage | `sakura_grammar_state_v1` | 文法 ★ 标记、已学点、最近位置、阅读模式 |
| localStorage | `sakura_daily_v1` | 每日答题/背词计数、目标、最近活跃（**不参与云同步**） |
| localStorage | `sakura_japanese_level` / `sakura_theme_v1` / `sakura_furigana_enabled` / `sakura_random_fully_random` | 等级、主题、振假名开关、随机全洗牌开关 |
| Supabase | `user_profiles` | 每用户一行：`japanese_state` + `word_state`（JSON 文本），`updated_at` |
| Supabase | `feedbacks` | 反馈：`type` / `question_id` / `level` / `content` / `contact` / `status` |
| Supabase | `admins` | 管理员用户 id 名单 |

合并规则（登录时"云端 + 本地"）：数组取并集、对象键并集、计数与时间戳取较大值、布尔取或；合并后调用 `repairState()` 修复畸形字段，保证渲染不因坏数据白屏。字段级说明见 [业务对象清单.md](./业务对象清单.md)。

---

## 六、移动端排版约定（当前实现）

移动端（≤760px）只保留一条 46px 细顶栏 + 52px 悬浮 Dock，页面级工具条一律压成单行；正文区域吃满剩余高度。

| 元素 | 断点 | 高度（实测 @390×844） | 说明 |
| --- | --- | --- | --- |
| 顶部导航 `.nav` | ≤760px | 47px（原 59px） | 品牌名 15px、功能键收成 30px 纯图标（振假名只留"あ"） |
| 文法工具条 `.reader-bar` | ≤760px | 48px（原 118px） | 单行：返回图标 + `等级/页码` + 分页·顺序 + 目录图标；隐去"分页阅读"标签、★ 徽标、重复的"140 点" |
| 文法纸面 `.book` | ≤760px | `calc(100dvh - 190px)` | 原 `100dvh - 330px`；正文起始位置从 207px 提升到 115px |
| 底部翻页条 `.pager-bar` | ≤760px | 46px（原 66px） | 圆形箭头按钮 + 页码 + 3px 细进度；隐藏"上一页/下一页"文字与快捷键提示 |
| 底部 Dock `.tabbar` | 全移动端 | 54px（原 60px） | 图标 18px、文字 10.5px |
| 读解工具条 `.rv-topbar` | ≤760px | 46px | 单行：返回图标 + 文章标题；标签与百分比收进底部条 |
| 听解单元页头 | ≤640px | 两行 | 隐去 kicker 与题量/知识芯片，保留返回 + 单元标题 + 主题 |

**维护规则**

1. 新增移动端交互优先"图标化 + 合并成行"，不再新增第二行按钮条。
2. 任何固定高度条（顶部/底部）改动后，必须同步复核 `.book`、`.rv-page` 的 `calc(100dvh - Npx)` 与页面 `padding-bottom`。
3. 底部元素一律留 `env(safe-area-inset-bottom)`，并保证悬浮 Dock（52px + 8px）不被翻页条压住。
4. 断点统一用 760 / 640 两档；320px 宽（iPhone SE 一代）仍需能单行放下工具条。
5. **移动端不出现任何键盘快捷键提示**（≤760px）：键帽用 `.kbd`、行内说明用 `.kbd-hint`、自评键标用 `.eval-key`、整条翻页说明用 `.page-hint`，并在组件 `<style>` 的 `@media (max-width:760px)` 里 `display:none`；桌面（≥761px）保留。新增提示务必复用这四个类，否则会漏隐藏。

截图（`docs/screenshots/mobile-ux/`，均为离屏渲染实拍）：

| 文件 | 视口 | 说明 |
| --- | --- | --- |
| 文法阅读页-优化前-390.png | 390×844 | 旧版：两条工具条 + 大号返回/目录按钮 |
| 文法阅读页-优化后-390.png | 390×844 | 新版：单行工具条、纸面吃满 |
| 文法阅读页-优化后-360.png | 360×740 | 窄屏仍单行 |
| 文法阅读页-优化后-320.png | 320×568 | iPhone SE 一代：不溢出、无横向滚动 |
| 文法目录抽屉-优化后-390.png | 390×844 | 目录抽屉；底部只剩"点击目录项跳转"，无 Esc 提示 |
| 读解页-优化后-390.png | 390×844 | 顶部单行 + 底部答题条单行 |
| 首页-优化后-390.png | 390×844 | 细顶栏 + 悬浮 Dock |
| 背词学习-优化后-390.png | 390×844 | 页头只剩"点击卡片翻面"，无 Enter/A/D/F/N |
| 背词复习-优化后-390.png | 390×844 | 页头无"快捷键 1/2/3"，按钮无"按 1/2/3" |
| 听解单元-优化后-390.png | 390×844 | 无"A 上一组 / D 下一组"键位说明 |
| 文法阅读页-桌面回归-1180.png | 1180×900 | 桌面布局零回归（键帽 A/D 正常显示） |
| 听解单元-桌面回归-1180.png | 1180×900 | 桌面仍显示键位说明 |

---

## 七、开发约定（摘要）

- 只用 Vue 3 组合式 API + 自研 store（`reactive` + `watch` → localStorage），不引入 Pinia/UI 框架。
- 数据文件由脚本生成，**不要手改** `src/data/grammar.js`（文件头已注明）；改数据请改生成脚本或原始资料。
- 任何写入渲染层的状态字段先过 `migrate` / `repairState`，列表字段（`wrong` / `favorites`）必须是数组。
- 客户端产物只允许出现 **anon public key**；`npm run build` 会解码校验，填成 `service_role` 直接构建失败。
- 文案、图标、配色沿用樱花粉设计令牌（`--sakura-*`），不要硬编码色值。
