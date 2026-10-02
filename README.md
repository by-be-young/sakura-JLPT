# 樱花日语 - 多平台打包与更新指南

本项目为 Vue 3 + Vite 纯前端应用，可打包为 **Windows 桌面版（Electron）**、**Android APK（Capacitor）** 和 **iOS PWA（添加到主屏幕）**，三端均内置"检查更新"功能（基于 GitHub Releases）。

---

## 一、目录结构（新增部分）

```
electron/                 # Electron 桌面端
  main.js                 # 主进程（窗口 + 自动更新 electron-updater）
  preload.js              # 安全桥接（暴露 sakuraUpdater API）
public/
  manifest.webmanifest    # PWA 清单
  sw.js                   # Service Worker（离线缓存）
  update-config.js        # Web/Android/PWA 端更新配置（GitHub owner/repo）
  version.json            # 当前版本号（构建时自动同步）
  icons/                  # 应用图标（48~512）
build/
  icon.ico                # Windows 安装包图标
  icon-1024.png           # Android 图标源图
scripts/
  make_icons.py           # 图标生成脚本
  gen_android_assets.py   # Android 各尺寸图标/启动图生成脚本
  write_version.cjs       # 版本号同步脚本（package.json → version.json）
android/                  # Capacitor Android 工程
release/                  # Windows 打包产物输出目录
```

## 二、常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发（Vite） |
| `npm run build:web` | 构建 Web 静态资源（自动同步版本号） |
| `npm run build:win` | 打包 Windows 安装包（NSIS，输出到 release/） |
| `npm run build:android` | 构建 Android debug APK（输出 android/app/build/outputs/apk/debug/） |
| `npm run build:android:release` | 构建 Android release APK（需配置签名） |
| `npm run electron:dev` | 以 Electron 窗口运行开发模式 |

## 三、首次发布到 GitHub Releases（启用自动更新）

> 自动更新依赖 GitHub Releases，未配置前应用不会提示更新（静默跳过），不影响正常使用。

### 1. 创建 GitHub 仓库并上传源码
在 GitHub 新建仓库（例如 `sakura-japanese`），把本项目推送上去。

### 2. 修改两处配置（本项目已配置为 `by-be-young/sakura-JLPT`，新仓库时改这里）
- `package.json` → `build.publish`：把 `owner` / `repo` 改成你的 GitHub 用户名和仓库名。
- `public/update-config.js`：把 `owner` / `repo` 改成同样的值（Android / PWA 端使用）。

### 3. 发布一个新版本（以 v1.1.0 为例）
1. 修改 `package.json` 的 `version` 为 `1.1.0`。
2. 在 GitHub 上创建 Release，Tag 写 `v1.1.0`（**必须以 v 开头且符合语义化版本号**，如 `v1.1.0`；`v1.0` 这类不合法版本号会导致自动更新解析失败）。
3. 构建并上传以下文件到该 Release：
   - Windows：`release/樱花日语-Setup-1.1.0.exe` 和 `release/latest.yml`（electron-builder 生成的更新清单，**必须一并上传**）
   - Android：`android/app/build/outputs/apk/debug/app-debug.apk`（或 release 版 APK）

> 也可以直接用 electron-builder 的 `--publish always` 自动上传（需配置 GH_TOKEN）。

### 4. 各端更新逻辑
- **Windows**：启动后自动检查 GitHub Releases，发现新版本右下角弹出提示 → 点击下载（显示进度条）→ 重启安装。
- **Android**：启动后请求 GitHub Releases API，有新版本时弹出提示 → 点击跳转系统浏览器下载 APK，安装即可。
- **iOS PWA**：启动后检查 GitHub Releases，有新版本时提示前往 Releases 页面查看。

## 四、iOS 使用方式（PWA）

Windows 无法编译 iOS 原生应用（需 Mac + Xcode + 苹果开发者账号）。本项目已做好 PWA 支持：

1. 部署 `dist/` 到任意静态托管（GitHub Pages / Vercel / 自有服务器）。
2. iPhone/iPad 用 Safari 打开站点地址。
3. 点分享按钮 → **"添加到主屏幕"**。
4. 之后从主屏幕图标打开即为全屏应用，**支持离线使用**（Service Worker 已缓存全部资源）。

> 提示：先联网打开一次让资源缓存完成，之后离线可用。

## 五、Android 正式发布（可选）

默认 `assembleDebug` 产物可直接安装测试。正式上架/分发建议：
1. 生成签名密钥：`keytool -genkey -v -keystore sakura.keystore -alias sakura -keyalg RSA -keysize 2048 -validity 10000`
2. 在 `android/app/build.gradle` 的 `android{}` 中添加 signingConfigs 并配置。
3. `npm run build:android:release` 产出已签名 APK。

## 六、版本号维护

