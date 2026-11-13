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

    /** WorkBuddy 的品牌绿。只在「交互色」上用：按钮、开关、选中、光标。 */
    const BRAND = { light: '#00c29a', dark: '#2dd4b0' }
    const BRAND_HOVER = { light: '#40d1b3', dark: '#4fe0c0' }

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
      /* 开关轨道、复选框、发送按钮、光标全部走 --dsw-alias-brand-primary，
         而它指向 neutral-bluish-1000。那个档位必须是「正文色」（深灰），不能是品牌绿，
         否则整个界面的交互色会一起变绿、并且正文也就没了层次。
         这里把交互色单独拆出来，供第 18 节的自绘控件使用。 */
      '--wb-control-on': { light: BRAND.light, dark: BRAND.dark },
      '--wb-control-on-hover': { light: BRAND_HOVER.light, dark: BRAND_HOVER.dark },
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
      "--dsw-static-neutral-bluish-600": { light: "#5c5c5c", dark: "#81858c" },
      "--dsw-static-neutral-bluish-700": { light: "#474747", dark: "#61666b" },
      "--dsw-static-neutral-bluish-750": { light: "#4a4a4a", dark: "#46484c" },
      "--dsw-static-neutral-bluish-800": { light: "#3d3d3d", dark: "#36383b" },
      "--dsw-static-neutral-bluish-850": { light: "#333333", dark: "#2b2c2e" },
      "--dsw-static-neutral-bluish-875": { light: "#2b2b2b", dark: "#232426" },
      "--dsw-static-neutral-bluish-900": { light: "#141414", dark: "#1c1c1e" },
      "--dsw-static-neutral-bluish-950": { light: "#1a1a1a", dark: "#161617" },
      "--dsw-static-neutral-bluish-1000": { light: "#1a1a1a", dark: "#0f1115" },
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
      "--dsw-static-blue-400": { light: "#009979", dark: "#2dd4b0" },
      "--dsw-static-blue-450": { light: "#00ad89", dark: "#4dd8b6" },
      "--dsw-static-blue-500": { light: "#00c29a", dark: "#2dd4b0" },
      "--dsw-static-blue-600": { light: "#3e63c4", dark: "#6b95e1" },
      "--dsw-static-blue-800": { light: "#1e346c", dark: "#4e6da8" },
      "--dsw-static-blue-900": { light: "#101e44", dark: "#405b8c" },
      "--dsw-static-blue-950": { light: "#091431", dark: "#39527f" },
      "--dsw-static-deepseek-50": { light: "#edf9f5", dark: "#1b2421" },
      "--dsw-static-deepseek-100": { light: "#dbf3ea", dark: "#21352f" },
      "--dsw-static-deepseek-200": { light: "#b6e7d6", dark: "#2a594c" },
      "--dsw-static-deepseek-300": { light: "#8edbc1", dark: "#30806c" },
      "--dsw-static-deepseek-400": { light: "#00a885", dark: "#2dd4b0" },
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
   DSH 默认无外框。WorkBuddy 是「圆角外框 + 表头淡底 + 行分隔线」。
   注意：宿主表格的横向滚动条是逐行滚动条方案（.md-table-wide 用
   overflow-x:hidden + padding-bottom 模拟），这里**不能**写 overflow:hidden，
   否则会把横向滚动条和右侧超出部分一起裁掉。 */
