#!/usr/bin/env node
// 从 WorkBuddy 本地皮肤缓存生成 client.js 里的 SKIN_PRESETS 块。
//
// 用法：node scripts/build-skins.mjs [缓存目录]
// 默认目录：~/.workbuddy/app/session/Service Worker/CacheStorage/<hash>/<cache-id>/
// 每个 *_0 文件是 Chromium simple-cache 条目：24 字节文件头 + key + 原始 ZIP。
//
// 皮肤是导入型外观包：skin.css 里一组 --wb-* / --cr-* 变量 + 背景图。
// 背景图不搬（布局不同，塞进来会挡内容），只取色板，按下表映射到 DSH 令牌。

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLIENT = join(ROOT, 'client.js')
const BEGIN = '    // <dsh-workbuddy-skins:begin> 由 scripts/build-skins.mjs 生成，勿手改。'
const END = '    // <dsh-workbuddy-skins:end>'

const SKIN_NAMES = {
  purple: '蓝紫 · Clear Sky',
  'blue-video-fallback': '柔和蓝',
  green: '森林绿',
  qqblue: '晴空蓝',
  mint: '深海青',
}

// 皮肤变量 → DSH 令牌。左边是目标令牌，右边是皮肤里的来源变量。
// 只挑界面里真正会被用到的档位；没列到的继续沿用插件默认值。
const ACCENT_MAP = {
  '--wb-control-on': 'wb-brand-accent',
  '--wb-control-on-hover': 'wb-button-primary-bg-hover',
  '--dsw-static-deepseek-500': 'wb-brand-accent',
  '--dsw-static-deepseek-450': 'wb-brand-soft',
  '--dsw-static-deepseek-400': 'wb-brand-primary-deep',
  '--dsw-static-blue-500': 'wb-brand-accent',
  '--dsw-static-blue-450': 'wb-brand-soft',
  '--dsw-static-blue-400': 'wb-brand-primary-deep',
  '--dsw-static-deepseek-50': 'wb-brand-accent-bg',
}

const SURFACE_MAP = {
  '--dsw-alias-bg-base': 'cr-bg-canvas',
  '--dsw-alias-bg-layer-1': 'wb-bg-card',
  '--dsw-alias-bg-layer-2': 'wb-bg-card',
  '--dsw-alias-bg-layer-3': 'wb-bg-popover',
  '--dsw-alias-bg-module-platform': 'wb-bg-item-selected',
  '--dsw-alias-bg-multi-select': 'cr-item-selected-bg',
  '--dsw-alias-bg-overlay': 'wb-bg-hover',
  '--dsw-alias-bg-skeleton': 'wb-bg-skeleton',
  '--dsw-alias-card-fill': 'wb-bg-card',
  '--dsw-alias-card-fill-hover': 'wb-bg-card-hover',
  '--dsw-alias-interactive-bg-hover': 'cr-bg-hover',
  '--dsw-alias-interactive-bg-active': 'wb-bg-active',
  '--dsw-alias-interactive-bg-hover-solid': 'wb-bg-card-hover',
  '--dsw-alias-border-l1': 'wb-border-default',
  '--dsw-alias-border-l2': 'cr-border-default',
  '--dsw-alias-border-l3': 'cr-border-strong',
  '--dsw-alias-border-l4': 'cr-border-strong',
  '--dsw-alias-border-selected': 'wb-brand-accent',
  '--dsw-alias-label-primary': 'wb-text-strong',
  '--dsw-alias-label-secondary': 'wb-text-medium',
  '--dsw-alias-label-tertiary': 'wb-text-weak',
  '--dsw-alias-label-caption': 'wb-text-muted',
  '--dsw-alias-label-dimmed': 'wb-text-muted',
  '--dsw-alias-link': 'cr-text-link',
  '--dsw-alias-button-info-fill': 'wb-brand-accent',
  '--dsw-alias-button-info-hover': 'wb-brand-soft',
  '--dsw-alias-button-primary-fill': 'wb-brand-accent',
  '--dsw-alias-button-primary-hover': 'wb-brand-primary-deep',
  '--dsw-alias-markdown-inline-code': 'cr-bg-code-inline',
  '--dsw-alias-markdown-code-block': 'cr-bg-code',
  '--dsw-alias-markdown-code-block-banner': 'cr-bg-code-header',
  '--dsw-alias-markdown-tag': 'cr-tag-bg',
  '--dsw-alias-switch-thumb': 'wb-control-selected-fg',
  '--dsw-alias-scrollbar-bg-l1': 'wb-scrollbar-thumb',
  '--dsw-alias-scrollbar-bg-l2': 'wb-scrollbar-thumb-bg',
  '--dsw-alias-scrollbar-hover-l1': 'wb-scrollbar-thumb-hover',
  '--dsw-alias-scrollbar-hover-l2': 'wb-scrollbar-thumb-hover',
  '--dsw-specific-sidebar-fill': 'cr-bg-secondary',
  '--dsw-specific-input-major': 'cr-bg-primary-default',
  '--dsw-specific-menu': 'wb-bg-popover',
  '--dsw-specific-selector': 'cr-item-selected-bg',
  '--dsw-specific-tip': 'wb-bg-tooltip',
  '--dsw-specific-login-input': 'cr-bg-primary-default',
}

