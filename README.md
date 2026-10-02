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

## 七、注意事项

- 自动更新检查需要网络；无网络时应用完全离线可用（数据全在本地）。
- Electron 打包首次需要下载签名工具，国内网络建议设置镜像：
  ```
  setx ELECTRON_BUILDER_BINARIES_MIRROR https://npmmirror.com/mirrors/electron-builder-binaries/
  setx ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
  ```
- 修改 `public/sw.js` 缓存策略后，需要修改其版本常量 `CACHE_NAME` 触发更新。