[data-dsh-wb] [class*="_tableScroll_rve47"] {
  margin: 16px 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
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
/* 表格撑满圆角外框的四个角：首行上圆角、末行下圆角 */
[data-dsh-wb] [class*="_tableScroll_rve47"] thead tr:first-child th:first-child { border-top-left-radius: 7px; }
[data-dsh-wb] [class*="_tableScroll_rve47"] thead tr:first-child th:last-child { border-top-right-radius: 7px; }
[data-dsh-wb] [class*="_tableScroll_rve47"] tbody tr:last-child td:first-child { border-bottom-left-radius: 7px; }
[data-dsh-wb] [class*="_tableScroll_rve47"] tbody tr:last-child td:last-child { border-bottom-right-radius: 7px; }

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

/* ============ 17. 自动化任务列表 ============
   照 WorkBuddy 定时任务卡片的观感，但保持 DSH 的单列列表结构（不动布局）。
   来源：WorkBuddy /renderer/assets/automation-Osg-EzsL.css 的 .atm-task-card

   宿主行结构（dsh-client-ui-schedule，TaskManagerPage_module_css_default）：
     ul.olCj9W_listRows > li > button.olCj9W_row
       > svg.olCj9W_rowGlyph
       + span.olCj9W_rowContent
           > span.olCj9W_rowTitle
           + span.olCj9W_rowSummary > span.olCj9W_metadata × 1~3
             顺序（由 TaskManagerPage.jsx 决定）：
               非 active 任务：  [状态] [频率]              （1~2 段）
               active 任务：     [频率] [下次运行]           （2 段）
             即「频率」永远存在且永远不是最后一段之外的东西，
             最后一段永远是「下次运行」；非 active 时第一段是状态。

   本节的思路：
     1. 卡片外观（描边 / 16px 圆角 / 20px 内边距）照搬 WorkBuddy。
     2. WorkBuddy 底部是「🕐 排期 …… 状态」，DSH 的元数据是一串用 · 分隔的 span。
        用 flex + :last-child 把最后一段（下次运行）推到右边，前面几段（状态/频率）留在左边，
        视觉上就等价于 WorkBuddy 的 __foot。 */

/* 行与行之间从 2px 缝隙改成 16px，对应 WorkBuddy .atm-task-card-grid 的 gap */
[data-dsh-wb] .olCj9W_listRows {
  gap: 16px;
}

/* 一行 = 一张卡片：16px 圆角、20px 内边距。
   高度不强制 154px：WorkBuddy 卡片的 154px 是「名字 + 两行描述(prompt)」撑出来的，
   而 DSH 的列表行里没有描述字段，照搬定高只会空出一大块。 */
[data-dsh-wb] .olCj9W_row {
  box-sizing: border-box;
  border-radius: 16px;
  outline: 1px solid var(--wb-border);
  outline-offset: -1px;
  padding: 16px 20px;
  gap: 12px;
  align-items: flex-start;
  transition: background-color 0.15s;
}

/* 选中态：WorkBuddy 卡片被点开时描边加深，底色不变（宿主用 hover 态底色，这里保留） */
[data-dsh-wb] .olCj9W_row.olCj9W_selectedRow {
  outline-color: var(--dsw-alias-border-l3);
}

/* 图标改为 WorkBuddy __foot 里的 14px 时钟观感（宿主是 16×20） */
[data-dsh-wb] .olCj9W_rowGlyph {
  width: 16px;
  height: 16px;
  margin-top: 0;
  align-self: flex-start;
  color: var(--dsw-alias-label-tertiary);
}

/* 内容区竖向铺满卡片高度：标题在上、元数据贴底 */
[data-dsh-wb] .olCj9W_rowContent {
  gap: 0;
}

/* 标题 16px / 600，与 WorkBuddy 的 .atm-task-card__name 一致 */
[data-dsh-wb] .olCj9W_rowTitle {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

/* 元数据条 = WorkBuddy 的 __foot：居中于卡片下半区，上下留白，贴底 */
[data-dsh-wb] .olCj9W_rowSummary {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--dsw-alias-border-l2);
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-tertiary);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-bottom: 0;
}