const BUBBLE_VAR = 'cr-user-bubble-bg'
const BORDER_VAR = 'cr-border-default'
// 弹层阴影：宿主没有独立阴影令牌，但 --dsw-elevation-* 是纯 CSS 变量，
// 皮肤包的 popover 双层阴影可以直接替换其主体部分。
const SHADOW_VARS = ['cb-shadow-popover', 'wb-main-area-box-shadow']
const SHADOW_STROKE_VARS = ['cr-popover-border', 'wb-border-popover']

// 皮肤的 --wb-text-* 是 8 位十六进制（带 alpha），值本身可直用。
function cacheDirs(arg) {
  if (arg) return [arg]
  const base = join(homedir(), '.workbuddy', 'app', 'session', 'Service Worker', 'CacheStorage')
  if (!existsSync(base)) throw new Error('找不到 WorkBuddy 缓存目录：' + base)
  const out = []
  for (const hash of readdirSync(base)) {
    const hashDir = join(base, hash)
    if (!statSync(hashDir).isDirectory()) continue
    for (const id of readdirSync(hashDir)) {
      const dir = join(hashDir, id)
      if (!statSync(dir).isDirectory()) continue
      if (readdirSync(dir).some((f) => /_0$/.test(f))) out.push(dir)
    }
  }
  return out
}

function readZipEntries(buf) {
  let eocd = -1
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('ZIP 中央目录缺失')
  const count = buf.readUInt16LE(eocd + 10)
  let off = buf.readUInt32LE(eocd + 16)
  const entries = []
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break
    const method = buf.readUInt16LE(off + 10)
    const csize = buf.readUInt32LE(off + 20)
    const nameLen = buf.readUInt16LE(off + 28)
    const extraLen = buf.readUInt16LE(off + 30)
    const commentLen = buf.readUInt16LE(off + 32)
    const lho = buf.readUInt32LE(off + 42)
    const name = buf.slice(off + 46, off + 46 + nameLen).toString('utf8')
    off += 46 + nameLen + extraLen + commentLen
    entries.push({ name, method, csize, lho })
  }
  return entries
}

function cacheEntries(dir) {
  const out = []
  for (const file of readdirSync(dir)) {
    if (!/_0$/.test(file)) continue
    const buf = readFileSync(join(dir, file))
    if (buf.length < 32 || buf.readUInt32LE(4) !== 0xfcfb6d1b) continue
    const keyLen = buf.readUInt32LE(12)
    const key = buf.slice(24, 24 + keyLen).toString('utf8')
    const bodyStart = 24 + keyLen
    if (buf.readUInt32LE(bodyStart) !== 0x04034b50) continue
    const m = /\/skin\/([^/]+)\/(\d+)$/.exec(key)
    if (!m) continue
    out.push({ resourceKey: m[1], updatedAt: m[2], zip: buf.slice(bodyStart) })
  }
  return out
}

function skinInfo(zip, zlib) {
  // 只需要 skin.css：用中央目录定位，macOS 元数据与数据描述符都不影响。
  const entries = readZipEntries(zip)
  const entry = entries.find((e) => /(^|\/)skin\.css$/.test(e.name))
  if (!entry) return null
  const folder = entry.name.replace(/\/?skin\.css$/, '').split('/').pop() ?? ''
  const slug = folder.replace(/^workbuddy-skin-/, '') || 'skin'
  const data = extractEntry(zip, entry, zlib)
  if (data === null) return null
  const vars = {}
  for (const m of data.toString('utf8').matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;{}]+);/g)) {
    vars[m[1]] = m[2].replace(/!important/g, '').trim()
  }
  return { slug, vars }
}

