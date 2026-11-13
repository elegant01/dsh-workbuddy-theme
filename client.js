// dsh-workbuddy-theme — 浏览器侧。
//
// 配色与字体走 DSH 官方扩展点 ctx.theme.overrideTokens()：
// 它把令牌写成 <body> 的内联样式，优先级高于任何 <style> 标签，
// 且一个令牌同时给 light / dark 两个值，随用户切配色自动换，
// 插件禁用或 HMR 时整层自动回收。这条路与 dsh-theme-native、
// @hmkk/dsh-appearance、dsh-fonttune 一致。
//
// 结构与细节（侧栏、输入卡、气泡、工具行）仍然只能靠一段自己的 CSS，
// 因为宿主没有为形状留扩展点；这段 CSS 值全部引用上面的令牌，
// 所以它随主题明暗自动切换，不需要第二份。
//
// 取值来自腾讯 WorkBuddy 桌面端 v5.0.2 的 renderer 设计令牌
// （resources/app.asar → /renderer/assets/src-Dml5RbhE.css，1985 个 --wb-* 变量）：
//   品牌 #00c29a；灰阶 #fafafa/#f7f7f7/#f2f2f2/#ebebeb/#e6e6e6；
//   字号刻度 12/13/14/16/18，正文 14px、行高 22px；对话栏 848px（≥1681px 屏 1008px）；
//   用户气泡 12px 圆角 + #f2f2f2；输入框 24px 圆角；工具卡 8px 圆角。
window.__ModuleLoader__.load({
  id: 'dsh-workbuddy-theme',
  factory(require) {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    // React 走模块加载器，不是 cordis 服务 —— 官方设置插件也是 require("react")。
    // 拿不到就退化成「只有配色和字体」，设置行跳过。
    let React = null
    try {
      React = require('react')
    } catch (error) {
      console.info('[dsh-workbuddy-theme] require("react") 失败，设置页入口跳过：', error)
    }

    /** 覆盖层来源标识（同名再调用即整层替换并置顶）。 */
    const SOURCE = 'dsh-workbuddy-theme'
    const STYLE_ID = 'dsh-workbuddy-theme-css'

    /** WorkBuddy 字体栈：中文 UI 字体不随包发布，只声明机器上有的。 */
    const UI_FONT =
      '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    const CODE_FONT =
      '"Cascadia Code", "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "PingFang SC", monospace'

    /** 字体也走 overrideTokens —— 与 dsh-fonttune 同一做法，
     *  这样切主题时它和配色一起被宿主重新发布，不会出现「切走了字体还在」。 */
    const FONT_TOKENS = {
      '--dsw-font-family': { light: UI_FONT, dark: UI_FONT },
      '--ds-font-family-code': { light: CODE_FONT, dark: CODE_FONT },
    }

    /* 自己补偿的语义令牌。
       DSH 的 --dsw-specific-bubble 在浅色指向 deepseek-50、深色指向 neutral-bluish-850，
       两态不是同一种中性色；WorkBuddy 的用户气泡两侧都是中性灰，所以在插件里额外
       定义一个气泡专用令牌，明暗各写死一个值，避免跟着品牌色漂移。
       浅色 #f2f2f2 = WorkBuddy --wb-gray-3；深色 #2c2c2e = 比背景亮一档的深灰。 */
    const SEMANTIC_TOKENS = {
      '--wb-bubble-fill': { light: '#f2f2f2', dark: '#2c2c2e' },
      '--wb-border': { light: '#e6e6e6', dark: '#3a3a3c' },
      /* 预览与令牌校验脚本会引用到它；真实环境里 body 的 font-family 已是 DSH 的
         --dsw-font-family（我们在 FONT_TOKENS 里给了值），这里给一份兜底即可。 */
      '--dsw-font-family': { light: UI_FONT, dark: UI_FONT },
    }

    /* 静态色阶：WorkBuddy 调色板重排后的 DSH --dsw-static-* 全套。
       DSH 的 ~200 个别名令牌全部从这里派生，所以只要重排这一层，
       hover / border / elevation / 语法高亮等派生色自动跟上。
       由 gen_tokens.mjs 生成，勿手改。 */
    const STATIC_TOKENS = {
      "--dsw-static-neutral-bluish-00": { light: "#ffffff", dark: "#ffffff" },
      "--dsw-static-neutral-bluish-50": { light: "#f7f7f7", dark: "#f9fafb" },
      "--dsw-static-neutral-bluish-55": { light: "#f5f5f5", dark: "#f8f9fb" },
      "--dsw-static-neutral-bluish-60": { light: "#f4f4f4", dark: "#f7f8fa" },
      "--dsw-static-neutral-bluish-75": { light: "#f2f2f2", dark: "#f4f5f7" },
      "--dsw-static-neutral-bluish-90": { light: "#efefef", dark: "#f0f2f5" },
      "--dsw-static-neutral-bluish-100": { light: "#f2f2f2", dark: "#eef0f3" },
      "--dsw-static-neutral-bluish-150": { light: "#ebebeb", dark: "#e9ecf2" },
      "--dsw-static-neutral-bluish-200": { light: "#e6e6e6", dark: "#e1e5ee" },
      "--dsw-static-neutral-bluish-300": { light: "#d9d9d9", dark: "#cfd3d6" },
      "--dsw-static-neutral-bluish-310": { light: "#d4d4d4", dark: "#cad2db" },
      "--dsw-static-neutral-bluish-400": { light: "#b3b3b3", dark: "#adb2b8" },
      "--dsw-static-neutral-bluish-500": { light: "#8c8c8c", dark: "#979da6" },
      "--dsw-static-neutral-bluish-600": { light: "#737373", dark: "#81858c" },
      "--dsw-static-neutral-bluish-700": { light: "#595959", dark: "#61666b" },
      "--dsw-static-neutral-bluish-750": { light: "#4a4a4a", dark: "#46484c" },
      "--dsw-static-neutral-bluish-800": { light: "#3d3d3d", dark: "#36383b" },
      "--dsw-static-neutral-bluish-850": { light: "#333333", dark: "#2b2c2e" },
      "--dsw-static-neutral-bluish-875": { light: "#2b2b2b", dark: "#232426" },
      "--dsw-static-neutral-bluish-900": { light: "#242424", dark: "#1c1c1e" },
      "--dsw-static-neutral-bluish-950": { light: "#141414", dark: "#161617" },
      "--dsw-static-neutral-bluish-1000": { light: "#000000", dark: "#0f1115" },
      "--dsw-static-neutral-00": { light: "#ffffff", dark: "#ffffff" },
      "--dsw-static-neutral-50": { light: "#fafafa", dark: "#fafafa" },
      "--dsw-static-neutral-100": { light: "#f5f5f5", dark: "#f5f5f5" },
      "--dsw-static-neutral-150": { light: "#ededed", dark: "#ededed" },
      "--dsw-static-neutral-200": { light: "#e5e5e5", dark: "#e5e5e5" },
      "--dsw-static-neutral-250": { light: "#dcdcdc", dark: "#dcdcdc" },
      "--dsw-static-neutral-300": { light: "#d4d4d4", dark: "#d4d4d4" },
      "--dsw-static-neutral-400": { light: "#a3a3a3", dark: "#a3a3a3" },
      "--dsw-static-neutral-500": { light: "#7f7f7f", dark: "#8c8c8c" },
      "--dsw-static-neutral-550": { light: "#6b6b6b", dark: "#6b6b6b" },
      "--dsw-static-neutral-600": { light: "#545454", dark: "#545454" },
      "--dsw-static-neutral-700": { light: "#3c3c3c", dark: "#3c3c3c" },
      "--dsw-static-neutral-800": { light: "#292929", dark: "#292929" },
      "--dsw-static-neutral-850": { light: "#212121", dark: "#212121" },
      "--dsw-static-neutral-900": { light: "#0f0f0f", dark: "#181818" },
      "--dsw-static-neutral-1000": { light: "#000000", dark: "#0f0f0f" },
      "--dsw-static-amber-100": { light: "#ffecd9", dark: "#3a2f1f" },
      "--dsw-static-amber-400": { light: "#f9b35b", dark: "#c48b31" },
      "--dsw-static-amber-500": { light: "#f59e0b", dark: "#f7ad31" },
      "--dsw-static-amber-600": { light: "#c57e07", dark: "#da982a" },
      "--dsw-static-amber-900": { light: "#442901", dark: "#875d16" },
      "--dsw-static-blue-50": { light: "#ecf3ff", dark: "#1d2127" },
      "--dsw-static-blue-50p": { light: "#e0e6f2", dark: "#24282e" },
      "--dsw-static-blue-75": { light: "#e3ecff", dark: "#222731" },
      "--dsw-static-blue-100": { light: "#dae6ff", dark: "#262e3c" },
      "--dsw-static-blue-300": { light: "#93b3fc", dark: "#4e6898" },
      "--dsw-static-blue-400": { light: "#7099f8", dark: "#6488ca" },
      "--dsw-static-blue-450": { light: "#5f8bf6", dark: "#6f98e4" },
      "--dsw-static-blue-500": { light: "#4f7df3", dark: "#7aa9ff" },
      "--dsw-static-blue-600": { light: "#3e63c4", dark: "#6b95e1" },
      "--dsw-static-blue-800": { light: "#1e346c", dark: "#4e6da8" },
      "--dsw-static-blue-900": { light: "#101e44", dark: "#405b8c" },
      "--dsw-static-blue-950": { light: "#091431", dark: "#39527f" },
      "--dsw-static-deepseek-50": { light: "#edf9f5", dark: "#1b2421" },
      "--dsw-static-deepseek-100": { light: "#dbf3ea", dark: "#21352f" },
      "--dsw-static-deepseek-200": { light: "#b6e7d6", dark: "#2a594c" },
      "--dsw-static-deepseek-300": { light: "#8edbc1", dark: "#30806c" },
      "--dsw-static-deepseek-400": { light: "#60cfae", dark: "#31a98d" },
      "--dsw-static-deepseek-450": { light: "#42c8a4", dark: "#30be9e" },
      "--dsw-static-deepseek-500": { light: "#00c29a", dark: "#2dd4b0" },
      "--dsw-static-deepseek-600": { light: "#009c7b", dark: "#26bb9b" },
      "--dsw-static-deepseek-700-delete": { light: "#00775e", dark: "#20a286" },
      "--dsw-static-deepseek-800": { light: "#005542", dark: "#1a8a72" },
      "--dsw-static-deepseek-900": { light: "#003427", dark: "#14735f" },
      "--dsw-static-green-100": { light: "#d9eddc", dark: "#233427" },
      "--dsw-static-green-400": { light: "#64b676", dark: "#45a767" },
      "--dsw-static-green-500": { light: "#31a354", dark: "#4ed17e" },
      "--dsw-static-green-500-a08": { light: "#31a35414", dark: "#4ed17e14" },
      "--dsw-static-green-500-a12": { light: "#31a3541f", dark: "#4ed17e1f" },
      "--dsw-static-green-900": { light: "#062a11", dark: "#277242" },
      "--dsw-static-red-50": { light: "#ffece9", dark: "#271b1a" },
      "--dsw-static-red-100": { light: "#ffd9d3", dark: "#3b2221" },
      "--dsw-static-red-400": { light: "#f75d4f", dark: "#bf4948" },
      "--dsw-static-red-400-a12": { light: "#f75d4f1f", dark: "#bf49481f" },
      "--dsw-static-red-500": { light: "#ec1313", dark: "#f05555" },
      "--dsw-static-red-600": { light: "#be0d0d", dark: "#d44a4a" },
      "--dsw-static-red-600-a08": { light: "#be0d0d14", dark: "#d44a4a14" },
      "--dsw-static-red-900": { light: "#420101", dark: "#832b2b" },
      "--dsw-static-violet-400": { light: "#9185ff", dark: "#8671c6" },
      "--dsw-static-violet-600": { light: "#624dce", dark: "#937add" },
  }

    /* 结构定制 CSS。
       原则：只引用令牌（--dsw-alias-* / --wb-*），不写死颜色，
       所以同一段 CSS 在浅色和深色下都对。
       选择器优先用宿主发布的 data-* 属性（稳定契约），
       类名 hash 只作兜底。 */
    const CSS = `
[data-dsh-wb] {
  --wb-radius: 12px;
  --wb-input-radius: 24px;
  --wb-fs-body: var(--dsh-content-font-size, 14px);
  --wb-lh-body: calc(22px + var(--dsh-content-font-delta, 0px));
}

/* ============ 1. 对话区正文 ============ */
[class*="_markdown_"] { letter-spacing: 0.1px; }

/* 用户消息气泡：data-message-bubble 由 UserMessageBubble 发布（稳定属性），
   ._bubble_1sgyj_1 是全局样式类名，仅作兜底。
   WorkBuddy 的气泡是**中性灰**，不是品牌色的浅色版 —— 所以这里不直接用
   --dsw-specific-bubble（它浅色指向 deepseek-50，会跟着变薄荷绿），
   而是明暗各取一个中性档：浅色 gray-3 / 深色深灰。 */
[data-dsh-wb] [data-message-bubble],
[data-dsh-wb] ._bubble_1sgyj_1 {
  background: var(--wb-bubble-fill);
  border-radius: var(--wb-radius);
  padding: 10px 14px;
  color: var(--dsw-alias-label-primary);
}

/* ============ 2. 输入卡 ============
   DSH 输入卡本身无 border，视觉框来自 --dsw-elevation-stroke（内容盒内 .5px）
   + --dsw-elevation-soft 柔光。WorkBuddy 是单层 1px 实边、不外发光、聚焦不改描边，
   所以只换 box-shadow，不引入 border。描边色用 border-l2，深浅两态都成立。 */
[data-dsh-wb] [data-composer-card] {
  border: 0;
  border-radius: var(--wb-input-radius);
  box-shadow: 0 0 0 1px var(--dsw-alias-border-l3), 0 2px 4px -4px rgb(0 0 0 / 6%);
  transition: box-shadow 0.18s ease;
}
[data-dsh-wb] [data-composer-card]:focus-within {
  box-shadow: 0 0 0 1px var(--dsw-alias-border-l3), 0 2px 4px -4px rgb(0 0 0 / 6%);
}
[data-dsh-wb] [data-composer-input] {
  font-size: var(--wb-fs-body);
  line-height: var(--wb-lh-body);
  color: var(--dsw-alias-label-primary);
  caret-color: var(--dsw-static-deepseek-500);
}
[data-dsh-wb] [data-composer-placeholder],
[data-dsh-wb] textarea::placeholder {
  color: var(--dsw-alias-label-caption);
}
[data-dsh-wb] [class*="GRgSLq_row"] { padding: 2px 10px 8px; }
[data-dsh-wb] [class*="GRgSLq_select"] {
  font-size: 13px;
  color: var(--dsw-alias-label-secondary);
}
[data-dsh-wb] [class*="GRgSLq_add"] { border-radius: 8px; }
/* 发送按钮：宿主 .GRgSLq_primary 已有 34px 圆形 + --dsw-alias-button-info-fill
   底色（我们把这档令牌改成了品牌绿），这里只补宿主没写的 hover 档与禁用态。
   注意不要重写 background 简写，否则会覆盖宿主自己的状态切换。 */
[data-dsh-wb] [class*="GRgSLq_primary"]:hover:not(:disabled) {
  background-color: var(--dsw-alias-button-info-hover);
  color: #fff;
}
[data-dsh-wb] [class*="GRgSLq_primary"]:disabled {
  background-color: var(--dsw-static-neutral-bluish-150);
  color: var(--dsw-alias-label-tertiary);
}
/* 输入卡左下角的「+」：WorkBuddy 是 8px 圆角、无边框、悬停淡灰 */
[data-dsh-wb] [class*="GRgSLq_add"] {
  border-radius: 8px;
  color: var(--dsw-alias-label-secondary);
}
[data-dsh-wb] [class*="GRgSLq_add"]:hover {
  background-color: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}

/* ============ 3. 工具行 ============
   data-tool 由 ToolRow 根节点发布（值=工具名），data-state / data-variant 同节点。
   WorkBuddy 工具卡 8px 圆角、悬停 4% 黑底。 */
[data-dsh-wb] [data-tool] {
  border-radius: 6px;
  transition: background-color 0.16s ease;
}
[data-dsh-wb] [data-tool]:hover { background-color: var(--dsw-alias-interactive-bg-hover); }
[data-dsh-wb] [class*="hKdVjq_ioCard"],
[data-dsh-wb] [class*="hKdVjq_terminalBody"] {
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
}

/* ============ 4. 侧栏 ============
   宿主侧栏类名（SidebarRoot_module_css_default）没有 data-* 属性，
   只能按 .wtg9ga_* 精确命中；命中失败时整个区块不生效（见 probe()），
   不会把半套规则留在页面上。 */
[data-dsh-wb] .wtg9ga_root { padding: 6px 8px; }
[data-dsh-wb] .wtg9ga_panelRow {
  min-height: 40px;
  border-radius: 8px;
  padding: 9px 8px;
  font-size: 14px;
  line-height: 22px;
  font-weight: 400;
  color: var(--dsw-alias-label-primary);
}
[data-dsh-wb] .wtg9ga_panelRow:hover { background-color: var(--dsw-alias-interactive-bg-hover); }
[data-dsh-wb] .wtg9ga_panelRow.wtg9ga_panelActive,
[data-dsh-wb] .wtg9ga_panelRow[aria-expanded="true"] {
  background-color: var(--dsw-alias-interactive-bg-active);
  color: var(--dsw-alias-label-primary);
}

/* ============ 5. 代码块 ============ */
[data-dsh-wb] [class*="_markdown_"] pre { border-radius: 8px; }

/* ============ 6. 正文排版 ============ */
/* WorkBuddy 正文行高 22px（DSH 是 24px），段间距 12px（DSH 16px），
   整体更紧凑。用 --dsh-content-font-delta 联动设置里的字号调节。 */
[data-dsh-wb] [class*="_markdown_"] {
  letter-spacing: 0;
}
[data-dsh-wb] [class*="_markdown_"] p {
  margin: 12px 0;
}
[data-dsh-wb] [class*="_markdown_"] :where(h1, h2, h3) {
  margin: 24px 0 12px;
}
[data-dsh-wb] [class*="_markdown_"] :where(h4, h5, h6) {
  margin: 16px 0 8px;
}

/* ============ 7. 行内代码 ============
   DSH 默认是「。5px 边框 + 浅底方块」，WorkBuddy 是无边框、只靠底色区分，
   圆角 4px。去掉边框让它更像文字而不是控件。 */
[data-dsh-wb] [class*="_markdown_"] :not(pre) > code {
  border: 0;
  border-radius: 4px;
  padding: 1px 5px;
  background-color: var(--dsw-alias-markdown-inline-code);
  font-size: .857em;
}

/* ============ 8. 代码块 ============
   全部走宿主自己的 --dsl-code-block-* 变量，不改类名。
   WorkBuddy 的代码块：8px 圆角、标题栏与正文同底色但有一条分隔线、
   标题栏 12px、正文 13px/22px。 */
[data-dsh-wb] [class*="_block_7gxqk"] {
  --dsl-code-block-border-radius: 8px;
  --dsl-code-block-banner-font: 12px/20px var(--dsw-font-family);
}
[data-dsh-wb] [class*="_block_7gxqk"] [class*="_banner_7gxqk"] {
  padding: 8px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
[data-dsh-wb] [class*="_block_7gxqk"] [class*="_infostring_7gxqk"] {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
[data-dsh-wb] [class*="_block_7gxqk"] pre {
  padding: 14px 16px;
  font-size: 13px;
  line-height: 22px;
}

/* ============ 9. 引用块 ============
   WorkBuddy 用 3px 品牌色淡线（不是灰），文字降一档。 */
[data-dsh-wb] [class*="_markdown_"] blockquote {
  border-left: 3px solid var(--dsw-static-neutral-bluish-200);
  padding: 2px 0 2px 14px;
  margin: 16px 0;
  color: var(--dsw-alias-label-secondary);
}
[data-dsh-wb] [class*="_markdown_"] blockquote p:first-child { margin-top: 0; }
[data-dsh-wb] [class*="_markdown_"] blockquote p:last-child { margin-bottom: 0; }

/* ============ 10. 表格 ============
   DSH 默认无外框。WorkBuddy 是「圆角外框 + 表头淡底 + 行分隔线」。 */
[data-dsh-wb] [class*="_tableScroll_rve47"] {
  margin: 16px 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  overflow: hidden;
}
[data-dsh-wb] [class*="_tableScroll_rve47"] table {
  border-collapse: separate;
  border-spacing: 0;
}
[data-dsh-wb] [class*="_tableScroll_rve47"] th {
  background-color: var(--dsw-static-neutral-bluish-50);
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  padding: 10px 14px;
}
[data-dsh-wb] [class*="_tableScroll_rve47"] td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
[data-dsh-wb] [class*="_tableScroll_rve47"] tr:last-child td { border-bottom: 0; }
[data-dsh-wb] [class*="_tableScroll_rve47"] th:first-child,
[data-dsh-wb] [class*="_tableScroll_rve47"] td:first-child { padding-left: 14px; }
[data-dsh-wb] [class*="_tableScroll_rve47"] td:last-child { padding-right: 14px; }

/* ============ 11. 列表 ============
   WorkBuddy 项目符号是中性灰小圆点，行间距 6px。 */
[data-dsh-wb] [class*="_markdown_"] :where(ul, ol) { margin: 12px 0; padding-left: 20px; }
[data-dsh-wb] [class*="_markdown_"] li::marker { color: var(--dsw-alias-label-tertiary); }

/* ============ 12. 分隔线 ============ */
[data-dsh-wb] [class*="_markdown_"] hr {
  margin: 24px 0;
  height: 1px;
  background: var(--dsw-alias-border-l2);
}

/* ============ 13. 工具卡展开态 ============
   WorkBuddy 展开体的标题是 14px，内容 13px/22px，内边距 12px 16px。 */
[data-dsh-wb] [class*="hKdVjq_ioCard"] > *:first-child,
[data-dsh-wb] [class*="hKdVjq_terminalBody"] > *:first-child {
  font-size: 14px;
}

/* ============ 14. 滚动条 ============
   WorkBuddy 滚动条很细、无轨道底、悬停才明显。 */
[data-dsh-wb] ::-webkit-scrollbar { width: 8px; height: 8px; }
[data-dsh-wb] ::-webkit-scrollbar-track { background: transparent; }
[data-dsh-wb] ::-webkit-scrollbar-thumb {
  background-color: var(--dsw-alias-scrollbar-bg-l1);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}
[data-dsh-wb] ::-webkit-scrollbar-thumb:hover {
  background-color: var(--dsw-alias-scrollbar-hover-l1);
}

/* ============ 15. 选中文字 ============
   默认是系统蓝，改成品牌色 20% 透明。 */
[data-dsh-wb] ::selection {
  background-color: rgb(0 194 154 / 20%);
  color: var(--dsw-alias-label-primary);
}

/* ============ 16. 链接 ============
   WorkBuddy 链接是品牌深绿 #009273，无下划线，悬停才加虚线。 */
[data-dsh-wb] [class*="_markdown_"] a {
  color: var(--dsw-alias-link);
  text-decoration: none;
}
[data-dsh-wb] [class*="_markdown_"] a:hover {
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}
`

    /* ---------------- 应用与回收 ---------------- */

    /** 各 effect 的清理函数。模块级，热重载时先清上一轮，避免叠加。 */
    let dispose = []

    function track(fn) {
      if (typeof fn === 'function') dispose.push(fn)
    }

    function teardown() {
      for (const fn of dispose.reverse()) {
        try { fn() } catch (error) { console.warn('[dsh-workbuddy-theme] cleanup failed', error) }
      }
      dispose = []
    }

    /** 装 CSS。返回清理函数。 */
    function installStyle() {
      const existing = document.getElementById(STYLE_ID)
      if (existing !== null) existing.remove()
      const tag = document.createElement('style')
      tag.id = STYLE_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => {
        const node = document.getElementById(STYLE_ID)
        if (node !== null) node.remove()
      }
    }

    /**
     * 侧栏探测：.wtg9ga_* 命中才给 <html> 挂 data-dsh-wb，否则整个结构层不生效。
     * 这样 DSH 升级改名时，最坏结果是「只剩配色和字体」，而不是留下半套错位样式。
     */
    function probe() {
      const root = document.documentElement
      /** @type {MutationObserver | null} */
      let observer = null

      const stop = () => {
        if (observer !== null) {
          observer.disconnect()
          observer = null
        }
      }

      const check = () => {
        if (document.querySelector('.wtg9ga_panelRow, .wtg9ga_root') === null) return false
        root.setAttribute('data-dsh-wb', '')
        stop()
        return true
      }

      if (check()) return stop

      if (typeof MutationObserver === 'function') {
        const current = new MutationObserver(() => { check() })
        observer = current
        current.observe(root, { childList: true, subtree: true })
        // 侧栏 10 秒内没出现就不再等（超长会话仍在首次渲染时，交给热重载重试）
        setTimeout(stop, 10000)
      }

      console.info(
        '[dsh-workbuddy-theme] 尚未找到 DSH 侧栏节点（.wtg9ga_*）。' +
        '配色与字体会立即生效，侧栏与输入卡的结构细节等侧栏挂载后再启用；' +
        '若长时间无效，说明 DSH 已升级，请查看插件是否有新版本。',
      )

      return stop
    }

    /* ---------------- 设置页入口 ----------------
       宿主把「外观」写成一张写死三块的卡片（dsh-client-ui-theme 的 CUBES 里只有
       light / dark / system），注册进主题表的新 id 不会自动长出来。
       所以这里注册自己的一行 settings.general.item，order 9.5 —— 排在
       appearance(10) 之前紧挨着，视觉上就是外观页多出来的那一块。
       走 slot 注册而不是手塞 DOM：宿主重渲染时由 React 自己保住节点。 */

    const ROW_ID = 'workbuddy-theme'
    const LABEL = 'WorkBuddy 主题'
    const ENABLED_KEY = 'dsh-workbuddy-theme:enabled'

    /** 开关存 localStorage —— 与 dsh-theme-native 的 codex-theme:enabled 同一做法。
     *  不用 configForms：那需要宿主侧声明 schema，而本插件宿主端是故意空的。 */
    function isEnabled() {
      try {
        return localStorage.getItem(ENABLED_KEY) !== '0'
      } catch {
        return true
      }
    }

    function writeEnabled(next) {
      try {
        if (next) localStorage.removeItem(ENABLED_KEY)
        else localStorage.setItem(ENABLED_KEY, '0')
      } catch { /* 隐私模式写不了，忽略 */ }
    }

    const CUBE_ICON = '<svg data-icon="dsh-wb-sparkle" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
      + '<path d="M8 1.5 9.4 6 14 7.4 9.4 8.9 8 13.4 6.6 8.9 2 7.4 6.6 6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>'
      + '<path d="M12.8 11.2l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>'
      + '</svg>'

    /** apply() 每次挂载时把开关函数写到 .call 上，行组件用它。
     *  用对象包一层是因为 apply 可能被重载，组件自身 instance 不变。 */
    const ON_SWITCH = { call: () => {} }

    /** 组件自包含：不用 store、不用 inject，开关状态只在自己 useState 里。
     *  宿主的 slot 机制对 store / inject 的约定很细（store 必须带 .actions、
     *  inject 只收位置参数），任一条不满足整行会被错误边界吞成一个空 div。
     *  这里只依赖 React 本身和 localStorage，最坏情况也只是「点了没反应」。 */
    function makeRow(React) {
      const h = React.createElement

      const cubeStyle = (selected) => ({
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '20px 32px',
        minWidth: 180,
        font: 'inherit',
        fontSize: 14,
        lineHeight: '22px',
        color: 'var(--dsw-alias-label-primary)',
        cursor: 'pointer',
        background: selected ? 'var(--dsw-alias-bg-module-platform)' : 'transparent',
        border: '.5px solid ' + (selected ? 'var(--dsw-alias-state-business-primary)' : 'var(--dsw-alias-border-l4)'),
        borderRadius: 'var(--dsw-radius-xl)',
      })

      return function WorkBuddyRow() {
        const [active, setActive] = React.useState(isEnabled)

        const toggle = () => {
          const next = !isEnabled()
          try {
            ON_SWITCH.call(next)
          } catch (error) {
            console.warn('[dsh-workbuddy-theme] 切换主题失败：', error)
          }
          setActive(next)
        }

        return h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '16px 0',
            borderBottom: '.5px solid var(--dsw-alias-border-l2)',
          },
        },
          h('div', { style: { fontSize: 14, lineHeight: '22px', color: 'var(--dsw-alias-label-primary)' } }, LABEL),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8 } },
            h('button', {
              type: 'button',
              className: 'dsh-wb-cube',
              'aria-pressed': active ? 'true' : 'false',
              style: cubeStyle(active),
              onClick: toggle,
            },
              h('span', { style: { display: 'flex' }, dangerouslySetInnerHTML: { __html: CUBE_ICON } }),
              h('span', null, 'WorkBuddy'),
            ),
          ),
          h('div', { style: { fontSize: 12, lineHeight: '20px', color: 'var(--dsw-alias-label-tertiary)' } },
            active
              ? '当前生效：配色、字体与对话区排版均来自 WorkBuddy 的设计令牌。'
              : '启用后使用 WorkBuddy 的配色与字体；随时可切回浅色 / 深色 / 跟随系统。'),
        )
      }
    }

    /** 结构层：装 CSS + 探测侧栏。返回清理函数。 */
    function installStructure() {
      const removeStyle = installStyle()
      const stopProbe = probe()
      return () => {
        stopProbe()
        removeStyle()
        document.documentElement.removeAttribute('data-dsh-wb')
      }
    }

    /** ---------------- 插件入口 ---------------- */

    function apply(ctx) {
      teardown()

      const theme = ctx.get('theme')
      if (theme === null || theme === undefined || typeof theme.overrideTokens !== 'function') {
        console.warn('[dsh-workbuddy-theme] 宿主没有提供 theme 服务，主题未启用')
        return teardown
      }

      // 令牌负载：WorkBuddy 静态色阶 + 字体栈 + 插件自用的语义色，全部明暗成对。
      const tokens = {}
      for (const [name, pair] of Object.entries(STATIC_TOKENS)) tokens[name] = { light: pair.light, dark: pair.dark }
      for (const [name, pair] of Object.entries(FONT_TOKENS)) tokens[name] = { light: pair.light, dark: pair.dark }
      for (const [name, pair] of Object.entries(SEMANTIC_TOKENS)) tokens[name] = { light: pair.light, dark: pair.dark }

      // 1+2. 两层效果：
      //   令牌层 —— 配色与字体，宿主写成 body 内联样式，随明暗自动切；
      //   结构层 —— 自己的 CSS，只管侧栏 / 输入卡 / 气泡 / 工具行的形状。
      //   开关关掉时两层都撤，页面立即回到 DSH 原样。
      // 用对象持有两个句柄：setWorkbuddy 重建两层后句柄会更新，
      // 而 track 出去的清理函数通过闭包读的是对象的最新值，
      // 不会像捕获变量那样指向已经失效的旧函数。
      const handles = { tokens: () => {}, structure: () => {} }

      /** 设置页开关的落点：apply 每次挂载时把当前实例的切换函数挂到这里，
       *  行组件通过 ON_SWITCH 拿到它 —— 避免把闭包塞进组件 props。 */
      ON_SWITCH.call = (next) => {
        writeEnabled(next)
        handles.structure()
        handles.tokens()
        handles.structure = () => {}
        handles.tokens = () => {}
        applyTheme()
      }

      const applyTheme = () => {
        if (!isEnabled()) return
        handles.tokens = theme.overrideTokens(SOURCE, tokens)
        handles.structure = installStructure()
      }

      track(() => handles.structure())
      track(() => handles.tokens())
      applyTheme()

      // 3. 设置页那一行：用 enabled 决定是否叠加令牌层，而不是靠点主题。
      //    宿主的主题偏好只认 light / dark / system，
      //    注册自定义 id 既不会长进外观卡片、也不会被持久化，
      //    所以开关握在我们自己的配置里。
      const slots = ctx.get('slots')
      const note = (msg) => console.info('[dsh-workbuddy-theme] ' + msg)

      // 上一版留下的常驻黑框，清掉。
      try {
        const stale = document.getElementById('dsh-wb-diag')
        if (stale !== null && stale !== undefined) stale.remove()
      } catch { /* 忽略 */ }

      const registerRow = () => {
        // slot 的声明晚于本插件 apply 时，直接 register 会抛
        // `slot "settings.general.item" is not declared`。inject 会等声明出现再回调，
        // 是唯一正确的姿势 —— 声明来了才注册，声明塌了自动撤。
        const off = slots.inject('settings.general.item', () => slots.register({
          name: 'settings.general.item',
          id: ROW_ID,
          order: 9.5,
          label: LABEL,
        }, makeRow(React)))
        note('设置行已挂到 settings.general.item')
        return off
      }

      if (React === null || React === undefined || slots === null || slots === undefined) {
        note('宿主未提供 slots/react，设置页入口跳过（主题仍然生效）')
        return teardown
      }

      track(registerRow())

      // 把本轮的全部清理登记交给宿主：插件被卸载 / 禁用 / 热重载时，
      // cordis 会调用 apply 的返回值。没有这一句，令牌层与结构 CSS 就会
      // 留在页面上撤不掉 —— 这正是「切走再切回来不对」的根源之一。
      return teardown
    }

    // 只声明真正用到的服务。少一项会排队等它出现（整个插件 pending），
    // 多一项不存在同样会 pending —— 宁可退化成「只有配色」，也不能拖住宿主启动。
    exports.inject = ['theme', 'slots']
    exports.apply = apply
    return module.exports
  },
})