- **唯一来源**：`package.json` 的 `version` 字段。
- `npm run build:web` 会自动把版本号同步到 `public/version.json`（Web/Android/PWA 读取）。
- Android `android/app/build.gradle` 的 `versionCode`/`versionName` 需手动与新版本对齐（发版时同步修改）。

## 八、Supabase 账号接入（登录 + 学习数据云同步）

应用已内置「账号登录 + 学习数据云同步」功能（邮箱注册/登录/找回密码），基于 Supabase（免费计划即可，5 万月活 / 500MB 库）。配置后：登录账号即可跨设备同步题库进度、错题、收藏、背词进度与笔记。

> 说明：原先使用 LeanCloud，但其已于 2026 年 1 月起停止新用户注册、2027 年 1 月正式关停并销毁数据，故整体迁移至 Supabase。

### 1. 创建 Supabase 项目
1. 打开 https://supabase.com 登录（或注册）；
2. **New project** 创建项目：名字随意（如 `sakura-jp`），数据库密码设置后**务必保存**，区域选 **Singapore**（亚太访问最快，免费计划可用）；
3. 创建完成后，进入项目 → **Project Settings → API**，复制：
   - **Project URL**（形如 `https://xxxx.supabase.co`）
   - **anon public key**（形如 `eyJhbGciOi...`，Public 公开密钥，供前端使用）
4. （可选）**Auth → Sign In / Up → Email**：如需用户必须验证邮箱才能登录，保持「Confirm email」开启；想注册即用则关闭它（个人自用建议关闭，少一步收信）。

### 2. 建表（SQL Editor 执行一次）
进入项目 → **SQL Editor → New query**，粘贴执行：

```sql
-- 用户学习数据表：每用户一行，JSON 字段存整份学习状态
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  japanese_state text,   -- 题库进度/错题/收藏/计数
  word_state text,       -- 背词进度/笔记/设置
  updated_at timestamptz default now()
);

-- 行级安全：每个用户只能读写自己的数据
alter table public.user_profiles enable row level security;

create policy "own read"  on public.user_profiles
  for select using (auth.uid() = id);

create policy "own insert" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "own update" on public.user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 用户反馈表：答题页/「我的」页提交的反馈
create table if not exists public.feedbacks (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null, -- 登录用户；未登录为 null
  type text not null default 'general',                        -- question=题目反馈 | general=一般反馈
  question_id text,                                            -- 题目反馈时携带，形如 N2-123
  level text,                                                  -- 题目所属等级（N1-N5）
  content text not null,                                       -- 反馈内容
  contact text,                                                -- 联系方式（选填）
  status text not null default 'open',                         -- open=待处理 | resolved=已处理
  created_at timestamptz default now()
);
alter table public.feedbacks enable row level security;

-- 任何人可提交反馈（含未登录用户）
create policy "anyone can submit" on public.feedbacks
  for insert with check (true);

-- 仅本人可查看自己提交的反馈；审核在控制台用 service role 查看全部
create policy "own read" on public.feedbacks
  for select using (auth.uid() = user_id);
```

> 若建表时已执行过旧版 SQL，只需把下面 `user_profiles` 之后（含 `feedbacks` 表及两条策略）追加执行即可。

### 7.5 管理员（审核反馈）
管理员可查看全部反馈并标记已处理（普通用户只能提交、不能看别人的反馈）。

1. **建管理员表**（SQL Editor 执行一次）：

```sql
-- 管理员表：存放管理员用户的 id
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;
create policy "admin self read" on public.admins for select using (auth.uid() = user_id);
create policy "admin self insert" on public.admins for insert with check (auth.uid() = user_id);
```

2. **放宽反馈表的查看/更新策略**（覆盖第 2 步里 feedbacks 的 `own read`，SQL Editor 执行）：

```sql
drop policy if exists "own read" on public.feedbacks;

create policy "own or admin read" on public.feedbacks
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

create policy "admin update" on public.feedbacks
  for update using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  ) with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
```

3. **把自己设为管理员**：控制台 **Authentication → Users** 找到你的账号，复制 **User UUID**，然后 SQL Editor 执行：

```sql
insert into public.admins (user_id) values ('你的用户UUID');
```

4. 应用内：管理员登录后，「我的」→ 快捷操作会出现 **📋 反馈管理**，可查看全部反馈、一键标记已处理/恢复待处理。

### 3. 填入配置

> ⚠️ **这里只能填 anon public key。** service_role / secret key 是数据库最高权限（可绕过 RLS 读写删除全部用户数据），一旦被打进 exe/apk 公开发布，等于把整个数据库交出去，**只能轮换、无法撤回**。构建前会自动解码校验（`scripts/check_supabase_key.cjs`），填了非 anon 的 key 会直接让构建失败。