let zlibModule = null

function extractEntry(buf, entry, zlib) {
  const lho = entry.lho
  if (buf.readUInt32LE(lho) !== 0x04034b50) return null
  const nlen = buf.readUInt16LE(lho + 26)
  const elen = buf.readUInt16LE(lho + 28)
  const start = lho + 30 + nlen + elen
  const data = buf.slice(start, start + entry.csize)
  if (entry.method === 0) return data
  if (entry.method === 8) return zlib.inflateRawSync(data)
  return null
}

function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// 深色下用品牌色压暗成底色：品牌色 14% + 深底 86%。
function darkTint(hex) {
  const rgb = hexToRgb(hex)
  if (rgb === null) return '#1f2933'
  const base = [22, 24, 27]
  const mix = rgb.map((c, i) => Math.round(c * 0.14 + base[i] * 0.86))
  return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('')
}

function buildPreset(slug, vars) {
  const id = slug
  const missing = []
  const pick = (name) => {
    const v = vars[name]
    if (typeof v !== 'string' || v === '') { missing.push(name); return null }
    return v
  }
  const accent = {}
  for (const [target, source] of Object.entries(ACCENT_MAP)) {
    const v = pick(source)
    if (v === null) continue
    accent[target] = target === '--dsw-static-deepseek-50'
      ? { light: v, dark: darkTint(pick('wb-brand-accent') || '#888888') }
      : { light: v, dark: v }
  }
  const surface = {}
  for (const [target, source] of Object.entries(SURFACE_MAP)) {
    const v = pick(source)
    if (v !== null) surface[target] = v
  }
  const bubble = pick(BUBBLE_VAR) || '#f2f2f2'
  const border = pick(BORDER_VAR) || '#e6e6e6'
  const shadowValue = SHADOW_VARS.map((n) => vars[n]).find((v) => typeof v === 'string' && v !== '') ?? null
  const strokeValue = SHADOW_STROKE_VARS.map((n) => vars[n]).find((v) => typeof v === 'string' && v !== '') ?? null
  return {
    slug,
    preset: {
      id,
      name: SKIN_NAMES[slug] || slug,
      accent,
      bubble: { light: bubble, dark: '#2c2c2e' },
      border: { light: border, dark: '#3a3a3c' },
      shadow: shadowValue === null ? null : { popover: shadowValue, stroke: strokeValue },
      surface,
    },
    missing,
  }
}

async function main() {
  zlibModule = await import('node:zlib')
  const dirs = cacheDirs(process.argv[2])
  const byId = new Map()
  for (const dir of dirs) {
    for (const entry of cacheEntries(dir)) {
      try {
        const info = skinInfo(entry.zip, zlibModule)
        if (info === null) continue
        const { slug, vars } = info
        const { preset, missing } = buildPreset(slug, vars)
        if (missing.length > 0) {
          console.warn(`[skip] ${slug} 缺少变量：${[...new Set(missing)].join(', ')}`)
          continue
        }
        byId.set(preset.id, preset)
      } catch (error) {
        console.warn('[skip]', entry.resourceKey, String(error && error.message))
      }
    }
  }
  const presets = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  if (presets.length === 0) throw new Error('没有在缓存里找到可用的皮肤包')

  const block = BEGIN + '\n    const SKIN_PRESETS = ' + JSON.stringify(presets, null, 2).replace(/\n/g, '\n    ') + '\n' + END
  const source = readFileSync(CLIENT, 'utf8')
  let next
  if (source.includes(BEGIN)) {
    const re = new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    next = source.replace(re, block)
  } else {
    const anchor = '    /* 静态色阶'
    if (!source.includes(anchor)) throw new Error('client.js 里找不到插入锚点')
    next = source.replace(anchor, block + '\n\n' + anchor)
  }
  writeFileSync(CLIENT, next)
  console.log(`已写入 ${presets.length} 套皮肤：` + presets.map((p) => `${p.name}(${p.id})`).join('、'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
