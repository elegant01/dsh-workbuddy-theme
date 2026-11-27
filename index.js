// dsh-workbuddy-theme — 宿主端（node）。
//
// 效果全在 client.js：主题通过宿主公开的 ctx.theme.overrideTokens()
// 叠加一层令牌覆盖（配色 + 字体），再注入一段只描述结构细节的 CSS。
// 宿主端做两件事：
//   1. 把 Codex 原生宠物目录（~/.codex/pets）暴露给客户端；
//   2. 增强提示词接口：借 ctx.llm 调一次辅助模型（同标题生成那条通道），
//      prompt 约束照 WorkBuddy 的增强功能等价重写（语言一致、只出增强文本）。
import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'dsh-workbuddy-theme'
export const inject = ['webServer']

const BASE = '/dsh-workbuddy-theme/pet'
const CLEAN_ID = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,63}$/
const ENHANCE_BASE = '/dsh-workbuddy-theme/enhance'
const ENHANCE_MAX_INPUT = 20_000
const ENHANCE_TIMEOUT_MS = 60_000
const ENHANCE_MAX_TOKENS = 2048

const ENHANCE_SYSTEM = `You are a prompt engineering assistant for a coding AI agent. Rewrite the user's prompt to be more effective while keeping its core purpose.

Principles:
- Identify the main objective, then remove ambiguity and missing context.
- Make instructions specific; state scope, constraints, and expected output.
- Structure the request; match tone and complexity to the use case.
- Do not answer the request, do not ask for how-tos or code snippets, do not suggest technologies the user did not mention.
- Focus on WHAT, not HOW.
- Keep the result concise, around 800 characters at most.
- Language matching is the highest priority: reply in exactly the language of the input (Chinese in, Chinese out; a mixed input keeps a natural mix).
- Output only the enhanced prompt text: no preface, no commentary, no markdown fences, no language labels.`

const ENHANCE_USER = `Improve the user prompt while preserving its intent and language.

USER INPUT:
{input}

Rules:
1. Write the enhanced prompt in the same language as the input; never add language labels or meta notes.
2. Preserve intent, topic, constraints, and target output type; do not answer the request.
3. Clarify task, scope, constraints, and expected output whenever the original is vague; if already clear, polish lightly.
4. Keep it complete and concise; never end mid-list, on a dangling conjunction, or a trailing colon.
5. Return only the enhanced prompt text.`

function stripWrappingQuotes(text) {
  return text.trim().replace(/^["'“”‘’]|["'“”‘’]$/g, '')
}

function readJsonBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(Object.assign(new Error('body too large'), { code: 'body_too_large' }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(Object.assign(new Error('invalid json'), { code: 'invalid_json' }))
      }
    })
    req.on('error', reject)
  })
}

function resolveDefaultRoute(ctx) {
  try {
    const selection = ctx.get('agentDefaultModel')?.currentSelection?.()
    if (selection && typeof selection.provider === 'string' && typeof selection.model === 'string') {
      return { provider: selection.provider, model: selection.model }
    }
  } catch { /* 服务缺失时返回空 */ }
  return null
}

async function listModelCatalog(llm, ctx) {
  const providers = []
  for (const provider of llm.listProviders()) {
    try {
      const models = await llm.listModels(provider.id)
      if (models.length === 0) continue
      providers.push({
        id: provider.id,
        name: typeof provider.name === 'string' && provider.name !== '' ? provider.name : provider.id,
        models: models.map((model) => ({ id: model.id, name: model.name })),
      })
    } catch { /* 单个 provider 失败不影响其它组 */ }
  }
  return { providers, default: resolveDefaultRoute(ctx) }
}