**方式 A（推荐，密钥不落仓库）**：复制 `.env.example` 为 `.env.local`（已被 .gitignore 忽略）并填写：

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

**方式 B**：直接编辑 `src/supabase/config.js` 的 `DEFAULT_URL` / `DEFAULT_ANON_KEY`（anon key 设计上就是公开的，提交进仓库无妨）。环境变量优先于源码默认值。

**如果不填**：应用仍可正常构建，但进入纯本地模式，登录入口显示「未配置云端」。

**如果 key 曾经误填成 service_role 并已发布过安装包**：

1. Supabase 后台 → **Project Settings → API → JWT Settings → Generate new JWT secret** 轮换（旧 key 立即失效）；
2. 轮换后 anon key 也会变，按上面方式 A/B 更新配置（旧版本用户会被强制登出，需重新登录）；
3. 重新打包并发布**新版本号**（如 v1.1.3），让自动更新把修复推给已安装用户；
4. 删除 GitHub Releases 里仍带泄露 key 的旧资产，避免继续被下载。

### 4. 重新构建
```bash
npm run build:win      # Windows 安装包
npm run build:android  # Android APK
```

### 5. 使用
- 进入「我的」页面 → 点击「登录 / 注册」→ 邮箱注册登录；
- 登录后学习数据自动上传云端；其他设备登录同一账号即可拉取合并；
- 开启「Confirm email」时，新注册用户需先查收验证邮件（界面会提示），验证后即可登录；
- 「我的」页面可退出登录；未登录时应用完全本地可用。

### 6. 数据与安全说明
- 学习数据存在 Supabase 的 `user_profiles` 表中（每用户一行，JSON 字段）；
- 合并策略：数组取并集、对象键并集、计数取较大值，**不丢数据**；
  - 注意 `wrong` / `favorites` / `learned` 这类字段**必须是数组**：云端若混入对象形态（如 `{}`），
    旧版合并逻辑会把数组吞成对象，导致「我的」页渲染报错白屏。现已修复（`deepMerge` 保证列表不变形）
    并在合并后自动归一化，坏数据会自愈；
- **anon key 是公开的**（随安装包分发），因此 **RLS 是唯一屏障**。打包前请确认三张表的 RLS 均已开启：
  `user_profiles`、`feedbacks`、`admins`；
- 自测方式（应返回 `[]` 或报错，而不是别人的数据）：
  ```bash
  curl 'https://<project-ref>.supabase.co/rest/v1/user_profiles?select=*' \
    -H 'apikey: <anon public key>' -H 'Authorization: Bearer <anon public key>'
  ```
- **禁止把 service_role / secret key 放进客户端代码**：那相当于发布数据库管理员权限。构建脚本会拦截。

### 7. 反馈功能与审核方法
- 反馈入口：答题页每题右上角 💬（自动带题目编号）；「我的」→ 快捷操作 → 📮 问题反馈；
- 反馈写入 `feedbacks` 表（未登录也可提交，可留联系方式）；
- **审核方法（推荐，零成本）**：登录 Supabase 控制台 → 你的项目 → **Table Editor** → 打开 `feedbacks` 表 → 点 `status` 列筛选 `open`（待处理）→ 逐条查看 `content` / `question_id` / `created_at` → 处理完把该行 `status` 改为 `resolved`。
  - 想及时收到通知：控制台 **Database → Webhooks** 可在新反馈入库时推送（免费额度内可用），或每天顺手打开 Table Editor 看一眼即可；
  - 需要按题目定位：反馈行的 `question_id` 形如 `N2-123`（等级-题号），`level` 列也可直接筛。

## 九、注意事项

- 自动更新检查需要网络；无网络时应用完全离线可用（数据全在本地）。
- Electron 打包首次需要下载签名工具，国内网络建议设置镜像：
  ```
  setx ELECTRON_BUILDER_BINARIES_MIRROR https://npmmirror.com/mirrors/electron-builder-binaries/
  setx ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
  ```
- 修改 `public/sw.js` 缓存策略后，需要修改其版本常量 `CACHE_NAME` 触发更新。
- **密钥纪律**：客户端产物（exe/apk/网页）里只允许出现 anon public key。`npm run build` 会解码校验，
  发现 `service_role` / `sb_secret_` 直接失败；已经发布过的 secret 一律视为泄露，必须到 Supabase 后台轮换。
- **构建会自动清空 `dist/`**（`npm run clean`）：electron-builder 是整目录打包的，若 `dist/` 里残留上一版
  带 hash 的 `index-*.js`（文件被占用时 Vite 可能删不掉），安装包会同时带上新旧两份代码（白胖约 2MB）。
  清理失败会中断构建，不会打出夹带旧代码的包。
- `release_*/`（如 `release_login/`、`release_v1.1.2/`）是打包输出目录，已在 `.gitignore` 中忽略，勿提交。
