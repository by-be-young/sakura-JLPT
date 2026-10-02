// 构建守卫：确保打进客户端（exe / apk / 网页）的 Supabase key 只能是 anon public key。
//
// 事故背景：src/supabase/config.js 曾被误填 **service_role** key 并随 v1.1.0/1.1.1/1.1.2
// 的 exe 与 apk 公开发布 —— 等于把数据库最高权限（可绕过 RLS 读写删除全部用户数据）
// 一起发了出去。secrets 一旦进过客户端产物就应视为泄露，只能轮换。
//
// 规则：
//   - anon public key（JWT，payload.role === 'anon'）或新版 sb_publishable_... → 通过
//   - service_role JWT / sb_secret_... → 直接让构建失败
//   - 未配置（空）→ 仅警告：应用进入纯本地模式，登录/云同步不可用
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function readEnvFiles() {
  const out = {};
  for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
  }
  return out;
}

function readSourceDefaults() {
  const p = path.join(root, 'src', 'supabase', 'config.js');
  if (!fs.existsSync(p)) return { url: '', key: '' };
  const src = fs.readFileSync(p, 'utf8');
  return {
    url: (/(?:DEFAULT_URL)\s*=\s*['"]([^'"]*)['"]/.exec(src) || [])[1] || '',
    key: (/(?:DEFAULT_ANON_KEY)\s*=\s*['"]([^'"]*)['"]/.exec(src) || [])[1] || '',
  };
}

function jwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    let b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return JSON.parse(Buffer.from(b, 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
}

const env = readEnvFiles();
const defaults = readSourceDefaults();

const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || defaults.url;
const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || defaults.key;

const source = process.env.VITE_SUPABASE_ANON_KEY
  ? 'process.env'
  : env.VITE_SUPABASE_ANON_KEY
    ? '.env* 文件'
    : 'src/supabase/config.js';

if (!key) {
  console.warn('[check:supabase] ⚠️ 未配置 Supabase key —— 应用将以纯本地模式构建（登录/云同步不可用）。');
  console.warn('[check:supabase]    如需启用：复制 .env.example 为 .env.local 并填入 anon public key。');
  process.exit(0);
}

if (/^sb_secret_/i.test(key)) {
  console.error('[check:supabase] ❌ 检测到 Supabase **secret key**（sb_secret_...），禁止打进客户端！');
  console.error('[check:supabase]    请改用 anon public key / sb_publishable_... ，并到后台轮换这个 secret key。');
  process.exit(1);
}

if (/^sb_publishable_/i.test(key)) {
  console.log(`[check:supabase] ✅ publishable key 校验通过（来源：${source}）；URL=${url}`);
  process.exit(0);
}

const payload = jwtPayload(key);
if (!payload) {
  console.warn('[check:supabase] ⚠️ 无法解析该 key 的 JWT payload，请自行确认它是 anon public key。');
  process.exit(0);
}

if (payload.role !== 'anon') {
  console.error(`[check:supabase] ❌ 该 key 的 role 是 "${payload.role}"，不是 anon —— 禁止打进客户端！`);
  if (payload.role === 'service_role') {
    console.error('[check:supabase]    service_role 拥有数据库最高权限（绕过 RLS），随安装包发布会泄露全部用户数据。');
  }
  console.error('[check:supabase]    处理：Supabase 后台 → Project Settings → API → 轮换 JWT secret，');
  console.error('[check:supabase]          然后改用新的 anon public key（.env.local 的 VITE_SUPABASE_ANON_KEY）。');
  process.exit(1);
}

console.log(`[check:supabase] ✅ anon key 校验通过（来源：${source}，ref=${payload.ref || '未知'}）；URL=${url}`);
process.exit(0);
