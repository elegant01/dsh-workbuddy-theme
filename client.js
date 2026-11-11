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
}

body, button, input, textarea, select {
  font-family: var(--wb-font-ui);
  -webkit-font-smoothing: antialiased;
}

/* DSH 侧栏真实类名（SidebarRoot_module_css_default，前缀 wtg9ga）—— 上面那些
   [class*="sidebar"] 模糊匹配在 DSH 里一个都匹配不到（类名里根本没有 sidebar 字样），
   所以侧栏一直没变色。这里按真实类名精确覆盖。 */
.wtg9ga_root {
  background: var(--wb-gray-2);
  padding: 6px 8px;
}
/* 导航项：WorkBuddy 高 40px、8px 圆角、左右 8px 内边距、14px/22px、字重 400 */
.wtg9ga_panelRow {
  min-height: 40px;
  border-radius: 8px;
  padding: 9px 8px;
  border-inline: 0;
  font-size: 14px;
  line-height: 22px;
  font-weight: 400;
  color: #000;
}
.wtg9ga_panelRow:hover { background-color: var(--wb-gray-4); }
/* 选中态：WorkBuddy 用灰阶（gray-4），不用品牌绿 */
.wtg9ga_panelRow.wtg9ga_panelActive,
.wtg9ga_panelRow[aria-expanded="true"] { background-color: var(--wb-gray-4); color: #000; }
.wtg9ga_panelRow:focus-visible { outline-color: var(--wb-brand); outline-offset: -2px; }

/* 会话列表项（另一处：会话条目用 aria-current / data-active 标记） */
.wtg9ga_regionArea [class*="conversation"] [aria-current="true"],
.wtg9ga_regionArea [role="treeitem"][aria-selected="true"] {
  background: var(--wb-gray-4);
  border-radius: 8px;
}
/* ============ 2. 侧栏（WorkBuddy --wb-sidebar-bg / --wb-sidebar-border） ============
   注意：下面这几条 [class*="sidebar"] 模糊匹配在 DSH 里【完全不命中】——
   DSH 侧栏真实类名是 wtg9ga_*（SidebarRoot_module_css_default），不含 sidebar 字样。
   保留它们只是为了万一 DSH 改了类名约定后能兜底，真正生效的是上面的 .wtg9ga_*。 */
[class*="sidebar"], [class*="Sidebar"], nav[class*="nav"], [class*="sessionList"] {
  --wb-sidebar-bg: var(--wb-gray-2);
  --wb-sidebar-border: var(--wb-gray-4);
}

[class*="sidebar"], [class*="Sidebar"] {
  background: var(--wb-gray-2);
  border-right: 1px solid var(--wb-gray-4);
}

/* 会话项：WorkBuddy .im-conversation-item —— 8px 圆角、40px 高、8px 内边距、14px/22px 正文 */
[class*="sidebar"] [class*="item"], [class*="sidebar"] [class*="row"],
[class*="sessionList"] [class*="item"], [class*="sessionList"] [class*="row"] {
  border-radius: 8px;
  min-height: 36px;
  font-size: var(--wb-fs-body);
  line-height: var(--wb-lh-body);
  font-weight: 400;
  color: var(--wb-text-strong);
  transition: background-color 0.16s ease;
}

[class*="sidebar"] [class*="item"]:hover, [class*="sidebar"] [class*="row"]:hover,
[class*="sessionList"] [class*="item"]:hover, [class*="sessionList"] [class*="row"]:hover {
  background: var(--wb-gray-4);
}

/* 选中态：WorkBuddy 用 gray-5，不用品牌色块 */
[class*="sidebar"] [class*="item"][aria-current],
[class*="sidebar"] [class*="item"][data-active="true"],
[class*="sidebar"] [class*="item"][class*="active"],
[class*="sessionList"] [class*="item"][aria-current] {
  background: var(--wb-gray-4);
  font-weight: 500;
}

/* 侧栏分区小标题：WorkBuddy 12px/一致 tertiary 色 */
[class*="sidebar"] [class*="groupTitle"], [class*="sidebar"] [class*="sectionTitle"],
[class*="sidebar"] [class*="header"] {
  font-size: var(--wb-fs-small);
  color: var(--wb-text-weak);
  font-weight: 500;
  letter-spacing: 0.2px;
}

/* ============ 3. 对话区 ============ */
.prose, .markdown-body, [class*="messageContent"], [class*="markdown"] {
  font-size: var(--wb-fs-body);
  line-height: var(--wb-lh-body);
  letter-spacing: 0.1px;
  color: var(--wb-text-strong);
}

[class*="chatContainer"], [class*="messagesContainer"], [class*="conversation"] > div {
  max-width: var(--wb-chat-max);
  margin-left: auto;
  margin-right: auto;
}
@media (min-width: 1681px) {
  :root { --wb-chat-max: 1008px; }
}

/* 用户消息气泡（来源：dsh-web-frontend 全局样式 ./_bubble_1sgyj_1 规则）：DSH 全局 _bubble_1sgyj_1 是 --dsw-specific-bubble(淡蓝 #f0f6ff) + 20px 圆角，
   WorkBuddy 用户消息是 12px 圆角 + gray-3 #f2f2f2。 */
._bubble_1sgyj_1 {
  background: var(--wb-gray-3);
  border-radius: var(--wb-radius);
  padding: 10px 14px;
  color: var(--wb-text-strong);
}
/* 助手消息：无框无底色，纯留白（WorkBuddy 原样） */

/* ============ 4. 输入框 ============
   来源：@deepseek-ai/dsh-client-ui-conversation → InputBar_module_css_default（前缀 GRgSLq）。
   DSH 升级后类名前缀可能变化，届时按「组件名 InputBar → 新前缀」重新对一遍]。
   DSH 的输入卡是 .GRgSLq_card（InputBar 模块），它本来没有 border，
   视觉框来自 --dsw-elevation-stroke = 0 0 0 .5px 描边（内容盒内侧），
   加上 --dsw-elevation-soft 的柔光。WorkBuddy .wb-cb-chat.light 是
   单层 1px 实边、不向外发光、聚焦不改描边，所以这里只换 box-shadow。 */
[class*="GRgSLq_card"] {
  background: #fff;
  border: 0;
  border-radius: var(--wb-input-radius);
  box-shadow: 0 0 0 1px var(--wb-gray-5), 0 2px 4px -4px #0000000f;
  transition: box-shadow 0.18s ease;
}
[class*="GRgSLq_card"]:focus-within {
  box-shadow: 0 0 0 1px var(--wb-gray-5), 0 2px 4px -4px #0000000f;
}
/* 占位文字与输入行 */
[class*="GRgSLq_input"] {
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
/* 发送按钮：品牌薄荷绿实心圆，34px */
[class*="GRgSLq_primary"] {
  background: var(--wb-brand);
  color: #fff;
}
[class*="GRgSLq_primary"]:hover:not(:disabled) { background: var(--wb-brand-7); }
[class*="GRgSLq_primary"]:active:not(:disabled) { background: var(--wb-brand-9); }
[class*="GRgSLq_primary"]:disabled { background: var(--wb-gray-4); color: var(--wb-text-hint); }

[class*="composer"] textarea, [class*="inputArea"] textarea {
  font-size: var(--wb-fs-body);
  line-height: var(--wb-lh-body);
  background: transparent;
  border: none;
  resize: none;
}
[class*="composer"] ::placeholder, [class*="inputArea"] ::placeholder,
textarea::placeholder {
  color: var(--wb-text-hint);
}

/* 发送按钮：品牌色实心圆角 */
[class*="sendButton"], [class*="sendBtn"], button[class*="submit"] {
  background: var(--wb-brand);
  color: #fff;
  border: none;
  border-radius: 9999px;
  transition: background-color 0.16s ease, transform 0.1s ease;
}
[class*="sendButton"]:hover, [class*="sendBtn"]:hover, button[class*="submit"]:hover {
  background: var(--wb-brand-7);
}
[class*="sendButton"]:active, [class*="sendBtn"]:active {
  background: var(--wb-brand-9);
  transform: scale(0.97);
}
[class*="sendButton"]:disabled, [class*="sendBtn"]:disabled {
  background: var(--wb-gray-4);
  color: var(--wb-text-hint);
}

/* ============ 5. 工具行与工具卡 ============
   DSH 的执行行 .hKdVjq_row 无底色、13px 三分灰；WorkBuddy 工具卡是 8px 圆角、
   图标行 16px20px 盒、悬停换 4% 黑底。这里只加悬停底和图标间距，不改结构。 */
[class*="hKdVjq_row"] {
  border-radius: 6px;
  transition: background-color 0.12s ease;
}
[class*="hKdVjq_root"]:has(> [class*="hKdVjq_row"]:hover) [class*="hKdVjq_row"] {
  background: var(--wb-border-weak);
}
/* 工具展开体（ioCard / terminalBody）：WorkBuddy 用纯白 + 4% 描边，不用淡蓝 */
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
      return () => el.remove()
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
