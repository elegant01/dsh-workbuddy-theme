// dsh-workbuddy-theme — 浏览器侧。只做一件事：往 <head> 注入一段 CSS 变量覆盖 + 布局规则。
// 取值全部来自腾讯 WorkBuddy 桌面端 v5.0.2 的 renderer 设计令牌
// （resources/app.asar → /renderer/assets/src-Dml5RbhE.css，1985 个 --wb-* 变量）：
//   品牌 #00c29a；灰阶 #fafafa/#f7f7f7/#f2f2f2/#ebebeb/#e6e6e6；
//   字号刻度 12/13/14/16/18，正文 14px、行高 22px；对话栏 848px（≥1681px 屏 1008px）；
//   用户气泡 12px 圆角 + #f2f2f2；输入框 24px 圆角；工具卡 8px 圆角 / 卡片头 12px 16px。
// 不改 DOM、不拦事件，移除 style 节点即完全还原。
window.__ModuleLoader__.load({
  id: 'dsh-workbuddy-theme',
  factory() {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const ID = 'dsh-workbuddy-theme-css'

    const CSS = `
/* ============ 1. WorkBuddy 设计令牌 ============ */
:root,
body,
body[data-theme],
html body,
html body:not(#dsh-wb-never-match) {
  --wb-brand: #00c29a;
  --wb-brand-1: #dff7f2;
  --wb-brand-2: #bff0e6;
  --wb-brand-3: #9fe8d9;
  --wb-brand-7: #40d1b3;
  --wb-brand-9: #009273;
  --wb-brand-10: #00614d;

  --wb-gray-1: #fafafa;
  --wb-gray-2: #f7f7f7;
  --wb-gray-3: #f2f2f2;
  --wb-gray-4: #ebebeb;
  --wb-gray-5: #e6e6e6;

  --wb-text-strong: #000;
  --wb-text-medium: #000000b3;
  --wb-text-weak: #00000080;
  --wb-text-hint: #0000004d;

  --wb-border: color-mix(in srgb, #000 8%, transparent);
  --wb-border-weak: color-mix(in srgb, #000 4%, transparent);
  --wb-radius: 12px;

  --wb-font-ui: "PingFang SC", system-ui, -apple-system, "BlinkMacSystemFont", "Segoe UI",
    "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  --wb-font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;

  --wb-fs-body: 14px;
  --wb-fs-small: 12px;
  --wb-fs-code: 13px;
  --wb-lh-body: 22px;
  --wb-chat-max: 848px;
  --wb-input-radius: 24px;
  --wb-card-radius: 8px;
}

/* DSH 把「聚焦/选中」色统一挂在 --dsw-alias-state-business-primary → --dsw-static-deepseek-500，
   我们把这个令牌改成薄荷绿后，所有聚焦态（输入卡 :focus-within 边框、contenteditable 的
   caret-color、:focus-visible 的 2px outline、侧栏行焦点环）全变成绿色描边 —— 这就是
   「输入框外面那圈绿线」的来源。WorkBuddy 的输入框聚焦**不改变描边**，所以这两类
   聚焦令牌保持中性灰，品牌绿只用在发送按钮、选中文字、链接这些地方。 */
html body,
html body:not(#dsh-wb-never-match) {
  --dsw-focus-ring-color: var(--wb-gray-5);
}

/* 让 DSH 自己的中性色变量跟随 WorkBuddy 灰阶（存在才覆盖）。 */
html body:not(#dsh-wb-never-match) {
  --color-bg-primary: #fff;
  --color-bg-secondary: var(--wb-gray-2);
  --color-bg-tertiary: var(--wb-gray-3);
  --color-bg-hover: var(--wb-gray-4);
  --color-border: var(--wb-border);
  --color-border-light: var(--wb-border-weak);
  --color-accent: var(--wb-brand);
  --color-accent-bg: var(--wb-brand-1);
  --font-sans: var(--wb-font-ui);
  --font-mono: var(--wb-font-mono);

  /* DSH 真正的设计令牌（@deepseek-ai/dsh-client-ui-theme）：把它的品牌色
     从 DeepSeek 蓝 #4176e6 换成 WorkBuddy 薄荷绿，其余中性色换成 WorkBuddy 灰阶。 */
  --dsw-static-deepseek-50: #e9fbf6;
  --dsw-static-deepseek-500: #00c29a;
  --dsw-static-neutral-bluish-00: #ffffff;
  --dsw-static-neutral-bluish-50: #fafafa;
  --dsw-static-neutral-bluish-100: #f2f2f2;
  --dsw-static-neutral-bluish-200: #ebebeb;
  --dsw-static-neutral-bluish-150: #ebebeb;
  --dsw-static-neutral-bluish-300: #d1d1d1;
  --dsw-static-neutral-bluish-400: #a8a8a8;
  --dsw-static-neutral-bluish-600: #8c8c8c;
  --dsw-static-neutral-bluish-700: #595959;
  --dsw-static-neutral-bluish-1000: #000000;
  /* ---- 四级文字灰：对应 WorkBuddy --wb-color-text-primary / secondary / tertiary / disabled ---- */
  --dsw-alias-label-primary: #000000;
  --dsw-alias-label-secondary: #000000b3;
  --dsw-alias-label-tertiary: #00000080;
  --dsw-alias-label-caption: #00000080;
  --dsw-alias-label-dimmed: #0000004d;
  --dsw-alias-label-primary-dimmed: #000000b3;
  /* ---- 四级描边：对应 WorkBuddy --wb-color-border-*（1/2/3/4 档，主档 8% 黑） ---- */
  --dsw-alias-border-l1: #0000000a;
  --dsw-alias-border-l2: #00000014;
  --dsw-alias-border-l3: #0000001a;
  --dsw-alias-border-l4: #0000000a;
  /* ---- 状态色：WorkBuddy 绿 #31a354 / 橙 #f97316 / 红 #ec1313 ---- */
  --dsw-alias-state-success-primary: #31a354;
  --dsw-alias-state-warn-primary: #f59e0b;
  --dsw-alias-state-error-primary: #ec1313;
  --dsw-alias-link: #009273;
  --dsw-specific-bubble: var(--wb-gray-3);
  --dsw-alias-markdown-code-block: #fafafa;
  --dsw-radius-panel: 24px;

  /* ---- 字体栈与正文排版 ----
     DSH 的正文字体、字号、行高全部由令牌驱动（dsh-client-ui-theme 的
     design_platform_css_default），改令牌比锁类名稳定得多：
       --dsw-font-family          ← --dsh-font-family-text-default
       --dsw-font-markdown-base   ← var(--dsh-content-font-size,14px) / calc(24px + delta)
     WorkBuddy 正文 = PingFang SC 栈 + 14px / 22px + 0.1px 字距；
     DSH 默认行高是 24px，比 WorkBuddy 松 2px（9%），肉眼能看出密度差异。 */
  --dsh-font-family-text-default: "PingFang SC", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  --dsw-font-family: var(--dsh-font-family-text-default);
  --dsw-font-markdown-base: var(--dsh-content-font-size, 14px) /
    calc(22px + var(--dsh-content-font-delta)) var(--dsw-font-family);
  --dsw-font-markdown-base-line-height: calc(22px + var(--dsh-content-font-delta));
}

body, button, input, textarea, select {
  font-family: var(--wb-font-ui);
  -webkit-font-smoothing: antialiased;
}

/* ============ 2. 侧栏（WorkBuddy --wb-sidebar-bg）
   选择器策略（v4）：
     · 宿主主动发布的 data-* 属性优先（升级不易失效）；
     · 侧栏项宿主没发属性，只能锁类名 SidebarRoot_module_css_default（前缀 wtg9ga），
       并通过 <html data-dsh-wb-*> 探测失败时整段跳过，避免升级后「套上但错位」。
   DSH 0.2.2-rc.1 实测前缀 wtg9ga。 */
html[data-dsh-wb-sidebar="on"] .wtg9ga_root {
  background: var(--wb-gray-2);
  padding: 6px 8px;
}
/* 导航项：WorkBuddy 高 40px、8px 圆角、左右 8px 内边距、14px/22px、字重 400 */
html[data-dsh-wb-sidebar="on"] .wtg9ga_panelRow {
  min-height: 40px;
  border-radius: 8px;
  padding: 9px 8px;
  border-inline: 0;
  font-size: 14px;
  line-height: 22px;
  font-weight: 400;
  color: #000;
}
html[data-dsh-wb-sidebar="on"] .wtg9ga_panelRow:hover { background-color: var(--wb-gray-4); }
/* 选中态：WorkBuddy 用灰阶（gray-4），不用品牌绿 */
html[data-dsh-wb-sidebar="on"] .wtg9ga_panelRow.wtg9ga_panelActive,
html[data-dsh-wb-sidebar="on"] .wtg9ga_panelRow[aria-expanded="true"] { background-color: var(--wb-gray-4); color: #000; }
html[data-dsh-wb-sidebar="on"] .wtg9ga_panelRow:focus-visible { outline-color: var(--wb-brand); outline-offset: -2px; }

/* 会话列表项：宿主在 regionArea 里用 aria-current / aria-selected 标记选中，
   这里用属性选择器（稳定）而不是类名。 */
html[data-dsh-wb-sidebar="on"] .wtg9ga_regionArea [aria-current="true"],
html[data-dsh-wb-sidebar="on"] .wtg9ga_regionArea [role="treeitem"][aria-selected="true"] {
  background: var(--wb-gray-4);
  border-radius: 8px;
}

/* ============ 3. 对话区 ============
   正文排版（字体栈 / 14px / 22px 行高）走上面的 --dsw-font-markdown-base 令牌，
   这里只补字距。
   注意：.prose / .markdown-body 是 GitHub Markdown 的类名约定，DSH 并不使用，
   写了也不生效（v1~v3 这条一直没命中）。DSH 真正的正文类是 ._markdown_rve47_5，
   由 --dsw-font-markdown-base 驱动，所以无需也不应再锁类名。 */
[class*="_markdown_"] {
  letter-spacing: 0.1px;
}

/* 宿主对话区属性（ConversationRoot_module_css_default 发布）：
   data-conversation-content / data-conversation-scroll
   ⚠️ 对话区宽度【不能】用 max-width + 居中来做：
   宿主的滚动容器是满宽、消息列靠内部 padding 居中，
   给滚动容器套 max-width 会把「可滚动区域」本身缩窄，
   表现为"对话范围变小、滚动条缩到中间"。
   WorkBuddy 的 848px 居中栏，宿主已经有等价实现：
   --dsh-chat-content-width = clamp(680px, 列宽*0.64, 920px)，
   由用户在对话区拖拽宽度手柄调节。这里不改它。 */
@media (min-width: 1681px) {
  :root { --wb-chat-max: 1008px; }
}

/* 用户消息气泡：宿主在 UserMessageBubble 上发布 data-message-bubble（稳定属性），
   优先用它；._bubble_1sgyj_1 是 dsh-web-frontend 全局样式类名，仅作兜底。
   DSH 默认 = --dsw-specific-bubble（淡蓝）+ 20px 圆角；
   WorkBuddy 用户消息 = 12px 圆角 + gray-3 #f2f2f2。 */
[data-message-bubble],
._bubble_1sgyj_1 {
  background: var(--wb-gray-3);
  border-radius: var(--wb-radius);
  padding: 10px 14px;
  color: var(--wb-text-strong);
}
/* 助手消息：无框无底色，纯留白（WorkBuddy 原样） */

/* ============ 4. 输入框 ============
   选择器策略（v4）：宿主在 dsh-client-ui-conversation 里主动发布了一组 data-* 属性，
   升级时不受类名 hash 影响，因此优先使用：
     [data-composer-card]   输入卡（InputBar_module_css_default.card）
     [data-composer-input]  可编辑输入行
     [data-composer-seat]   输入区容器（ConversationRoot…composerSeat）
     [data-composer-dock]   底部工具条 dock
   只有「发送按钮 / 加号按钮」没有属性，仍按 InputBar 模块类名兜底。

   DSH 输入卡本来没有 border，视觉框来自 --dsw-elevation-stroke
   (0 0 0 .5px，内容盒内侧) + --dsw-elevation-soft 柔光。
   WorkBuddy .wb-cb-chat.light 是单层 1px 实边、不外发光、聚焦不改描边，
   所以这里只换 box-shadow，不引入 border。 */
[data-composer-card] {
  background: #fff;
  border: 0;
  border-radius: var(--wb-input-radius);
  box-shadow: 0 0 0 1px var(--wb-gray-5), 0 2px 4px -4px #0000000f;
  transition: box-shadow 0.18s ease;
}
/* 聚焦：WorkBuddy 聚焦不改描边，这里显式压回同款，抵消宿主的 focus-within 更色 */
[data-composer-card]:focus-within {
  box-shadow: 0 0 0 1px var(--wb-gray-5), 0 2px 4px -4px #0000000f;
}
/* 输入行：14px / 22px，光标品牌绿 */
[data-composer-input] {
  font-size: var(--wb-fs-body);
  line-height: var(--wb-lh-body);
  color: var(--wb-text-strong);
  caret-color: var(--wb-brand);
}
/* 底部工具条：「+」「完全权限」「Computer Use」「模型」——13px 中灰 */
[class*="GRgSLq_row"] { padding: 2px 10px 8px; }
[class*="GRgSLq_select"] {
  font-size: 13px;
  color: var(--wb-text-medium);
}
[class*="GRgSLq_add"] {
  background: transparent;
  color: var(--wb-text-medium);
  border-radius: 8px;
}
[class*="GRgSLq_add"]:hover:not(:disabled) { background: var(--wb-gray-3); }
/* 发送按钮：品牌薄荷绿实心圆，34px（宿主未发布 data-*，按类名兜底） */
[class*="GRgSLq_primary"] {
  background: var(--wb-brand);
  color: #fff;
}
[class*="GRgSLq_primary"]:hover:not(:disabled) { background: var(--wb-brand-7); }
[class*="GRgSLq_primary"]:active:not(:disabled) { background: var(--wb-brand-9); }
[class*="GRgSLq_primary"]:disabled { background: var(--wb-gray-4); color: var(--wb-text-hint); }

/* 占位文字 */
[data-composer-placeholder], textarea::placeholder {
  color: var(--wb-text-hint);
}

/* ============ 5. 工具行与工具卡 ============
   宿主在 ToolRow 根节点发布 data-tool（工具名）+ data-state + data-variant（稳定属性），
   优先用它；hKdVjq_* 前缀仅在没有属性可用时兜底。
   WorkBuddy 工具卡是 8px 圆角、悬停换 4% 黑底，这里只加悬停底，不改结构。 */
[data-tool] {
  border-radius: 6px;
  transition: background-color 0.12s ease;
}
/* 悬停：整个工具行的根（data-tool 的父级）悬浮时给行上淡底 */
[data-tool]:hover {
  background: var(--wb-border-weak);
}
/* 工具展开体（ioCard / terminalBody）：宿主只给了类名，没有 data-*。
   WorkBuddy 用纯白 + 4% 描边，不用淡蓝。 */
[class*="hKdVjq_ioCard"], [class*="hKdVjq_terminalBody"] {
  background: #fff;
  border: 1px solid var(--wb-border-weak);
  border-radius: var(--wb-card-radius);
}
[class*="hKdVjq_badge"] {
  color: var(--wb-brand-9);
  background: var(--wb-brand-1);
  border-radius: 4px;
  padding: 1px 6px;
}

/* ============ 6. 代码块 ============ */
pre, code, kbd {
  font-family: var(--wb-font-mono);
  font-size: var(--wb-fs-code);
}
pre {
  background: var(--wb-gray-1);
  border: 1px solid var(--wb-border-weak);
  border-radius: 6px;
  padding: 12px;
  line-height: 1.5;
}
:not(pre) > code {
  background: var(--wb-gray-3);
  border-radius: 4px;
  padding: 1px 5px;
}

/* ============ 7. 滚动条（WorkBuddy --wb-scrollbar-thumb） ============ */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #0000001f; border-radius: 6px; }
::-webkit-scrollbar-thumb:hover { background: #00000033; }
::-webkit-scrollbar-track { background: transparent; }

/* ============ 8. 焦点与选区 ============ */
::selection { background: var(--wb-brand-2); color: #000; }
:focus-visible { outline: 2px solid var(--wb-brand); outline-offset: 2px; }
`

    function install() {
      if (typeof document === 'undefined') return () => {}
      let el = document.getElementById(ID)
      if (!el) {
        el = document.createElement('style')
        el.id = ID
        document.head.appendChild(el)
      }
      el.textContent = CSS
      probe()
      return () => el.remove()
    }

    /**
     * 宿主兼容性探测（Fail-Closed）。
     * DSH 的侧栏项类名带构建 hash 前缀（SidebarRoot_module_css_default → wtg9ga_*），
     * 宿主升级后前缀可能变化。CSS 里侧栏规则全部挂在 html[data-dsh-wb-sidebar="on"] 上，
     * 探测不到就「整段不生效」，而不是错误地套上别的东西。
     * 探测结果用 MutationObserver 兜住「插件先于侧栏挂载」的时序问题。
     */
    function probe() {
      const root = document.documentElement
      let warned = false
      const check = () => {
        const ok = !!document.querySelector('.wtg9ga_panelRow, .wtg9ga_root')
        if (ok) {
          if (root.getAttribute('data-dsh-wb-sidebar') !== 'on') {
            root.setAttribute('data-dsh-wb-sidebar', 'on')
          }
          if (mo) { mo.disconnect(); mo = null }
          return true
        }
        if (!warned) {
          warned = true
          try {
            console.warn(
              '[dsh-workbuddy-theme] 未找到 DSH 侧栏节点（.wtg9ga_*），' +
              '侧栏定制已跳过；主题配色与字体不受影响。' +
              '若 DSH 已升级，请查看插件是否有新版本。'
            )
          } catch {}
        }
        return false
      }
      if (check()) return
      // 侧栏可能还没挂载：观察 DOM，一旦出现就补上
      let mo = typeof MutationObserver === 'function'
        ? new MutationObserver(() => { if (check()) { mo.disconnect(); mo = null } })
        : null
      if (mo) {
        mo.observe(document.documentElement, { childList: true, subtree: true })
        // 最多观察 10 秒，避免长期占用
        setTimeout(() => { if (mo) { mo.disconnect(); mo = null } }, 10000)
      }
    }

    /** 只依赖 DOM，不需要任何 client 服务，所以 inject 为空、apply 直接在文档上生效。 */
    function apply(ctx) {
      const run = () => install()
      if (ctx && typeof ctx.effect === 'function') {
        try {
          return ctx.effect(run, 'dsh-workbuddy-theme: style injection')
        } catch {
          return run()
        }
      }
      return run()
    }

    exports.apply = apply
    return module.exports
  },
})