/* 把「下次运行」推到右边，等价于 WorkBuddy 的左排期右状态 */
[data-dsh-wb] .olCj9W_rowSummary .olCj9W_metadata {
  font-size: 14px;
  line-height: 22px;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
[data-dsh-wb] .olCj9W_rowSummary .olCj9W_metadata:last-child {
  margin-left: auto;
  flex: none;
  max-width: 55%;
}
/* 段之间的 · 分隔符：flex 布局下宿主用 ::before 加的「 · 」会紧贴，改成小间隔 */
[data-dsh-wb] .olCj9W_rowSummary .olCj9W_metadata + .olCj9W_metadata:before {
  content: "";
  padding: 0;
}
[data-dsh-wb] .olCj9W_rowSummary .olCj9W_metadata + .olCj9W_metadata {
  position: relative;
}

/* 已结束的任务：标题降一级灰（对应 WorkBuddy --paused / --expired 的观感） */
[data-dsh-wb] .olCj9W_endedRow .olCj9W_rowTitle {
  color: var(--dsw-alias-label-tertiary);
}

/* 列表底部留一点呼吸 */
[data-dsh-wb] .olCj9W_listPane {
  padding-bottom: 8px;
}

/* ============ 18. 表单控件 ============
   DSH 默认的主色体系是蓝，开关/复选框都是「宿主默认蓝 + accent-color」。
   这里统一到 WorkBuddy 的品牌绿，并让所有交互控件的手感一致。

   类名来源（index-lh_YM6sT.css）：
     ._switch_1ik0f_5      开关轨道 36×20，背景 var(--dsw-alias-border-l3)
     ._thumb_1ik0f_33      开关滑块 16×16，选中时 translate(16px)
     ._checkbox_1wz3s_1    复选框，input 用 accent-color
   复选框的 accent-color 已经指向 --dsw-alias-brand-primary，
   只需要把那个令牌指到品牌绿（已在令牌层完成），这里只管开关。 */

/* 开关关闭态：WorkBuddy 用更浅的灰，边缘更柔和 */
[data-dsh-wb] ._switch_1ik0f_5 {
  background-color: var(--dsw-static-neutral-bluish-200);
  transition: background-color 0.15s ease;
}

/* 开关打开态：品牌绿轨道。
   宿主 Switch 的 DOM 是 <button role="switch" aria-checked={checked} class="_switch_1ik0f_5">，
   打开态只体现在 aria-checked 上，没有 data-state。 */
[data-dsh-wb] ._switch_1ik0f_5[aria-checked="true"] {
  background-color: var(--wb-control-on);
}

/* 滑块保持白色圆点，不加阴影（WorkBuddy 的 --wb-switch-thumb-shadow: none） */
[data-dsh-wb] ._thumb_1ik0f_33 {
  box-shadow: none;
}

/* 复选框与单选按钮：用 accent-color 统一到品牌绿。
   **不要改成 appearance:none 自己画**：宿主的复选框不止一种 DOM
   （设置页列表用的不是 ._checkbox_1wz3s_1，模型选择页那种也没有稳定类名），
   自己画会让没匹配到的那些复选框变成空框、勾选状态看不见。
   accent-color 的勾色由浏览器按填充色亮度决定，中间亮度会出来黑勾——
   这是可接受的取舍，好过丢功能。

   颜色来源很关键：宿主的 ._checkbox_1wz3s_1 input 用的是
   --dsw-alias-brand-primary，那条别名指向中性档位（正文色），
   所以不在这里直接指定就会是黑框。这里直接吃 --wb-control-on。 */
[data-dsh-wb] ._checkbox_1wz3s_1 input[type="checkbox"],
[data-dsh-wb] input[type="checkbox"] {
  accent-color: var(--wb-control-on);
}

[data-dsh-wb] input[type="radio"] {
  accent-color: var(--wb-control-on);
}

/* ============ 19. 对话框 ============
   宿主对话框是 --dsw-radius-panel = 28px，WorkBuddy 的弹窗是 16px。
   来源：._dialog_14mp3_33 / ._confirmation_cjd8z_1
   只改圆角，不改宽高、padding 与阴影（那些宿主调得比 WorkBuddy 细）。 */
[data-dsh-wb] ._dialog_14mp3_33 {
  border-radius: 16px;
}

/* 对话框标题 16px/500 宿主已经是了，保持不动；这里让关闭按钮更贴合圆角 */
[data-dsh-wb] ._close_14mp3_87 {
  border-radius: 6px;
}

/* ============ 20. 提示框与悬停卡片 ============
   WorkBuddy 的 tooltip：深底、12px 圆角、12px 字号。
   来源：._tooltip_38b9q_20（11px/14px）、._keys_38b9q_1（12px）、
         ._card_bgejw_9（悬停卡 244px 宽、12px 圆角、#2C2C2E 底） */
[data-dsh-wb] ._tooltip_38b9q_20 {
  font-size: 12px;
  line-height: 16px;
}

/* 悬停卡片圆角统一到 12px */
[data-dsh-wb] ._card_bgejw_9 {
  border-radius: 12px;
}

/* ============ 21. 菜单 ============
   宿主菜单 padding 4px、项目高度靠 padding 撑（4px 7px）。
   WorkBuddy 的上下文菜单：项目 min-height 32px、10px 圆角、悬停淡灰。
   来源：._menu_3oazc_581 / ._menuItem_3oazc_595 / .js5r2G_item */

[data-dsh-wb] ._menu_3oazc_581 {
  border-radius: 10px;
  padding: 4px;
}

[data-dsh-wb] ._menuItem_3oazc_595 {
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 6px;
}

[data-dsh-wb] .js5r2G_item {
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 6px;
}

/* ============ 22. 输入框占位文字 ============
   WorkBuddy 的 placeholder 是 30% 黑（--wb-color-text-primary 的 4d）。
   宿主用 --dsw-alias-label-dimmed，这里统一到同一档。 */
[data-dsh-wb] ._input_14sgc_25::placeholder {
  color: var(--dsw-alias-label-dimmed);
}
/* ============ 23. 对话栏宽度（P0）============
   WorkBuddy 的对话栏是固定 848px，窗口宽于 1681px 时提到 1008px。
   宿主 .an3WzG_body 的 --dsh-chat-content-width 有三级来源：
     1. var(--dsh-chat-user-width)：用户拖拽宽度手柄时 JS 写进内联样式
     2. clamp(680px, 列宽*0.64, 920px)：没拖过时的默认值
   我们在 2 上做文章：给 fallback 换成分档常量。
   拖拽优先（1 在 2 前面），所以用户手感不变，只是「没设过」时的默认值变成 WorkBuddy 的档位。

   绝对不要给 [data-conversation-scroll] 加 max-width —— 它是满宽滚动容器，
   缩它会连可滚动区域一起缩窄（0.2.0 就是这么把对话区弄小的）。 */
[data-dsh-wb] .an3WzG_body {
  --dsh-chat-content-width: var(--dsh-chat-user-width, 848px);
  --dsh-composer-card-max-width: calc(var(--dsh-chat-content-width) + 32px);
}
@media (min-width: 1681px) {
  [data-dsh-wb] .an3WzG_body { --dsh-chat-content-width: var(--dsh-chat-user-width, 1008px); }
}
/* 窄窗口下 848px 会把两侧留白挤没，退回宿主的流式算式：
   列宽 * .86，夹在 560px 到 848px 之间。 */
@media (max-width: 1080px) {
  [data-dsh-wb] .an3WzG_body {
    --dsh-chat-content-width: var(--dsh-chat-user-width, clamp(560px, calc(var(--dsh-conversation-column-width, 0px) * .86), 848px));
  }
}

/* ============ 24. 输入卡内部分区（P0）============
   WorkBuddy 输入卡的纵向节奏：
     顶部留 8px → 正文（14/22，左右 14/8）→ 与底部工具条间距 12px → 工具条 padding 2 10 8
   宿主是 padding-top:8px、gap:12px、input min-height 36px、row padding 2 8 6，
   差得不多，只把左右对齐到 10px、点号按钮留 6px 呼吸空间。 */
[data-dsh-wb] [data-composer-card] { padding-top: 8px; }
[data-dsh-wb] [data-composer-input] { padding: 4px 8px 0 14px; min-height: 36px; }
[data-dsh-wb] [class*="GRgSLq_row"] { padding: 2px 10px 8px; gap: 10px; }
/* 输入区最大高度 336px（宿主值），这里不改，只确保内滚动条用我们的细模式 */

/* ============ 25. 工具卡展开态高度上限（P0）============
   WorkBuddy 展开体 320px 封顶；宿主 .hKdVjq_bodyScroll 是 260px。
   取 320px，并保证它跟着光标/字号一起缩放不出格。 */
[data-dsh-wb] [class*="hKdVjq_bodyScroll"] { max-height: 320px; }

/* ============ 26. 设置页排版（P2 支撑）============
   新设置页（settings.section: workbuddy）的样式。
   WorkBuddy 的设置项是一行标题 + 一行说明 + 右侧控件，行间距 24px。 */
.dsh-wb-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 24px 24px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
}
.dsh-wb-panel-title {
  margin: 22px 0 8px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dsh-wb-panel-title:first-child { margin-top: 8px; }
.dsh-wb-panel-hint {
  margin: -4px 0 8px;
  font-size: 12px;
  line-height: 20px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-wb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 0;
  border-bottom: .5px solid var(--dsw-alias-border-l2);
}
.dsh-wb-row:last-child { border-bottom: 0; }
.dsh-wb-row-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dsh-wb-row-label { font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-primary); }
.dsh-wb-row-desc { font-size: 12px; line-height: 20px; color: var(--dsw-alias-label-tertiary); }
.dsh-wb-segmented {
  display: inline-flex;
  flex: none;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background-color: var(--dsw-alias-interactive-bg-hover);
}
.dsh-wb-segmented > button {
  border: 0;
  border-radius: 6px;
  padding: 4px 12px;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary);
  background: transparent;
  cursor: pointer;
}
.dsh-wb-segmented > button[aria-pressed="true"] {
  color: var(--dsw-alias-label-primary);
  background-color: var(--dsw-alias-bg-base);
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
}
.dsh-wb-segmented > button:disabled { opacity: .45; cursor: default; }

