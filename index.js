// dsh-workbuddy-theme — 宿主端（node）。
//
// 效果全在 client.js：主题通过宿主公开的 ctx.theme.overrideTokens()
// 叠加一层令牌覆盖（配色 + 字体），再注入一段只描述结构细节的 CSS。
// 宿主端只做一件事：把 Codex 原生宠物目录（~/.codex/pets）暴露给客户端。
import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'dsh-workbuddy-theme'
export const inject = ['webServer']

const BASE = '/dsh-workbuddy-theme/pet'
const CLEAN_ID = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,63}$/

function sendJson(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' })
  res.end(JSON.stringify(value))
}

async function petDirs() {
  const root = join(homedir(), '.codex', 'pets')
  const seen = new Map()
  let names
  try {
    names = await readdir(root, { withFileTypes: true })
  } catch {
    return seen
  }
  for (const entry of names) {
    if (!entry.isDirectory() || !CLEAN_ID.test(entry.name) || seen.has(entry.name)) continue
    seen.set(entry.name, join(root, entry.name))
  }
  return seen
}

async function readManifest(dir, id) {
  try {
    const raw = await readFile(join(dir, 'pet.json'), 'utf8')
    const json = JSON.parse(raw)
    return {
      id,
      name: typeof json.displayName === 'string' && json.displayName !== '' ? json.displayName : id,
      version: Number(json.version) || 1,
    }
  } catch {
    return null
  }
}

async function listPets() {
  const out = []
  for (const [id, dir] of await petDirs()) {
    const meta = await readManifest(dir, id)
    if (meta === null) continue
    try {
      await readFile(join(dir, 'spritesheet.webp'))
    } catch {
      continue
    }
    meta.url = `${BASE}/asset/${encodeURIComponent(id)}`
    out.push(meta)
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  return out
}

export function apply(ctx) {
  let webServer
  try {
    webServer = ctx.get('webServer')
  } catch {
    return
  }
  if (!webServer) return
  webServer.register({
    kind: 'prefix',
    path: BASE,
    handler: (req, res) => {
      void (async () => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const path = url.pathname
        if (req.method === 'GET' && path === `${BASE}/state`) {
          sendJson(res, 200, { pets: await listPets() })
          return
        }
        if (req.method === 'GET' && path.startsWith(`${BASE}/asset/`)) {
          const id = decodeURIComponent(path.slice(`${BASE}/asset/`.length))
          const dirs = await petDirs()
          const dir = CLEAN_ID.test(id) ? dirs.get(id) : undefined
          if (dir === undefined) {
            sendJson(res, 404, { error: 'pet not found' })
            return
          }
          const bytes = await readFile(join(dir, 'spritesheet.webp'))
          res.writeHead(200, { 'content-type': 'image/webp', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' })
          res.end(bytes)
          return
        }
        sendJson(res, 404, { error: 'not found' })
      })().catch(() => {
        if (!res.headersSent) sendJson(res, 500, { error: 'pet read failed' })
        else res.end()
      })
    },
  })
}