async function runEnhance(ctx, payload) {
  const text = typeof payload?.text === 'string' ? payload.text : ''
  if (text.trim() === '') {
    return { status: 400, body: { error: { code: 'empty_input', message: '输入为空' } } }
  }
  if (text.length > ENHANCE_MAX_INPUT) {
    return { status: 413, body: { error: { code: 'input_too_large', message: '输入过长' } } }
  }
  let llm
  try {
    llm = ctx.get('llm')
  } catch {
    llm = undefined
  }
  if (!llm || typeof llm.prepareCall !== 'function') {
    return { status: 503, body: { error: { code: 'llm_unavailable', message: 'LLM 服务不可用' } } }
  }
  const fallback = resolveDefaultRoute(ctx)
  const provider = typeof payload?.provider === 'string' && payload.provider !== ''
    ? payload.provider
    : fallback?.provider
  const model = typeof payload?.model === 'string' && payload.model !== ''
    ? payload.model
    : fallback?.model
  if (!provider || !model) {
    return { status: 409, body: { error: { code: 'no_model', message: '未找到可用模型路由' } } }
  }
  const signal = AbortSignal.timeout(ENHANCE_TIMEOUT_MS)
  try {
    const call = await llm.prepareCall({ provider, model, maxTokens: ENHANCE_MAX_TOKENS }, signal)
    const messages = [{ role: 'user', content: [{ type: 'text', text: ENHANCE_USER.replace('{input}', text) }] }]
    let output = ''
    for await (const chunk of call.stream({
      ...call.config,
      messages,
      system: ENHANCE_SYSTEM,
      purpose: 'prompt-enhance',
      signal,
    })) {
      if (chunk.type === 'text-delta') output += chunk.text
      else if (chunk.type === 'finish') {
        const kind = chunk.reason?.kind
        if (kind === 'error' || kind === 'aborted') {
          const message = chunk.reason?.failure?.message ?? 'LLM completion failed'
          return {
            status: kind === 'aborted' ? 504 : 502,
            body: { error: { code: kind === 'aborted' ? 'timeout' : 'llm_error', message } },
          }
        }
      }
    }
    const cleaned = stripWrappingQuotes(output)
    if (cleaned === '') {
      return { status: 502, body: { error: { code: 'llm_error', message: '增强结果为空' } } }
    }
    return { status: 200, body: { text: cleaned, provider, model } }
  } catch (error) {
    const code = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'timeout' : 'llm_error'
    return { status: code === 'timeout' ? 504 : 502, body: { error: { code, message: String(error?.message ?? error) } } }
  }
}

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
  // 增强提示词走独立前缀：webServer 的 prefix 路由只认注册的那一段路径，
  // 挂在 /pet 前缀下的话 /enhance/* 会落到宿主兜底（POST 直接 405）。
  webServer.register({
    kind: 'prefix',
    path: ENHANCE_BASE,
    handler: (req, res) => {
      void (async () => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const path = url.pathname
        if (req.method === 'GET' && path === `${ENHANCE_BASE}/models`) {
          let llm
          try {
            llm = ctx.get('llm')
          } catch {
            llm = undefined
          }
          if (!llm || typeof llm.listProviders !== 'function') {
            sendJson(res, 503, { error: { code: 'llm_unavailable', message: 'LLM 服务不可用' } })
            return
          }
          sendJson(res, 200, await listModelCatalog(llm, ctx))
          return
        }
        if (req.method === 'POST' && path === `${ENHANCE_BASE}/run`) {
          let payload
          try {
            payload = await readJsonBody(req, ENHANCE_MAX_INPUT * 4)
          } catch (error) {
            sendJson(res, error?.code === 'body_too_large' ? 413 : 400, {
              error: { code: error?.code ?? 'bad_request', message: String(error?.message ?? error) },
            })
            return
          }
          const result = await runEnhance(ctx, payload)
          sendJson(res, result.status, result.body)
          return
        }
        sendJson(res, 404, { error: 'not found' })
      })().catch(() => {
        if (!res.headersSent) sendJson(res, 500, { error: 'enhance failed' })
        else res.end()
      })
    },
  })
}
