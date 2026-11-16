#!/usr/bin/env node
/* 真实 DOM 回归：连本机 DSH（9333 调试口），量主题在真实页面上的落地效果。
 * 覆盖历史上真踩过的坑：
 *   - 令牌层/结构层/常驻小部件层三层缺任何一个
 *   - 无类名裸 input 关掉 appearance 后塌成 0 宽（0.5.1 修的）
 *   - 适配哨兵误报（结构层活着却黄了）
 * 用法：先启动 DSH（带 --remote-debugging-port=9333），再跑 npm run regress。
 * 任何 FAIL 退出码 1；SKIP 不算失败。 */

const DEBUG_PORT = Number(process.env.DSH_DEBUG_PORT || 9333)

const results = []
const record = (ok, name, detail) => {
  results.push({ ok, name, detail })
  console.log(`${ok === 'skip' ? 'SKIP' : ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —— ' + detail : ''}`)
}

async function main() {
  let targets
  try {
    targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()
  } catch {
    record(false, 'CDP 可达', `127.0.0.1:${DEBUG_PORT} 连不上，DSH 需带 --remote-debugging-port=${DEBUG_PORT} 启动`)
    process.exit(1)
  }
  const page = targets.find((t) => t.type === 'page' && t.url.startsWith('dsh-app'))
  if (!page) {
    record(false, '找到主页面', `targets: ${targets.map((t) => `${t.type}:${t.url.slice(0, 40)}`).join(' | ') || '空'}`)
    process.exit(1)
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  }
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })

  const evalJson = async (expression) => {
    const out = await send('Runtime.evaluate', { expression, returnByValue: true })
    if (out.exceptionDetails) throw new Error(out.exceptionDetails.text || 'evaluate 异常')
    return JSON.parse(out.result.value)
  }

  // 1. 三层就位
  const layers = await evalJson(`JSON.stringify({
    tokens: !!document.body && document.body.getAttribute('style') !== null && document.body.getAttribute('style').includes('--dsw-static-neutral-bluish-1000'),
    structure: !!document.getElementById('dsh-workbuddy-theme-css'),
    widget: !!document.getElementById('dsh-workbuddy-theme-widget-css'),
    wbAttr: document.documentElement.hasAttribute('data-dsh-wb'),
  })`)
  record(layers.tokens, '令牌层（body 内联 --dsw-static-*）')
  record(layers.structure, '结构层 style 标签')
  record(layers.widget, '常驻小部件层 style 标签')
  record(layers.wbAttr, '侧栏探测 data-dsh-wb 已挂', layers.wbAttr ? '' : '侧栏类名未命中，若为新版宿主则是真实漂移')

  // 2. 复选框：可见样本量尺寸与外观（0.5.1 裸 input 塌陷的回归门）
  const cb = await evalJson(`JSON.stringify((() => {
    const all = [...document.querySelectorAll('input[type=checkbox]')]
    const vis = all.filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 })
    const sample = (vis.length > 0 ? vis : all).slice(0, 3).map((el) => {
      const cs = getComputedStyle(el)
      return { w: cs.width, appearance: cs.appearance, minW: cs.minWidth, border: cs.borderTopWidth }
    })
    return { total: all.length, visible: vis.length, sample }
  })())`)
  if (cb.total === 0) {
    record('skip', '复选框尺寸', '当前页面没有复选框')
  } else {
    for (const [i, s] of cb.sample.entries()) {
      const px = parseFloat(s.w)
      record(
        s.appearance === 'none' && px >= 12,
        `复选框 #${i}（${s.w}，appearance=${s.appearance}）`,
        `min-width=${s.minW} border=${s.border}${cb.visible === 0 ? '（隐藏样本，仅验计算值）' : ''}`,
      )
    }
  }

  // 3. 适配哨兵：结构层活着时不许误报告警
  const sentinel = await evalJson(`JSON.stringify({
    pill: !!document.querySelector('.dsh-wb-stat'),
    warn: !!document.querySelector('.dsh-wb-stat-warn'),
  })`)
  if (!sentinel.pill) {
    record('skip', '会话头胶囊', '当前不在会话页，胶囊未渲染')
  } else {
    record(!(layers.wbAttr && sentinel.warn), '适配哨兵不误报', layers.wbAttr && sentinel.warn ? '结构层已生效但胶囊仍是告警态' : '')
  }

  ws.close()
  const failed = results.filter((r) => r.ok === false)
  console.log(`\n${results.filter((r) => r.ok === true).length} PASS / ${results.filter((r) => r.ok === 'skip').length} SKIP / ${failed.length} FAIL`)
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('回归脚本自身出错：', error && error.message)
  process.exit(1)
})