/* ============ 28. 会话行徽标（P2）============
   挂在 sidebar.session.row.trailing（list，inline: true），
   渲染在时间戳右边、行 hover 时随 .rowResting 一起隐藏。
   WorkBuddy 的会话行右边是一个小圆点 + 极小的状态字。 */
.dsh-wb-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--dsw-alias-label-tertiary);
  opacity: .55;
}

/* ============ 29. 会话头统计（P2）============
   挂在 conversation.session.header.utilities（list，scope: session）。
   宿主容器本身 gap 8px、margin-left 20px，这里只定义胶囊本身。 */
.dsh-wb-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary);
  background-color: var(--dsw-alias-interactive-bg-hover);
  white-space: nowrap;
  cursor: default;
}
.dsh-wb-stat-label { color: var(--dsw-alias-label-tertiary); }
.dsh-wb-stat-value { color: var(--dsw-alias-label-secondary); }

/* ============ 27. 输入框上方的快捷条（P2）============
   挂在 conversation.input.dock（list，scope: session），位于输入卡正上方。
   WorkBuddy 的同类条：浅灰胶囊、12px 字号、6px 圆角、横排可换行。 */
.dsh-wb-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 2px 2px;
}
.dsh-wb-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: .5px solid var(--dsw-alias-border-l3);
  border-radius: 8px;
  padding: 4px 10px;
  font: inherit;
  font-size: 12px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary);
  background-color: var(--dsw-alias-bg-layer-1);
  cursor: pointer;
  transition: background-color .15s ease, color .15s ease;
}
.dsh-wb-action:hover {
  color: var(--dsw-alias-label-primary);
  background-color: var(--dsw-alias-interactive-bg-hover);
}
.dsh-wb-action[disabled] { opacity: .45; cursor: default; }

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

    /* ---------------- P2：槽位组件 ---------------- */

    /** 会话行右侧的小圆点。
     *  宿主 ownProps 里给的是 { sessionId }，只用来做 key 的稳定来源。 */
    function makeTrailing(React) {
      return function WorkBuddyTrailing() {
        return React.createElement('span', { className: 'dsh-wb-dot', 'aria-hidden': 'true' })
      }
    }

    /** 会话头右侧的统计胶囊。
     *  宿主 ownProps 给的是 sessionId；attachedMessages 之类的计数拿不到稳定契约，
     *  所以这里只显示「当前会话」这个无害信息，不猜数字。 */
    function makeUtility(React) {
      return function WorkBuddyUtility() {
        return React.createElement('span', {
          className: 'dsh-wb-stat',
          title: 'WorkBuddy 主题已启用（设置 → 通用 可关闭）',
        },
          React.createElement('span', { className: 'dsh-wb-stat-value' }, 'WorkBuddy'),
        )
      }
    }

    /** 输入卡上方的快捷条。
     *  zone.session 拿得到 cwd，据此显示工作区名；点击没有任何副作用。 */
    function makeDock(React) {
      return function WorkBuddyDock(props) {
        const cwd = props && props.session ? props.session.cwd : undefined
        const name = typeof cwd === 'string' && cwd !== ''
          ? cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop()
          : '当前工作区'
        return React.createElement('div', { className: 'dsh-wb-actions' },
          React.createElement('span', { className: 'dsh-wb-action', title: cwd ?? '' }, name),
        )
      }
    }

    /** 完整的一页设置。
     *  label 必须是函数：宿主的 SettingsPanel 用 resolveSlotLabel 取值，
     *  而且 nav 列表只在 locale / slot 变化时重建。 */
    function makeSection(React) {
      const h = React.createElement

      function Row(props) {
        return h('div', { className: 'dsh-wb-row' },
          h('div', { className: 'dsh-wb-row-main' },
            h('div', { className: 'dsh-wb-row-label' }, props.label),
            props.desc ? h('div', { className: 'dsh-wb-row-desc' }, props.desc) : null,
          ),
          props.control ?? null,
        )
      }

      function Segmented(props) {
        return h('div', { className: 'dsh-wb-segmented' },
          props.options.map((o) => h('button', {
            key: o.id,
            type: 'button',
            'aria-pressed': props.value === o.id ? 'true' : 'false',
            disabled: o.disabled === true,
            onClick: () => { if (o.disabled !== true) props.onChange(o.id) },
          }, o.label)),
        )
      }

      return function WorkBuddySection() {
        const [on, setOn] = React.useState(isEnabled)
        return h('div', { className: 'dsh-wb-panel' },
          h('div', { className: 'dsh-wb-panel-title' }, 'WorkBuddy 外观'),
          h('div', { className: 'dsh-wb-panel-hint' }, '复刻自 WorkBuddy 的设计令牌：中性灰底 + 薄荷绿交互色，正文 14/22，对话栏 848px。'),
          h(Row, {
            label: '启用 WorkBuddy 主题',
            desc: '关闭后立即回到 DSH 默认配色与字体，开关状态记在本机。',
            control: h(Segmented, {
              value: on ? 'on' : 'off',
              options: [{ id: 'on', label: '开' }, { id: 'off', label: '关' }],
              onChange: (id) => {
                const next = id === 'on'
                try {
                  ON_SWITCH.call(next)
                } catch (error) {
                  console.warn('[dsh-workbuddy-theme] 切换主题失败：', error)
                }
                setOn(next)
              },
            }),
          }),
          h(Row, { label: '配色', desc: '由 --dsw-static-* 静态色阶整体重排，明暗两态各自成对。', control: h('span', { className: 'dsh-wb-row-label' }, '浅色 / 跟随系统') }),
          h(Row, { label: '字体', desc: '界面用系统中文栈（PingFang SC → 微软雅黑），代码用等宽栈。' }),
          h(Row, { label: '对话栏宽度', desc: '默认 848px；窗口宽于 1681px 时 1008px；仍可用宽度手柄拖拽覆盖。' }),
          h(Row, { label: '已知取舍', desc: '中性 14 档明暗同值；深色是「跟随」而非逐档复刻。' }),
        )
      }
    }

    /** 一次性把 P2 的四个槽位挂上。任何一个槽位未声明都不影响其它几项。 */
    function registerSurfaces(slots, React, note) {
      const offs = []
      const attach = (slot, spec, component) => {
        try {
          offs.push(slots.inject(slot, () => slots.register({ ...spec, name: slot }, component)))
          note('已挂到 ' + slot)
        } catch (error) {
          note('挂 ' + slot + ' 失败：' + String(error && error.message))
        }
      }

      if (React !== null && React !== undefined) {
        attach('sidebar.session.row.trailing', { id: 'workbuddy-dot', order: 10 }, makeTrailing(React))
        attach('conversation.session.header.utilities', { id: 'workbuddy-stat', order: 10 }, makeUtility(React))
        attach('conversation.input.dock', { id: 'workbuddy-actions', order: 30 }, makeDock(React))
      }

      // 整页设置：order 18 排在 agent-presets(20) 之前、plugins(15) 之后
      attach('settings.section', {
        id: 'workbuddy',
        order: 18,
        label: () => 'WorkBuddy 外观',
      }, makeSection(React))

      return () => { for (const off of offs) { try { off() } catch { /* 忽略 */ } } }
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

      // P2：会话行徽标 / 会话头统计 / 输入卡上方快捷条 / 独立设置页
      track(registerSurfaces(slots, React, note))

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
