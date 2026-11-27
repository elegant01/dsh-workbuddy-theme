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
    const WIDGET_STYLE_ID = 'dsh-workbuddy-theme-widget-css'

    /** WorkBuddy 字体栈：中文 UI 字体不随包发布，只声明机器上有的。 */
    const UI_FONT =
      '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    const CODE_FONT =
      '"Cascadia Code", "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "PingFang SC", monospace'

    /** WorkBuddy 的品牌绿。只在「交互色」上用：按钮、开关、选中、光标。 */
    const BRAND = { light: '#00c29a', dark: '#2dd4b0' }
    const BRAND_HOVER = { light: '#40d1b3', dark: '#4fe0c0' }

    /** 交互色三档：薄荷绿是 WorkBuddy 原版；靛蓝与琥珀是同饱和度的换肤。
     *  每档给 9 个令牌（含 deepseek/blue 静态档，发送按钮、选中色、光标都吃它们），
     *  buildTokens() 用选中的档覆盖 STATIC_TOKENS 里的薄荷绿字面量。 */
    const ACCENTS = {
      mint: {
        '--wb-control-on': { light: '#00c29a', dark: '#2dd4b0' },
        '--wb-control-on-hover': { light: '#40d1b3', dark: '#4fe0c0' },
        '--dsw-static-deepseek-500': { light: '#00c29a', dark: '#2dd4b0' },
        '--dsw-static-deepseek-450': { light: '#42c8a4', dark: '#30be9e' },
        '--dsw-static-deepseek-400': { light: '#00a885', dark: '#2dd4b0' },
        '--dsw-static-blue-500': { light: '#00c29a', dark: '#2dd4b0' },
        '--dsw-static-blue-450': { light: '#00ad89', dark: '#4dd8b6' },
        '--dsw-static-blue-400': { light: '#009979', dark: '#2dd4b0' },
        '--dsw-static-deepseek-50': { light: '#edf9f5', dark: '#1b2421' },
      },
      indigo: {
        '--wb-control-on': { light: '#4f6ef7', dark: '#8b9dfc' },
        '--wb-control-on-hover': { light: '#6f86f9', dark: '#a5b3fd' },
        '--dsw-static-deepseek-500': { light: '#4f6ef7', dark: '#8b9dfc' },
        '--dsw-static-deepseek-450': { light: '#6d84f8', dark: '#7e93f6' },
        '--dsw-static-deepseek-400': { light: '#3f5fe0', dark: '#8b9dfc' },
        '--dsw-static-blue-500': { light: '#4f6ef7', dark: '#8b9dfc' },
        '--dsw-static-blue-450': { light: '#5d77f7', dark: '#93a5fd' },
        '--dsw-static-blue-400': { light: '#4a63e0', dark: '#8b9dfc' },
        '--dsw-static-deepseek-50': { light: '#eef1fe', dark: '#1e2233' },
      },
      amber: {
        '--wb-control-on': { light: '#d97706', dark: '#f0a04b' },
        '--wb-control-on-hover': { light: '#e79a3a', dark: '#f5b56a' },
        '--dsw-static-deepseek-500': { light: '#d97706', dark: '#f0a04b' },
        '--dsw-static-deepseek-450': { light: '#e08a24', dark: '#e99a3d' },
        '--dsw-static-deepseek-400': { light: '#c76a05', dark: '#f0a04b' },
        '--dsw-static-blue-500': { light: '#d97706', dark: '#f0a04b' },
        '--dsw-static-blue-450': { light: '#dd8223', dark: '#f3ab5c' },
        '--dsw-static-blue-400': { light: '#cc6f04', dark: '#f0a04b' },
        '--dsw-static-deepseek-50': { light: '#fdf3e5', dark: '#2a221a' },
      },
    }

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

    // <dsh-workbuddy-skins:begin> 由 scripts/build-skins.mjs 生成，勿手改。
    const SKIN_PRESETS = [
      {
        "id": "purple",
        "name": "蓝紫 · Clear Sky",
        "accent": {
          "--wb-control-on": {
            "light": "#5E67FA",
            "dark": "#5E67FA"
          },
          "--wb-control-on-hover": {
            "light": "#4C55ECe6",
            "dark": "#4C55ECe6"
          },
          "--dsw-static-deepseek-500": {
            "light": "#5E67FA",
            "dark": "#5E67FA"
          },
          "--dsw-static-deepseek-450": {
            "light": "#8E96FC",
            "dark": "#8E96FC"
          },
          "--dsw-static-deepseek-400": {
            "light": "#2C34C4",
            "dark": "#2C34C4"
          },
          "--dsw-static-blue-500": {
            "light": "#5E67FA",
            "dark": "#5E67FA"
          },
          "--dsw-static-blue-450": {
            "light": "#8E96FC",
            "dark": "#8E96FC"
          },
          "--dsw-static-blue-400": {
            "light": "#2C34C4",
            "dark": "#2C34C4"
          },
          "--dsw-static-deepseek-50": {
            "light": "#f4f7fd",
            "dark": "#20233a"
          }
        },
        "bubble": {
          "light": "#E5EEFF",
          "dark": "#2c2c2e"
        },
        "border": {
          "light": "#e0eafe",
          "dark": "#3a3a3c"
        },
        "shadow": {
          "popover": "0 12px 24px -8px #05082e0f, 0 2px 4px -4px #05082e14",
          "stroke": "#e0eafe"
        },
        "surface": {
          "--dsw-alias-bg-base": "#F7FAFF",
          "--dsw-alias-bg-layer-1": "#ffffff",
          "--dsw-alias-bg-layer-2": "#ffffff",
          "--dsw-alias-bg-layer-3": "#ffffff",
          "--dsw-alias-bg-module-platform": "#E5EEFF",
          "--dsw-alias-bg-multi-select": "#EDF2FF",
          "--dsw-alias-bg-overlay": "#d6e2ff",
          "--dsw-alias-bg-skeleton": "#5E67FA1a",
          "--dsw-alias-card-fill": "#ffffff",
          "--dsw-alias-card-fill-hover": "#ebf1ff",
          "--dsw-alias-interactive-bg-hover": "#DEE7FF",
          "--dsw-alias-interactive-bg-active": "#EDF2FF",
          "--dsw-alias-interactive-bg-hover-solid": "#ebf1ff",
          "--dsw-alias-border-l1": "#05082e14",
          "--dsw-alias-border-l2": "#e0eafe",
          "--dsw-alias-border-l3": "#c7daff",
          "--dsw-alias-border-l4": "#c7daff",
          "--dsw-alias-border-selected": "#5E67FA",
          "--dsw-alias-label-primary": "#05082ee6",
          "--dsw-alias-label-secondary": "#05082eb3",
          "--dsw-alias-label-tertiary": "#05082e80",
          "--dsw-alias-label-caption": "#05082e4d",
          "--dsw-alias-label-dimmed": "#05082e4d",
          "--dsw-alias-link": "#111cb1",
          "--dsw-alias-button-info-fill": "#5E67FA",
          "--dsw-alias-button-info-hover": "#8E96FC",
          "--dsw-alias-button-primary-fill": "#5E67FA",
          "--dsw-alias-button-primary-hover": "#2C34C4",
          "--dsw-alias-markdown-inline-code": "#E5EEFF",
          "--dsw-alias-markdown-code-block": "#E5EEFF",
          "--dsw-alias-markdown-code-block-banner": "#E5EEFF",
          "--dsw-alias-markdown-tag": "#d1e0ff",
          "--dsw-alias-switch-thumb": "#f7f8f9",
          "--dsw-alias-scrollbar-bg-l1": "#05082e33",
          "--dsw-alias-scrollbar-bg-l2": "#05082e1f",
          "--dsw-alias-scrollbar-hover-l1": "#05082e4d",
          "--dsw-alias-scrollbar-hover-l2": "#05082e4d",
          "--dsw-specific-sidebar-fill": "#E5EEFF",
          "--dsw-specific-input-major": "#F0F4FF",
          "--dsw-specific-menu": "#ffffff",
          "--dsw-specific-selector": "#EDF2FF",
          "--dsw-specific-tip": "#05082ee6",
          "--dsw-specific-login-input": "#F0F4FF"
        }
      },
      {
        "id": "qqblue",
        "name": "晴空蓝",
        "accent": {
          "--wb-control-on": {
            "light": "#0099ff",
            "dark": "#0099ff"
          },
          "--wb-control-on-hover": {
            "light": "#0c8bdfe6",
            "dark": "#0c8bdfe6"
          },
          "--dsw-static-deepseek-500": {
            "light": "#0099ff",
            "dark": "#0099ff"
          },
          "--dsw-static-deepseek-450": {
            "light": "#42b4ff",
            "dark": "#42b4ff"
          },
          "--dsw-static-deepseek-400": {
            "light": "#0a78c2",
            "dark": "#0a78c2"
          },
          "--dsw-static-blue-500": {
            "light": "#0099ff",
            "dark": "#0099ff"
          },
          "--dsw-static-blue-450": {
            "light": "#42b4ff",
            "dark": "#42b4ff"
          },
          "--dsw-static-blue-400": {
            "light": "#0a78c2",
            "dark": "#0a78c2"
          },
          "--dsw-static-deepseek-50": {
            "light": "#f3fafe",
            "dark": "#132a3b"
          }
        },
        "bubble": {
          "light": "#e6f4ff",
          "dark": "#2c2c2e"
        },
        "border": {
          "light": "#e0f2fe",
          "dark": "#3a3a3c"
        },
        "shadow": {
          "popover": "0 12px 24px -8px #06263c0f, 0 2px 4px -4px #06263c14",
          "stroke": "#e0f2fe"
        },
        "surface": {
          "--dsw-alias-bg-base": "#f7fcff",
          "--dsw-alias-bg-layer-1": "#ffffff",
          "--dsw-alias-bg-layer-2": "#ffffff",
          "--dsw-alias-bg-layer-3": "#ffffff",
          "--dsw-alias-bg-module-platform": "#ccebff",
          "--dsw-alias-bg-multi-select": "#edf8ff",
          "--dsw-alias-bg-overlay": "#d6efff",
          "--dsw-alias-bg-skeleton": "#0099ff1a",
          "--dsw-alias-card-fill": "#ffffff",
          "--dsw-alias-card-fill-hover": "#ebf7ff",
          "--dsw-alias-interactive-bg-hover": "#def2ff",
          "--dsw-alias-interactive-bg-active": "#dbf1ff",
          "--dsw-alias-interactive-bg-hover-solid": "#ebf7ff",
          "--dsw-alias-border-l1": "#06263c14",
          "--dsw-alias-border-l2": "#e0f2fe",
          "--dsw-alias-border-l3": "#c2e7ff",
          "--dsw-alias-border-l4": "#c2e7ff",
          "--dsw-alias-border-selected": "#0099ff",
          "--dsw-alias-label-primary": "#06263ce6",
          "--dsw-alias-label-secondary": "#06263cb3",
          "--dsw-alias-label-tertiary": "#06263c80",
          "--dsw-alias-label-caption": "#06263c4d",
          "--dsw-alias-label-dimmed": "#06263c4d",
          "--dsw-alias-link": "#0966a5",
          "--dsw-alias-button-info-fill": "#0099ff",
          "--dsw-alias-button-info-hover": "#42b4ff",
          "--dsw-alias-button-primary-fill": "#0099ff",
          "--dsw-alias-button-primary-hover": "#0a78c2",
          "--dsw-alias-markdown-inline-code": "#e6f4ff",
          "--dsw-alias-markdown-code-block": "#e6f4ff",
          "--dsw-alias-markdown-code-block-banner": "#e6f4ff",
          "--dsw-alias-markdown-tag": "#d1edff",
          "--dsw-alias-switch-thumb": "#f2f9fe",
          "--dsw-alias-scrollbar-bg-l1": "#06263c33",
          "--dsw-alias-scrollbar-bg-l2": "#06263c1f",
          "--dsw-alias-scrollbar-hover-l1": "#06263c4d",
          "--dsw-alias-scrollbar-hover-l2": "#06263c4d",
          "--dsw-specific-sidebar-fill": "#ccebff",
          "--dsw-specific-input-major": "#f0f9ff",
          "--dsw-specific-menu": "#ffffff",
          "--dsw-specific-selector": "#edf8ff",
          "--dsw-specific-tip": "#06263ce6",
          "--dsw-specific-login-input": "#f0f9ff"
        }
      },
      {
        "id": "blue-video-fallback",
        "name": "柔和蓝",
        "accent": {
          "--wb-control-on": {
            "light": "#3a66ac",
            "dark": "#3a66ac"
          },
          "--wb-control-on-hover": {
            "light": "#4e79bee6",
            "dark": "#4e79bee6"
          },
          "--dsw-static-deepseek-500": {
            "light": "#3a66ac",
            "dark": "#3a66ac"
          },
          "--dsw-static-deepseek-450": {
            "light": "#88a9db",
            "dark": "#88a9db"
          },
          "--dsw-static-deepseek-400": {
            "light": "#22406e",
            "dark": "#22406e"
          },
          "--dsw-static-blue-500": {
            "light": "#3a66ac",
            "dark": "#3a66ac"
          },
          "--dsw-static-blue-450": {
            "light": "#88a9db",
            "dark": "#88a9db"
          },
          "--dsw-static-blue-400": {
            "light": "#22406e",
            "dark": "#22406e"
          },
          "--dsw-static-deepseek-50": {
            "light": "#f4f8ff",
            "dark": "#1b232f"
          }
        },
        "bubble": {
          "light": "#e6efff",
          "dark": "#2c2c2e"
        },
        "border": {
          "light": "#dce8ff",
          "dark": "#3a3a3c"
        },
        "shadow": {
          "popover": "0 12px 24px -8px #001f4f0f, 0 2px 4px -4px #001f4f14",
          "stroke": "#dce8ff"
        },
        "surface": {
          "--dsw-alias-bg-base": "#f5f9ff",
          "--dsw-alias-bg-layer-1": "#ffffff",
          "--dsw-alias-bg-layer-2": "#ffffff",
          "--dsw-alias-bg-layer-3": "#ffffff",
          "--dsw-alias-bg-module-platform": "#A8C1F0",
          "--dsw-alias-bg-multi-select": "#e6efff",
          "--dsw-alias-bg-overlay": "#B9CFF6",
          "--dsw-alias-bg-skeleton": "#3a66ac1a",
          "--dsw-alias-card-fill": "#ffffff",
          "--dsw-alias-card-fill-hover": "#e9f2ff",
          "--dsw-alias-interactive-bg-hover": "#e3edff",
          "--dsw-alias-interactive-bg-active": "#A8C1F0",
          "--dsw-alias-interactive-bg-hover-solid": "#e9f2ff",
          "--dsw-alias-border-l1": "#001f4f14",
          "--dsw-alias-border-l2": "#dce8ff",
          "--dsw-alias-border-l3": "#c4daf5",
          "--dsw-alias-border-l4": "#c4daf5",
          "--dsw-alias-border-selected": "#3a66ac",
          "--dsw-alias-label-primary": "#001f4fe6",
          "--dsw-alias-label-secondary": "#001f4fb3",
          "--dsw-alias-label-tertiary": "#001f4f80",
          "--dsw-alias-label-caption": "#001f4f4d",
          "--dsw-alias-label-dimmed": "#001f4f4d",
          "--dsw-alias-link": "#3a66ac",
          "--dsw-alias-button-info-fill": "#3a66ac",
          "--dsw-alias-button-info-hover": "#88a9db",
          "--dsw-alias-button-primary-fill": "#3a66ac",
          "--dsw-alias-button-primary-hover": "#22406e",
          "--dsw-alias-markdown-inline-code": "#e6efff",
          "--dsw-alias-markdown-code-block": "#e6efff",
          "--dsw-alias-markdown-code-block-banner": "#e6efff",
          "--dsw-alias-markdown-tag": "#d6e4fc",
          "--dsw-alias-switch-thumb": "#f7f8f9",
          "--dsw-alias-scrollbar-bg-l1": "#001f4f33",
          "--dsw-alias-scrollbar-bg-l2": "#001f4f1f",
          "--dsw-alias-scrollbar-hover-l1": "#001f4f4d",
          "--dsw-alias-scrollbar-hover-l2": "#001f4f4d",
          "--dsw-specific-sidebar-fill": "#e6efff",
          "--dsw-specific-input-major": "#eef3ff",
          "--dsw-specific-menu": "#ffffff",
          "--dsw-specific-selector": "#e6efff",
          "--dsw-specific-tip": "#001f4fe6",
          "--dsw-specific-login-input": "#eef3ff"
        }
      },
      {
        "id": "green",
        "name": "森林绿",
        "accent": {
          "--wb-control-on": {
            "light": "#3c8c4e",
            "dark": "#3c8c4e"
          },
          "--wb-control-on-hover": {
            "light": "#358a49e6",
            "dark": "#358a49e6"
          },
          "--dsw-static-deepseek-500": {
            "light": "#3c8c4e",
            "dark": "#3c8c4e"
          },
          "--dsw-static-deepseek-450": {
            "light": "#88bd92",
            "dark": "#88bd92"
          },
          "--dsw-static-deepseek-400": {
            "light": "#256d37",
            "dark": "#256d37"
          },
          "--dsw-static-blue-500": {
            "light": "#3c8c4e",
            "dark": "#3c8c4e"
          },
          "--dsw-static-blue-450": {
            "light": "#88bd92",
            "dark": "#88bd92"
          },
          "--dsw-static-blue-400": {
            "light": "#256d37",
            "dark": "#256d37"
          },
          "--dsw-static-deepseek-50": {
            "light": "#f4f7f4",
            "dark": "#1b2822"
          }
        },
        "bubble": {
          "light": "#e8f0e9",
          "dark": "#2c2c2e"
        },
        "border": {
          "light": "#dce7dd",
          "dark": "#3a3a3c"
        },
        "shadow": {
          "popover": "0 12px 24px -8px #12261a0f, 0 2px 4px -4px #12261a14",
          "stroke": "#dce7dd"
        },
        "surface": {
          "--dsw-alias-bg-base": "#f6f8f5",
          "--dsw-alias-bg-layer-1": "#ffffff",
          "--dsw-alias-bg-layer-2": "#ffffff",
          "--dsw-alias-bg-layer-3": "#ffffff",
          "--dsw-alias-bg-module-platform": "#e8f0e9",
          "--dsw-alias-bg-multi-select": "#edf2ed",
          "--dsw-alias-bg-overlay": "#d8e4d9",
          "--dsw-alias-bg-skeleton": "#3e8a4f1a",
          "--dsw-alias-card-fill": "#ffffff",
          "--dsw-alias-card-fill-hover": "#ecf2ec",
          "--dsw-alias-interactive-bg-hover": "#dde8df",
          "--dsw-alias-interactive-bg-active": "#edf2ed",
          "--dsw-alias-interactive-bg-hover-solid": "#ecf2ec",
          "--dsw-alias-border-l1": "#12261a14",
          "--dsw-alias-border-l2": "#dce7dd",
          "--dsw-alias-border-l3": "#cde0ce",
          "--dsw-alias-border-l4": "#cde0ce",
          "--dsw-alias-border-selected": "#3c8c4e",
          "--dsw-alias-label-primary": "#12261ae6",
          "--dsw-alias-label-secondary": "#12261ab3",
          "--dsw-alias-label-tertiary": "#12261a80",
          "--dsw-alias-label-caption": "#12261a4d",
          "--dsw-alias-label-dimmed": "#12261a4d",
          "--dsw-alias-link": "#1f7237",
          "--dsw-alias-button-info-fill": "#3c8c4e",
          "--dsw-alias-button-info-hover": "#88bd92",
          "--dsw-alias-button-primary-fill": "#3c8c4e",
          "--dsw-alias-button-primary-hover": "#256d37",
          "--dsw-alias-markdown-inline-code": "#e8f0e9",
          "--dsw-alias-markdown-code-block": "#e8f0e9",
          "--dsw-alias-markdown-code-block-banner": "#e8f0e9",
          "--dsw-alias-markdown-tag": "#d5e5d6",
          "--dsw-alias-switch-thumb": "#f7f8f9",
          "--dsw-alias-scrollbar-bg-l1": "#12261a33",
          "--dsw-alias-scrollbar-bg-l2": "#12261a1f",
          "--dsw-alias-scrollbar-hover-l1": "#12261a4d",
          "--dsw-alias-scrollbar-hover-l2": "#12261a4d",
          "--dsw-specific-sidebar-fill": "#e8f0e9",
          "--dsw-specific-input-major": "#f0f5f0",
          "--dsw-specific-menu": "#ffffff",
          "--dsw-specific-selector": "#edf2ed",
          "--dsw-specific-tip": "#12261ae6",
          "--dsw-specific-login-input": "#f0f5f0"
        }
      },
      {
        "id": "mint",
        "name": "深海青",
        "accent": {
          "--wb-control-on": {
            "light": "#194253",
            "dark": "#194253"
          },
          "--wb-control-on-hover": {
            "light": "#2b7791e6",
            "dark": "#2b7791e6"
          },
          "--dsw-static-deepseek-500": {
            "light": "#194253",
            "dark": "#194253"
          },
          "--dsw-static-deepseek-450": {
            "light": "#74b4c8",
            "dark": "#74b4c8"
          },
          "--dsw-static-deepseek-400": {
            "light": "#0f2f3d",
            "dark": "#0f2f3d"
          },
          "--dsw-static-blue-500": {
            "light": "#194253",
            "dark": "#194253"
          },
          "--dsw-static-blue-450": {
            "light": "#74b4c8",
            "dark": "#74b4c8"
          },
          "--dsw-static-blue-400": {
            "light": "#0f2f3d",
            "dark": "#0f2f3d"
          },
          "--dsw-static-deepseek-50": {
            "light": "#f2fbfc",
            "dark": "#161e23"
          }
        },
        "bubble": {
          "light": "#E5FAFF",
          "dark": "#2c2c2e"
        },
        "border": {
          "light": "#d5eef4",
          "dark": "#3a3a3c"
        },
        "shadow": {
          "popover": "0 12px 24px -8px #00232c0f, 0 2px 4px -4px #00232c14",
          "stroke": "#d5eef4"
        },
        "surface": {
          "--dsw-alias-bg-base": "#F8FDFF",
          "--dsw-alias-bg-layer-1": "#ffffff",
          "--dsw-alias-bg-layer-2": "#ffffff",
          "--dsw-alias-bg-layer-3": "#ffffff",
          "--dsw-alias-bg-module-platform": "#E5FAFF",
          "--dsw-alias-bg-multi-select": "#E5FAFF",
          "--dsw-alias-bg-overlay": "#cdedf5",
          "--dsw-alias-bg-skeleton": "#1942531a",
          "--dsw-alias-card-fill": "#ffffff",
          "--dsw-alias-card-fill-hover": "#e0f6fb",
          "--dsw-alias-interactive-bg-hover": "#D6F0F6",
          "--dsw-alias-interactive-bg-active": "#D2EEF4",
          "--dsw-alias-interactive-bg-hover-solid": "#e0f6fb",
          "--dsw-alias-border-l1": "#00232c14",
          "--dsw-alias-border-l2": "#d5eef4",
          "--dsw-alias-border-l3": "#bce7ef",
          "--dsw-alias-border-l4": "#bce7ef",
          "--dsw-alias-border-selected": "#194253",
          "--dsw-alias-label-primary": "#00232ce6",
          "--dsw-alias-label-secondary": "#00232cb3",
          "--dsw-alias-label-tertiary": "#00232c80",
          "--dsw-alias-label-caption": "#00232c4d",
          "--dsw-alias-label-dimmed": "#00232c4d",
          "--dsw-alias-link": "#194253",
          "--dsw-alias-button-info-fill": "#194253",
          "--dsw-alias-button-info-hover": "#74b4c8",
          "--dsw-alias-button-primary-fill": "#194253",
          "--dsw-alias-button-primary-hover": "#0f2f3d",
          "--dsw-alias-markdown-inline-code": "#E5FAFF",
          "--dsw-alias-markdown-code-block": "#E5FAFF",
          "--dsw-alias-markdown-code-block-banner": "#E5FAFF",
          "--dsw-alias-markdown-tag": "#cdedf5",
          "--dsw-alias-switch-thumb": "#f7f8f9",
          "--dsw-alias-scrollbar-bg-l1": "#00232c33",
          "--dsw-alias-scrollbar-bg-l2": "#00232c1f",
          "--dsw-alias-scrollbar-hover-l1": "#00232c4d",
          "--dsw-alias-scrollbar-hover-l2": "#00232c4d",
          "--dsw-specific-sidebar-fill": "#E5FAFF",
          "--dsw-specific-input-major": "#EAF7FA",
          "--dsw-specific-menu": "#ffffff",
          "--dsw-specific-selector": "#E5FAFF",
          "--dsw-specific-tip": "#00232ce6",
          "--dsw-specific-login-input": "#EAF7FA"
        }
      }
    ]
    // <dsh-workbuddy-skins:end>

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

/* 字号密度档：data-dsh-wb-density 由设置页写入。
   标准档不动，继续跟随宿主设置里的字号调节（--dsh-content-font-*）。 */
[data-dsh-wb][data-dsh-wb-density="compact"] { --wb-fs-body: 13px; --wb-lh-body: 21px; }
[data-dsh-wb][data-dsh-wb-density="roomy"] { --wb-fs-body: 15px; --wb-lh-body: 23px; }

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
  font-size: var(--wb-fs-body);
  line-height: var(--wb-lh-body);
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
  font-size: var(--wb-fs-body);
  line-height: var(--wb-lh-body);
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
     ._checkbox_1wz3s_1    复选框，input 16×16，accent-color
   原生 accent-color 的勾色固定按填充亮度走（亮绿=黑勾），所以复选框
   在下面改成自绘绿底白勾；开关仍用 accent-color 的思路，直接上品牌绿。 */

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

/* 复选框：自绘绿底白勾。
   accent-color 的勾色由浏览器按填充色亮度决定，#00c29a 属中亮度，勾必是黑的，
   勾色无法单独改，所以对真实 input 关掉原生外观自己画。
   未勾态描边用 border-l3（与开关关闭态轨道同档），勾选态底色吃 --wb-control-on。
   宿主 ._checkbox_1wz3s_1 input 是 16×16 裸 input，尺寸仍由宿主管，
   这里只管外观；勾的 SVG 用百分比缩放，非 16px 的框也不会变形。
   没匹配到真实 input 的 DOM（宿主自绘的假复选框）不受影响，维持原状。 */
[data-dsh-wb] ._checkbox_1wz3s_1 input[type="checkbox"],
[data-dsh-wb] input[type="checkbox"] {
  appearance: none;
  margin: 0;
  /* 无类名的裸 input（如 dsh-codebuddy-cli 的勾选行）尺寸全靠原生外观撑着，
     关掉 appearance 会塌成 0 宽、描边挤成一条竖线。用 min 兜底：
     宿主 ._checkbox_1wz3s_1 的显式 16px 仍然优先。 */
  min-width: 13px;
  min-height: 13px;
  flex: none;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 3px;
  background: transparent;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 62.5%;
  cursor: inherit;
}

[data-dsh-wb] input[type="checkbox"]:checked {
  border-color: var(--wb-control-on);
  background-color: var(--wb-control-on);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5l3 3 6-7' fill='none' stroke='%23ffffff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

[data-dsh-wb] input[type="checkbox"]:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
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
    /* 常驻小部件层：设置页与四个槽位小部件的样式，只覆盖 .dsh-wb-* 命名空间类名。
       不受主题开关控制 —— 否则开关一关，结构层整个撤掉，设置页自己的
       分段按钮就退化成裸的原生 button（鸡生蛋：关主题关掉了关主题的界面）。
       颜色全走宿主原生 --dsw-alias-* 别名：关掉时自动回落成宿主灰，
       开着时被令牌层重排成 WorkBuddy 色，两层互不干扰。 */
    const WIDGET_CSS = `
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
.dsh-wb-row-stack { flex-direction: column; align-items: stretch; gap: 12px; }
.dsh-wb-skins {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.dsh-wb-skin-card {
  position: relative;
  display: block;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.dsh-wb-skin-card:hover { border-color: var(--dsw-alias-border-l3); box-shadow: 0 2px 8px rgb(0 0 0 / 7%); }
.dsh-wb-skin-card.is-on { border-color: var(--bk-accent); box-shadow: inset 0 0 0 1px var(--bk-accent); }
.dsh-wb-skin-thumb {
  height: 104px;
  padding: 9px;
  box-sizing: border-box;
  background-color: var(--bk-bg);
}
.dsh-wb-skin-win {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--bk-line);
  border-radius: 6px;
  background-color: var(--bk-card);
  box-shadow: 0 1px 3px rgb(20 30 50 / 8%);
}
.dsh-wb-skin-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 3px;
  height: 12px;
  padding: 0 6px;
  border-bottom: 1px solid var(--bk-line);
}
.dsh-wb-skin-bar i { width: 3px; height: 3px; border-radius: 50%; background: currentColor; opacity: .28; }
.dsh-wb-skin-body { flex: 1; display: flex; min-height: 0; }
.dsh-wb-skin-side {
  flex: none;
  width: 36px;
  padding: 7px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--bk-side);
}
.dsh-wb-skin-side i { display: block; height: 3px; border-radius: 2px; background: currentColor; opacity: .18; }
.dsh-wb-skin-ava { width: 9px; height: 9px; margin-bottom: 1px; border-radius: 50%; background-color: var(--bk-accent); opacity: .85; }
.dsh-wb-skin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 8px 6px;
}
.dsh-wb-skin-main > i { height: 3px; border-radius: 2px; background: currentColor; opacity: .16; }
.dsh-wb-skin-main > i.l1 { width: 78%; }
.dsh-wb-skin-main > i.l2 { width: 56%; }
.dsh-wb-skin-bub {
  align-self: flex-end;
  width: 58%;
  height: 13px;
  box-sizing: border-box;
  border: 1px solid var(--bk-line);
  border-radius: 5px 5px 2px 5px;
  background-color: var(--bk-bubble);
}
.dsh-wb-skin-composer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 14px;
  padding: 0 3px;
  border: 1px solid var(--bk-line);
  border-radius: 5px;
  background-color: var(--bk-card);
}
.dsh-wb-skin-composer span { width: 12px; height: 7px; border-radius: 3.5px; background-color: var(--bk-accent); }
.dsh-wb-skin-cap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px 8px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dsh-wb-skin-name { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); }
.dsh-wb-skin-sub { margin-left: auto; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); }
.dsh-wb-skin-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--bk-accent);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}
.dsh-wb-pet-chip { display: inline-flex; align-items: center; gap: 8px; }
.dsh-wb-pet-thumb {
  flex: none;
  width: 30px;
  height: 33px;
  border-radius: 6px;
  background-color: var(--dsw-alias-interactive-bg-hover);
  background-repeat: no-repeat;
}
.dsh-wb-pet-name { font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-primary); }
.dsh-wb-pet-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.dsh-wb-pet-list { display: flex; flex-wrap: wrap; gap: 8px; }
.dsh-wb-pet-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 3px 10px 3px 4px;
  border: .5px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background-color: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
.dsh-wb-pet-option:hover { background-color: var(--dsw-alias-interactive-bg-hover); }
.dsh-wb-pet-option.is-on {
  border-color: var(--wb-control-on);
  box-shadow: inset 0 0 0 1px var(--wb-control-on);
}
.dsh-wb-pet-option:focus-visible { outline: 2px solid var(--wb-control-on); outline-offset: 2px; }

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
/* 进行中的会话（行首宿主状态点 data-state=ongoing）把尾点点亮成主题色；
   等审批/等回答（warning）用宿主告警色，两者可区分；完成/空闲保持灰色。 */
html[data-dsh-wb] [data-row-key^="session:"]:has([data-state="ongoing"]) .dsh-wb-dot {
  background-color: var(--wb-control-on);
  opacity: 1;
}
html[data-dsh-wb] [data-row-key^="session:"]:has([data-state="warning"]) .dsh-wb-dot {
  background-color: var(--dsw-alias-state-warn-primary);
  opacity: 1;
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
  position: relative;
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

/* ============ 30. 切换淡入淡出 ============
   主题开关与交互色/密度切换都走 document.startViewTransition，
   这里把默认 ~250ms 收到 200ms。不支持的宿主直接跳过动画、即时切换。 */
::view-transition-old(root),
::view-transition-new(root) { animation-duration: .2s; }

/* ============ 31. 控件预览与适配告警 ============
   设置页底部的控件全家福：一格一件，主题生效时按主题渲染、
   关闭时回落宿主原生，哪格不对就说明哪处坏了。
   琥珀色告警（#b45309/#d97706）在明暗两态都成立。 */
.dsh-wb-stat-warn {
  color: #b45309;
  background-color: transparent;
  border: .5px solid #d97706;
}
.dsh-wb-stat-warn .dsh-wb-stat-value { color: inherit; }

.dsh-wb-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 12px;
  border: .5px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
}
.dsh-wb-preview-item { display: flex; flex-direction: column; gap: 6px; }
.dsh-wb-preview-label { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.dsh-wb-preview-row { display: flex; align-items: center; gap: 10px; min-height: 24px; }
.dsh-wb-swatch {
  width: 24px;
  height: 16px;
  border-radius: 4px;
  border: .5px solid rgb(128 128 128 / 30%);
}

/* ============ 32. 宠物联动 ============
   宠物图由本插件宿主端直接从 ~/.codex/pets 读出，主题只负责摆位：
   新会话（composerHero 布局）把宠物摆在输入卡右上角，脚踩边框。 */
.dsh-wb-perch {
  display: none;
  position: absolute;
  right: 18px;
  bottom: 100%;
  margin-bottom: -10px;
  width: 72px;
  height: 78px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background-color: transparent;
  background-repeat: no-repeat;
  cursor: pointer;
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 12%));
}
.dsh-wb-perch:focus-visible { outline: 2px solid var(--wb-control-on); outline-offset: 2px; }
/* 悬浮/聚焦时播一次第 4 行「挥手」（4 帧，与 Codex 原生宠物一致）；
   72px 宽对应单元格 72×78，行 3 的纵向偏移固定 -234px。 */
html[data-dsh-wb-pet="on"] .an3WzG_composerHero .dsh-wb-perch:hover,
html[data-dsh-wb-pet="on"] .an3WzG_composerHero .dsh-wb-perch:focus-visible {
  animation: dsh-wb-perch-wave .7s steps(4, end) 1;
}
@keyframes dsh-wb-perch-wave {
  from { background-position: 0 -234px; }
  to { background-position: -288px -234px; }
}
@media (prefers-reduced-motion: reduce) {
  html[data-dsh-wb-pet="on"] .an3WzG_composerHero .dsh-wb-perch:hover,
  html[data-dsh-wb-pet="on"] .an3WzG_composerHero .dsh-wb-perch:focus-visible { animation: none; }
}
html[data-dsh-wb-pet="on"] .an3WzG_composerHero .dsh-wb-perch { display: block; }


/* ============ 33. 模型品牌图标 ============
   DSH 模型菜单在名字 span 上带 data-provider-id / data-model-id（ModelSelect
   的 renderModelLabel），这里按 id 关键字挂 WorkBuddy 同款 16px 品牌图标。
   用 mask + currentColor：明暗、hover、选中态全部自动跟随文字色。
   覆盖三处：输入框右下角的模型触发器、根菜单当前值、模型列表行。 */
html[data-dsh-wb] :is([role="menuitem"], [role="menuitemradio"], button[aria-haspopup="menu"]) [data-model-id][data-provider-id]::before {
  content: "";
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  vertical-align: -2px;
  background-color: currentColor;
  -webkit-mask: var(--dsh-wb-brand-icon) center / 14px 14px no-repeat;
  mask: var(--dsh-wb-brand-icon) center / 14px 14px no-repeat;
}
html[data-dsh-wb] [data-model-id][data-provider-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMSAwLjUgMC40OTg1OTYpIiBkPSJNMTIuODAzMyAyLjE5NjdDMTQuMjY3OCAzLjY2MTIgMTUgNS40Mjg5IDE1IDcuNUMxNSA5LjU3MTEgMTQuMjY3OCAxMS4zMzg4IDEyLjgwMzMgMTIuODAzM0MxMS4zMzg4IDE0LjI2NzggOS41NzExIDE1IDcuNSAxNUM1LjQyODkgMTUgMy42NjEyIDE0LjI2NzggMi4xOTY3IDEyLjgwMzNDMC43MzIyIDExLjMzODggMCA5LjU3MTEgMCA3LjVDMCA1LjQyODkgMC43MzIyIDMuNjYxMiAyLjE5NjcgMi4xOTY3QzMuNjYxMiAwLjczMjIgNS40Mjg5IDAgNy41IDBDOS41NzExIDAgMTEuMzM4OCAwLjczMjIgMTIuODAzMyAyLjE5NjdaTTEzLjU3IDUuNzUyNUMxMy4yODkgNC43NDM1IDEyLjc1MDYgMy44NDEgMTEuOTU0OCAzLjA0NTJDMTAuNzI0NiAxLjgxNTEgOS4yMzk3IDEuMiA3LjUgMS4yQzUuNzYwMyAxLjIgNC4yNzU0IDEuODE1MSAzLjA0NTIgMy4wNDUyQzEuODE1MSA0LjI3NTQgMS4yIDUuNzYwMyAxLjIgNy41QzEuMiA5LjE5OSAxLjc4NjYgMTAuNjU0OSAyLjk1OTggMTEuODY3OUwyLjk2MDEgMTEuODY3NkMzLjAzNTcgMTEuNzgxNCAzLjAzODIgMTEuNzc3OCAzLjAyMTYgMTEuNjMyOEMyLjk5NDMgMTEuMzk1NiAyLjk4MTkgMTEuMDQ0NCAyLjk5NDQgMTAuODE3OEwzLjAwNDMgMTAuNjA2MUwyLjY4NjQgMTAuMDQ0QzIuMTk0MyA5LjE2ODMgMS44ODE3IDguNDMyOSAxLjc2MTEgNy44NzEyQzEuNjk3NCA3LjU2MzEgMS43MDE0IDcuNDI2NCAxLjc3OTYgNy4zMjUzQzEuODI3MiA3LjI2NDIgMS45ODMyIDcuMjAxIDIuMTcxNCA3LjE2NjNDMi42NDUyIDcuMDgzMSAzLjY3ODIgNy4xNTgzIDQuODI3NiA3LjM2MTJMNC45NDcxIDcuMzgxOUw1LjIwOTQgNy4xNDk4QzUuNjQ0OSA2Ljc2NCA1LjkzNDMgNi41NDc3IDYuNDY3OCA2LjIxNTFDNy4wMjM4IDUuODY3MiA3LjY1MTIgNS41ODExIDguMzU3OCA1LjM1NDVMOC41ODQ2IDUuMjgxOEw4LjcwOTEgNC45NTQ3QzkuMTU1MyAzLjc3NjcgOS42MTIzIDIuOTA4MyA5LjkzODEgMi42MTk1QzEwLjA1MDMgMi41MTg5IDEwLjA1NyAyLjUxNSAxMC4xMzkyIDIuNTEwMUMxMC4yNzI0IDIuNTAwMyAxMC4zOTQ0IDIuNTY0MyAxMC42MDIxIDIuNzUzNEMxMS4wODczIDMuMTk0MiAxMS43NjI5IDQuMTAwNiAxMi4xODI5IDQuODc0N0wxMi4zNDUxIDUuMTc1MUwxMi41NzQzIDUuMjg5MUMxMi43OTU3IDUuNDAwOSAxMy4xNTg3IDUuNjMwMiAxMy4zMTAzIDUuNzUzMUMxMy4zNzg4IDUuODA5OCAxMy4zODg1IDUuODExIDEzLjQ1OTggNS43ODMyQzEzLjQ5NDkgNS43Njk1IDEzLjUzMTcgNS43NTkzIDEzLjU3IDUuNzUyNVpNMTMuNjkwNCA4LjcyNjZDMTMuNjA3IDguNTY5MSAxMy40OTU4IDguMzc2NiAxMy4zNDY0IDguMTE3OUMxMy4wNTQ5IDcuNjEyOSAxMi45MDkxIDcuMzYwNCAxMi43NDY4IDcuMTc1N0MxMi4wODg2IDYuNDI2NyAxMS4wMzY0IDYuMTQ0OCAxMC4wOTE5IDYuNDY0NEM5Ljg1OSA2LjU0MzEgOS42MDY2IDYuNjg4OSA5LjEwMTYgNi45ODA0TDYuMjAwNSA4LjY1NTNDNS42OTU1IDguOTQ2OSA1LjQ0MzEgOS4wOTI2IDUuMjU4NCA5LjI1NUM0LjUwOTQgOS45MTMyIDQuMDgzMiAxMS4wMjE3IDQuNDAyOCAxMS45NjYyQzQuNDgwOCAxMi4xOTY3IDQuNjI0NyAxMi40NDYgNC45MTA0IDEyLjk0MDhMNC45MjgyIDEyLjk3MTVDNS4wMTc5IDEzLjEyNjkgNS4wOTM2IDEzLjI1ODEgNS4xNjAzIDEzLjM3MDZDNS44ODA5IDEzLjY1NjkgNi42NjA4IDEzLjggNy41IDEzLjhDOS4yMzk3IDEzLjggMTAuNzI0NiAxMy4xODQ5IDExLjk1NDggMTEuOTU0OEMxMi44ODUxIDExLjAyNDQgMTMuNDYzNiA5Ljk0ODQgMTMuNjkwNCA4LjcyNjZaTTExLjAwMDQgOC44MzkzUTEwLjg4IDguNjMwOSAxMC42NDc1IDguNTY4NlExMC40MTQ5IDguNTA2MiAxMC4yMDY1IDguNjI2NlE5Ljk5OCA4Ljc0NyA5LjkzNTcgOC45Nzk1UTkuODczNCA5LjIxMiA5Ljk5MzcgOS40MjA1TDEwLjU3OTQgMTAuNDM0OVExMC42MzcyIDEwLjUzNSAxMC43Mjg5IDEwLjYwNTRRMTAuODIwNyAxMC42NzU4IDEwLjkzMjMgMTAuNzA1N1ExMS4wNDQgMTAuNzM1NiAxMS4xNTg2IDEwLjcyMDVRMTEuMjczMiAxMC43MDU1IDExLjM3MzMgMTAuNjQ3N1ExMS40NzM0IDEwLjU4OTkgMTEuNTQzOCAxMC40OTgxUTExLjYxNDIgMTAuNDA2NCAxMS42NDQxIDEwLjI5NDhRMTEuNjc0IDEwLjE4MzEgMTEuNjU4OSAxMC4wNjg1UTExLjY0MzggOS45NTM5IDExLjU4NiA5Ljg1MzhMMTEuMDAwNCA4LjgzOTNaTTcuNjI5NyAxMC4zMTE3UTcuNTE4IDEwLjI4MTggNy40MDM0IDEwLjI5NjlRNy4yODg4IDEwLjMxMiA3LjE4ODcgMTAuMzY5OFE3LjA4ODYgMTAuNDI3NiA3LjAxODIgMTAuNTE5M1E2Ljk0NzggMTAuNjExIDYuOTE3OSAxMC43MjI3UTYuODg4IDEwLjgzNDMgNi45MDMxIDEwLjk0ODlRNi45MTgxIDExLjA2MzYgNi45NzU5IDExLjE2MzdMNy41NjE2IDEyLjE3ODFRNy42ODIgMTIuMzg2NiA3LjkxNDUgMTIuNDQ4OVE4LjE0NyAxMi41MTEyIDguMzU1NSAxMi4zOTA4UTguNDU1NiAxMi4zMzMgOC41MjYgMTIuMjQxM1E4LjU5NjQgMTIuMTQ5NiA4LjYyNjMgMTIuMDM3OVE4LjY1NjIgMTEuOTI2MyA4LjY0MTEgMTEuODExNlE4LjYyNiAxMS42OTcgOC41NjgyIDExLjU5NjlMNy45ODI2IDEwLjU4MjVRNy45MjQ4IDEwLjQ4MjQgNy44MzMgMTAuNDEyUTcuNzQxMyAxMC4zNDE2IDcuNjI5NyAxMC4zMTE3WiIvPjwvc3ZnPg=="); }
/* deepseek */
html[data-dsh-wb] [data-model-id*="deepseek" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="deepseek" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTciIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2xpcFBhdGggaWQ9IndiLWRlZXBzZWVrLWNsaXAiPjxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPjwvY2xpcFBhdGg+PGcgY2xpcC1wYXRoPSJ1cmwoI3diLWRlZXBzZWVrLWNsaXApIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMCAxLjkyNzUyKSIgZD0iTTE1LjgzMTggMS4wMDg3QzE1LjY2MjQgMC45MjQgMTUuNTg5MyAxLjA4NTUgMTUuNDkwMyAxLjE2NzZDMTUuNDU2NSAxLjE5NDEgMTUuNDI3OCAxLjIyODUgMTUuMzk5IDEuMjYwM0MxNS4xNTE0IDEuNTMwMyAxNC44NjIxIDEuNzA3NyAxNC40ODM4IDEuNjg2NUMxMy45MzExIDEuNjU0OCAxMy40NTkxIDEuODMyMiAxMy4wNDIxIDIuMjYzN0MxMi45NTM0IDEuNzMxNSAxMi42NTg5IDEuNDEzOCAxMi4yMTA0IDEuMjA5OUMxMS45NzU0IDEuMTA0IDExLjczODQgMC45OTgxIDExLjU3MzkgMC43Njc4QzExLjQ1OTQgMC42MDM2IDExLjQyODMgMC40MjA5IDExLjM3MDcgMC4yNDA5QzExLjMzNDMgMC4xMzIzIDExLjI5NzkgMC4wMjExIDExLjE3NTUgMC4wMDI2QzExLjA0MjEgLTAuMDE4NiAxMC45OTAxIDAuMDk1MiAxMC45Mzc4IDAuMTkwNkMxMC43MjkzIDAuNTc5OCAxMC42NDgyIDEuMDA4NyAxMC42NTY1IDEuNDQzQzEwLjY3NDQgMi40MiAxMS4wNzg4IDMuMTk4NCAxMS44ODE3IDMuNzUxOEMxMS45NzMxIDMuODE1MyAxMS45OTY2IDMuODc4OSAxMS45Njc4IDMuOTcxNUMxMS45MTMyIDQuMTYyMiAxMS44NDc3IDQuMzQ3NSAxMS43OTA0IDQuNTM4MkMxMS43NTQgNC42NiAxMS42OTk0IDQuNjg2NCAxMS41NzEzIDQuNjMzNUMxMS4xMzA4IDQuNDQ1NSAxMC43NTAyIDQuMTY3NSAxMC40MTM2IDMuODMxMkM5Ljg0MjcgMy4yNjcyIDkuMzI2MyAyLjY0NSA4LjY4MjYgMi4xNTc4QzguNTMzNiAyLjA0NTUgOC4zODA0IDEuOTM4NiA4LjIyMzUgMS44Mzc1QzcuNTY2NiAxLjE4NjEgOC4zMDk2IDAuNjUxMyA4LjQ4MTcgMC41ODc3QzguNjYxNCAwLjUyMTUgOC41NDQzIDAuMjkzOCA3Ljk2MjcgMC4yOTY1QzcuMzgxMiAwLjI5OTEgNi44NDk0IDAuNDk3NyA2LjE3MTUgMC43NjI1QzYuMDcyMyAwLjgwMjIgNS45NjggMC44MzEzIDUuODYxNCAwLjg1NTJDNS4yNDU4IDAuNzM2IDQuNjA3MSAwLjcwOTUgMy45Mzk1IDAuNzg2M0MyLjY4MjggMC45MjkzIDEuNjc5IDEuNTM1NiAwLjk0MDkgMi41NzA5QzAuMDU0NiAzLjgxNTMgLTAuMTU0MyA1LjIyOTIgMC4xMDE2IDYuNzA0QzAuMzY5NyA4LjI1ODMgMS4xNDcxIDkuNTQ1MSAyLjM0MTIgMTAuNTUxMkMzLjU3OTcgMTEuNTk0NCA1LjAwNTkgMTIuMTA1NCA2LjYzMjkgMTIuMDA3NUM3LjYyMTIgMTEuOTQ5MiA4LjcyMTMgMTEuODE0MiA5Ljk2MjUgMTAuNzQxOUMxMC4yNzU1IDEwLjkwMDcgMTAuNjA0MiAxMC45NjQzIDExLjE0OSAxMS4wMTE5QzExLjU2OSAxMS4wNTE2IDExLjk3MzEgMTAuOTkwNyAxMi4yODU5IDEwLjkyNDVDMTIuNzc2IDEwLjgxODYgMTIuNzQxOSAxMC4zNTUzIDEyLjU2NDkgMTAuMjcwNUMxMS4xMjgxIDkuNTg3NCAxMS40NDM1IDkuODY1NCAxMS4xNTY5IDkuNjQwNEMxMS44ODcgOC43NTg3IDEyLjk4NzIgNy44NDI1IDEzLjQxNzQgNC44NzQ0QzEzLjQ1MTUgNC42Mzg4IDEzLjQyMjcgNC40OTA1IDEzLjQxNzQgNC4yOTk5QzEzLjQxNDggNC4xODM0IDEzLjQ0MDYgNC4xMzgzIDEzLjU3MTQgNC4xMjUxQzEzLjkzMTEgNC4wODI4IDE0LjI4MDYgMy45ODIxIDE0LjYwMTMgMy44MDIxQzE1LjUzMiAzLjI4MzEgMTUuOTA3NiAyLjQzMDYgMTUuOTk2MyAxLjQwODVDMTYuMDA5NiAxLjI1MjMgMTUuOTkzNyAxLjA5MDggMTUuODMxOCAxLjAwODdaTTcuNzIwMiAxMC4yMDdDNi4zMjgxIDkuMDg5NiA1LjY1MjYgOC43MjE2IDUuMzczNiA4LjczNzVDNS4xMTI4IDguNzUzNCA1LjE1OTggOS4wNTc5IDUuMjE3IDkuMjU2NEM1LjI3NjkgOS40NTI0IDUuMzU1NCA5LjU4NzQgNS40NjQ5IDkuNzU5NUM1LjU0MDQgOS44NzM0IDUuNTkyNyAxMC4wNDI4IDUuMzg5MSAxMC4xNjk5QzQuOTQwNyAxMC40NTMyIDQuMTYxMiAxMC4wNzQ2IDQuMTI0OCAxMC4wNTYxQzMuMjE3MyA5LjUxMDYgMi40NTg0IDguNzkwNCAxLjkyMzkgNy44MDU1QzEuNDA3NiA2Ljg1NzYgMS4xMDgxIDUuODQwOSAxLjA1ODQgNC43NTUzQzEuMDQ1MiA0LjQ5MzIgMS4xMjEgNC40MDA1IDEuMzc2MiA0LjM1MjhDMS43MTIyIDQuMjg3MyAyLjA1NjggNC4yNzg0IDIuMzk1OCA0LjMyNjRDMy44MTcgNC41MzgyIDUuMDI3MSA1LjE4NjkgNi4wNDExIDYuMjE0MkM2LjYyIDYuNzk5MyA3LjA1NzkgNy40OTg0IDcuNTA5MyA4LjE4MTVDNy45ODg5IDguOTA2OSA4LjUwNTIgOS41OTggOS4xNjIyIDEwLjE2NDZDOS4zOTQyIDEwLjM2MzIgOS41NzkyIDEwLjUxNDEgOS43NTY2IDEwLjYyNTNDOS4yMjIxIDEwLjY4NjIgOC4zMzAxIDEwLjY5OTUgNy43MjAyIDEwLjIwN1pNOC4zODc3IDUuODI1QzguMzg3NyA1LjcwODUgOC40NzkxIDUuNjE1OCA4LjU5MzkgNS42MTU4QzguNjE5OSA1LjYxNjIgOC42NDMzIDUuNjIwNyA4LjY2NDEgNS42MjlDOC43MDM2IDUuNjQ0MiA4LjczNzUgNS42NzExIDguNzYxMyA1LjcwNjFDOC43ODUxIDUuNzQxMiA4Ljc5NzYgNS43ODI2IDguNzk3MSA1LjgyNUM4Ljc5NzUgNS44NTIzIDguNzkyNCA1Ljg3OTMgOC43ODIyIDUuOTA0N0M4Ljc3MjEgNS45MyA4Ljc1NyA1Ljk1MyA4LjczNzggNS45NzI1QzguNzE4NyA1Ljk5MTkgOC42OTU5IDYuMDA3NCA4LjY3MDcgNi4wMThDOC42NDU1IDYuMDI4NiA4LjYxODUgNi4wMzQxIDguNTkxMiA2LjAzNDFDOC41NjQxIDYuMDM0MSA4LjUzNzIgNi4wMjg2IDguNTEyMSA2LjAxNzlDOC40ODcxIDYuMDA3MyA4LjQ2NDUgNS45OTE4IDguNDQ1NSA1Ljk3MjRDOC40MjY1IDUuOTUyOSA4LjQxMTcgNS45Mjk4IDguNDAxNyA1LjkwNDVDOC4zOTE4IDUuODc5MiA4LjM4NyA1Ljg1MjEgOC4zODc3IDUuODI1Wk0xMC40NjA2IDYuOTEwNkMxMC4zMjc4IDYuOTY2MiAxMC4xOTQ4IDcuMDEzOCAxMC4wNjY3IDcuMDE5MUM5Ljg2ODggNy4wMjk3IDkuNjUyMyA2Ljk0NzYgOS41MzUyIDYuODQ3QzkuMzUyNSA2LjY5MDggOS4yMjIxIDYuNjAzNCA5LjE2NzQgNi4zMzA3QzkuMTQ0IDYuMjE0MiA5LjE1NjkgNi4wMzQyIDkuMTc3NyA1LjkzMDlDOS4yMjQ3IDUuNzA4NSA5LjE3MjQgNS41NjU1IDkuMDE4OSA1LjQzNThDOC44OTM4IDUuMzI5OCA4LjczNDYgNS4zMDA3IDguNTU5OCA1LjMwMDdDOC40OTQ2IDUuMzAwNyA4LjQzNDcgNS4yNzE2IDguMzkwNCA1LjI0NzhDOC4zNjg4IDUuMjM3NCA4LjM0OTUgNS4yMjI3IDguMzMzOSA1LjIwNDZDOC4zMTgyIDUuMTg2NSA4LjMwNjUgNS4xNjUzIDguMjk5NCA1LjE0MjVDOC4yOTIzIDUuMTE5NiA4LjI5IDUuMDk1NSA4LjI5MjcgNS4wNzE3QzguMjk1NCA1LjA0NzkgOC4zMDI5IDUuMDI0OSA4LjMxNDkgNS4wMDQyQzguMzMzMSA0Ljk2NzEgOC40MjE4IDQuODc3MSA4LjQ0MjcgNC44NjEyQzguNjc5OSA0LjcyMzUgOC45NTM3IDQuNzY4NSA5LjIwNjUgNC44NzE4QzkuNDQxMiA0Ljk2OTcgOS42MTgyIDUuMTQ5OCA5Ljg3NDEgNS40MDRDMTAuMTM0OSA1LjcxMTEgMTAuMTgxOSA1Ljc5NTkgMTAuMzMwMiA2LjAyNjJDMTAuNDQ3NyA2LjIwNjIgMTAuNTU0NiA2LjM5MTYgMTAuNjI3NCA2LjYwMzRDMTAuNjcyIDYuNzM1OCAxMC42MTQ1IDYuODQ0MyAxMC40NjA2IDYuOTEwNloiLz48L2c+PC9zdmc+"); }
/* openai */
html[data-dsh-wb] [data-model-id*="gpt" i][data-provider-id], html[data-dsh-wb] [data-model-id^="o1" i][data-provider-id], html[data-dsh-wb] [data-model-id^="o3" i][data-provider-id], html[data-dsh-wb] [data-model-id^="o4" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="openai" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtb3BhY2l0eT0iMC45IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMC41IDAuNTYpIiBkPSJNNS43NTMxIDUuNDExM0w1Ljc1MzEgMy45OTg3QzUuNzUzMSAzLjg4IDUuNzk4MSAzLjc5MDYgNS45MDE5IDMuNzMxM0w4Ljc0MTIgMi4wOTYzQzkuMTI4MSAxLjg3MzEgOS41ODg4IDEuNzY5NCAxMC4wNjQ0IDEuNzY5NEMxMS44NDgxIDEuNzY5NCAxMi45NzgxIDMuMTUxOSAxMi45NzgxIDQuNjIzMUMxMi45NzgxIDQuNzI3NSAxMi45NzgxIDQuODQ2MyAxMi45NjMxIDQuOTY1TDEwLjAxOTQgMy4yNDA2QzkuOTM5NCAzLjE4OTcgOS44NDY2IDMuMTYyNyA5Ljc1MTkgMy4xNjI3QzkuNjU3MSAzLjE2MjcgOS41NjQzIDMuMTg5NyA5LjQ4NDQgMy4yNDA2TDUuNzUzMSA1LjQxMTNaTTEyLjM4MzggMTAuOTExM0wxMi4zODM4IDcuNTM3NUMxMi4zODM3IDcuMzI5NCAxMi4yOTQ0IDcuMTgxMyAxMi4xMTU2IDcuMDc2OUw4LjM4NDQgNC45MDYyTDkuNjAzMSA0LjIwNzVDOS42NDczIDQuMTc4NCA5LjY5OSA0LjE2MyA5Ljc1MTkgNC4xNjNDOS44MDQ3IDQuMTYzIDkuODU2NSA0LjE3ODQgOS45MDA2IDQuMjA3NUwxMi43NCA1Ljg0MzFDMTMuNTU4MSA2LjMxODEgMTQuMTA4MSA3LjMyOTQgMTQuMTA4MSA4LjMxMDZDMTQuMTA4MSA5LjQ0MDYgMTMuNDM5NCAxMC40ODEyIDEyLjM4MzEgMTAuOTEyNUwxMi4zODM4IDEwLjkxMTNaTTQuODc2MyA3LjkzOTRMMy42NTc1IDcuMjI1NkMzLjU1MzEgNy4xNjYyIDMuNTA4MSA3LjA3NjkgMy41MDgxIDYuOTU4MUwzLjUwODEgMy42ODY5QzMuNTA4MSAyLjA5NjMgNC43MjY5IDAuODkxOSA2LjM3NzUgMC44OTE5QzcuMDAyNSAwLjg5MTkgNy41ODE5IDEuMSA4LjA3MjUgMS40NzE5TDUuMTQzNyAzLjE2NjlDNC45NjU2IDMuMjcwNiA0Ljg3NjMgMy40MTk0IDQuODc2MyAzLjYyNzVMNC44NzYzIDcuOTM4OEw0Ljg3NjMgNy45Mzk0Wk03LjUgOS40NTVMNS43NTMxIDguNDczOEw1Ljc1MzEgNi4zOTI1TDcuNSA1LjQxMTNMOS4yNDY5IDYuMzkyNUw5LjI0NjkgOC40NzM4TDcuNSA5LjQ1NVpNOC42MjI1IDEzLjk3MzhDNy45OTc1IDEzLjk3MzggNy40MTgxIDEzLjc2NjIgNi45Mjc1IDEzLjM5NDRMOS44NTYzIDExLjY5OTRDMTAuMDM0NCAxMS41OTU2IDEwLjEyMzcgMTEuNDQ2OSAxMC4xMjM3IDExLjIzODdMMTAuMTIzNyA2LjkyNzVMMTEuMzU3NSA3LjY0MTJDMTEuNDYxOSA3LjcwMDYgMTEuNTA2MyA3Ljc5IDExLjUwNjMgNy45MDg4TDExLjUwNjMgMTEuMTc5NEMxMS41MDYzIDEyLjc3IDEwLjI3MjUgMTMuOTczOCA4LjYyMjUgMTMuOTczOFpNNS4wOTk0IDEwLjY1OTRMMi4yNTk0IDkuMDIzN0MxLjQ0MTkgOC41NDgxIDAuODkxOSA3LjUzNzUgMC44OTE5IDYuNTU2MkMwLjg4OTkgNS45OTg3IDEuMDU0NCA1LjQ1MzMgMS4zNjQzIDQuOTg5N0MxLjY3NDIgNC41MjYyIDIuMTE1MyA0LjE2NTcgMi42MzEzIDMuOTU0NEwyLjYzMTMgNy4zNDM4QzIuNjMxMiA3LjU1MTkgMi43MjA2IDcuNzAwNiAyLjg5ODcgNy44MDVMNi42MTU2IDkuOTYwNkw1LjM5NjkgMTAuNjU5NEM1LjM1MjcgMTAuNjg4NSA1LjMwMSAxMC43MDQgNS4yNDgxIDEwLjcwNEM1LjE5NTIgMTAuNzA0IDUuMTQzNSAxMC42ODg1IDUuMDk5NCAxMC42NTk0Wk00LjkzNTYgMTMuMDk2OUMzLjI1NTYgMTMuMDk2OSAyLjAyMTkgMTEuODMzOCAyLjAyMTkgMTAuMjcyNUMyLjAyMTkgMTAuMTUzOCAyLjAzNjkgMTAuMDM1IDIuMDUxMiA5LjkxNjNMNC45OCAxMS42MUM1LjE1ODggMTEuNzE0NCA1LjMzNjkgMTEuNzE0NCA1LjUxNSAxMS42MUw5LjI0NjIgOS40NTVMOS4yNDYyIDEwLjg2NzVDOS4yNDYzIDEwLjk4NjIgOS4yMDI1IDExLjA3NTYgOS4wOTgxIDExLjEzNUw2LjI1ODggMTIuNzdDNS44NzE5IDEyLjk5MzEgNS40MTEzIDEzLjA5NjkgNC45MzU2IDEzLjA5NjlaTTguNjIyNSAxNC44NjU2QzkuNDc5MSAxNC44NjU3IDEwLjMwOTQgMTQuNTY5OSAxMC45NzMxIDE0LjAyODNDMTEuNjM2NyAxMy40ODY2IDEyLjA5MjggMTIuNzMyNCAxMi4yNjQ0IDExLjg5MzFDMTMuOTI5NCAxMS40NjE5IDE1IDkuOSAxNSA4LjMxQzE1IDcuMjY5NCAxNC41NTQ0IDYuMjU4NyAxMy43NTEzIDUuNTNDMTMuODI1NiA1LjIxNzUgMTMuODcgNC45MDU2IDEzLjg3IDQuNTkzOEMxMy44NyAyLjQ2ODEgMTIuMTQ1NiAwLjg3NjkgMTAuMTUzNyAwLjg3NjlDOS43NTI1IDAuODc2OSA5LjM2NjMgMC45MzYzIDguOTc4OCAxLjA3MDZDOC4yODUgMC4zODc4IDcuMzUxNiAwLjAwMzUgNi4zNzgxIDBDNS41MjE0IC0wIDQuNjkxIDAuMjk1OSA0LjAyNzQgMC44Mzc2QzMuMzYzOCAxLjM3OTQgMi45MDc3IDIuMTMzOCAyLjczNjIgMi45NzMxQzEuMDcwNiAzLjQwNDQgMCA0Ljk2NTYgMCA2LjU1NjJDMCA3LjU5NzUgMC40NDU2IDguNjA4MSAxLjI0ODcgOS4zMzYyQzEuMTc0NCA5LjY0ODggMS4xMyA5Ljk2MTMgMS4xMyAxMC4yNzMxQzEuMTMgMTIuMzk4OCAyLjg1NDQgMTMuOTg5NCA0Ljg0NjMgMTMuOTg5NEM1LjI0NzUgMTMuOTg5NCA1LjYzMzcgMTMuOTMgNi4wMjEyIDEzLjc5NjNDNi43MTUxIDE0LjQ3OTQgNy42NDg4IDE0Ljg2MzcgOC42MjI1IDE0Ljg2NjlMOC42MjI1IDE0Ljg2NTZaIi8+PC9zdmc+"); }
/* claude */
html[data-dsh-wb] [data-model-id*="claude" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="anthropic" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMC41OTg0NzUgMC41OTgwMSkiIGQ9Ik0yLjkwNTIgOS44NDQ0TDUuODE3OCA4LjIwODZMNS44NjU5IDguMDY4TDUuODE3OCA3Ljk5MDNMNS42NzcyIDcuOTkwM0w1LjE4ODYgNy45NjA3TDMuNTIzMiA3LjkxNjNMMi4wNzk5IDcuODU3TDAuNjgwOSA3Ljc4MzFMMC4zMjkzIDcuNzA5TDAgNy4yNzZMMC4wMzMzIDcuMDU3NkwwLjMyOTMgNi44NTc4TDAuNzUxMyA2Ljg5NDhMMS42ODc2IDYuOTU3N0wzLjA5MzkgNy4wNTM5TDQuMTExNyA3LjExMzJMNS42MjE2IDcuMjcyM0w1Ljg2MjMgNy4yNzIzTDUuODk1NiA3LjE3Nkw1LjgxNDEgNy4xMTY5TDUuNzUxMyA3LjA1NzZMNC4yOTY4IDYuMDczMkwyLjcyMzggNS4wMjk2TDEuODk4NiA0LjQzTDEuNDUwNyA0LjEyNjVMMS4yMjQ5IDMuODQxNkwxLjEyODggMy4yMTk4TDEuNTMyMiAyLjc3MkwyLjA3NjIgMi44MDlMMi4yMTMxIDIuODQ1OUwyLjc2NDYgMy4yNjc5TDMuOTQxNSA0LjE3ODNMNS40NzczIDUuMzEwOEw1LjcwMzEgNS40OTk1TDUuNzkxOSA1LjQzNjZMNS44MDMgNS4zOTIyTDUuNzAzMSA1LjIyMkw0Ljg2NjcgMy43MTJMMy45NzQ4IDIuMTc2MUwzLjU3ODcgMS41Mzk2TDMuNDc1MiAxLjE1ODNDMy40MzU5IDEuMDExIDMuNDE0NyAwLjg1OTMgMy40MTIyIDAuNzA2OEwzLjg3NDkgMC4wODE0TDQuMTMwMiAwTDQuNzQ0NSAwLjA4MTRMNS4wMDM2IDAuMzA3Mkw1LjM4NDkgMS4xODA1TDYuMDAyOSAyLjU1NzNMNi45NjE1IDQuNDI2M0w3LjI0MjYgNC45ODE0TDcuMzk0NCA1LjQ5NTlMNy40NSA1LjY1NUw3LjU0NjIgNS42NTVMNy41NDYyIDUuNTY2MUw3LjYyMzkgNC41MTE0TDcuNzY4MiAzLjIxOThMNy45MDg4IDEuNTU0NEw3Ljk1NyAxLjA4NDRMOC4xOTAxIDAuNTIxOEw4LjY1MjcgMC4yMTgzTDkuMDExNyAwLjM5MjJMOS4zMDc4IDAuODE0MUw5LjI2NzEgMS4wODgxTDkuMDg5NCAyLjIzMTdMOC43NDUzIDQuMDIyOUw4LjUxOTUgNS4yMjJMOC42NDkxIDUuMjIyTDguODAwOCA1LjA3MDNMOS40MDc3IDQuMjYzNUwxMC40MjU1IDIuOTkwM0wxMC44NzcgMi40ODMzTDExLjQwMjYgMS45MjQ0TDExLjczOTMgMS42NThMMTIuMzc1OSAxLjY1OEwxMi44NDU5IDIuMzUzOEwxMi42MzQ5IDMuMDcxN0wxMS45Nzk5IDMuOTA0NEwxMS40MzU5IDQuNjA3N0wxMC42NTQ5IDUuNjU4N0wxMC4xNjY0IDYuNDk4OEwxMC4yMTA4IDYuNTY1NEwxMC4zMjU2IDYuNTU0M0wxMi4wODcyIDYuMTgwNUwxMy4wMzgzIDYuMDA2NkwxNC4xNzQ1IDUuODEwNEwxNC42ODkgNi4wNTFMMTQuNzQ0NSA2LjI5NTNMMTQuNTQwOSA2Ljc5NDlMMTMuMzI3IDcuMDk0N0wxMS45MDIyIDcuMzc5Nkw5Ljc4MTYgNy44ODNMOS43NTU2IDcuOTAxNUw5Ljc4NTIgNy45Mzg1TDEwLjc0IDguMDI3M0wxMS4xNDcyIDguMDQ5NUwxMi4xNDY0IDguMDQ5NUwxNC4wMDggOC4xODY0TDE0LjQ5NjUgOC41MDg0TDE0Ljc4ODkgOC45MDA3TDE0Ljc0MDggOS4yMDA1TDEzLjk4OTUgOS41ODE3TDEyLjk3OTIgOS4zNDExTDEwLjYxNzkgOC43Nzg2TDkuODA3NCA4LjU3NUw5LjY5NjQgOC41NzVMOS42OTY0IDguNjQxNkwxMC4zNyA5LjMwMDRMMTEuNjA2IDEwLjQxODFMMTMuMTUzIDExLjg1NzhMMTMuMjMwOCAxMi4yMTNMMTMuMDMwOSAxMi40OTQzTDEyLjgyIDEyLjQ2NDdMMTEuNDU4MSAxMS40NDMyTDEwLjkzMjUgMTAuOTgwN0w5Ljc0NDUgOS45ODE0TDkuNjY2OCA5Ljk4MTRMOS42NjY4IDEwLjA4NUw5Ljk0MDYgMTAuNDg0NkwxMS4zODc3IDEyLjY1NzJMMTEuNDYxNyAxMy4zMjMzTDExLjM1ODIgMTMuNTQxN0wxMC45ODQzIDEzLjY3MTJMMTAuNTczNSAxMy41OTcyTDkuNzI2IDEyLjQwOTJMOC44NTI2IDExLjA2OTVMOC4xNDk0IDkuODcwNEw4LjA2NDMgOS45MTg0TDcuNjQ5OCAxNC4zOTY2TDcuNDUzNiAxNC42MjZMNy4wMDIxIDE0LjhMNi42Mjg0IDE0LjUxNUw2LjQyODUgMTQuMDUyNEw2LjYyODQgMTMuMTQyTDYuODY4OSAxMS45NTM5TDcuMDY1IDExLjAxMDJMNy4yNDI2IDkuODM3MUw3LjM0NjMgOS40NDg1TDcuMzM4OSA5LjQyMjVMNy4yNTM4IDkuNDMzNkw2LjM2OTMgMTAuNjQ3Nkw1LjAyMjEgMTIuNDY0N0wzLjk1NjIgMTMuNjA0NkwzLjcwMDkgMTMuNzA0NUwzLjI2MDUgMTMuNDc1TDMuMzAxMiAxMy4wNjhMMy41NDkyIDEyLjcwNTJMNS4wMjIxIDEwLjgzMjZMNS45MTAzIDkuNjcwNUw2LjQ4NCA5LjAwMDZMNi40ODQgOC45MDQ0TDYuNDQ3IDguOTA0NEwyLjUzNTEgMTEuNDQ3TDEuODM5MyAxMS41MzU4TDEuNTM5NiAxMS4yNTQ1TDEuNTc2NiAxMC43OTE5TDEuNzE3MiAxMC42NDAxTDIuODk0MSA5LjgyOTZMMi44OTA0IDkuODI5NkwyLjkwNTIgOS44NDQ0WiIvPjwvc3ZnPg=="); }
/* gemini */
html[data-dsh-wb] [data-model-id*="gemini" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="gemini" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMC42NjY2NjcgMC42Njg1OTkpIiBkPSJNMTMuMDc3NSA2LjU1NDdDMTEuOTcgNi4wODMzIDEwLjk2MyA1LjQwNDIgMTAuMTEwOCA0LjU1NDFDOC45MjQxIDMuMzY0OSA4LjA3NzQgMS44Nzk3IDcuNjU4OCAwLjI1MjdDNy42NDA0IDAuMTgwNSA3LjU5ODUgMC4xMTY0IDcuNTM5NyAwLjA3MDZDNy40ODA4IDAuMDI0OCA3LjQwODQgMCA3LjMzMzggMEM3LjI1OTMgMCA3LjE4NjggMC4wMjQ4IDcuMTI4IDAuMDcwNkM3LjA2OTEgMC4xMTY0IDcuMDI3MiAwLjE4MDUgNy4wMDg4IDAuMjUyN0M2LjU4OTMgMS44Nzk1IDUuNzQyNSAzLjM2NDYgNC41NTYyIDQuNTU0MUMzLjcwMzkgNS40MDQgMi42OTY5IDYuMDgzMSAxLjU4OTUgNi41NTQ3QzEuMTU2MSA2Ljc0MTQgMC43MTA4IDYuODkxNCAwLjI1NDggNy4wMDY3QzAuMTgyMSA3LjAyNDYgMC4xMTc1IDcuMDY2MyAwLjA3MTMgNy4xMjUyQzAuMDI1MSA3LjE4NDIgMCA3LjI1NjkgMCA3LjMzMTdDMCA3LjQwNjYgMC4wMjUxIDcuNDc5MyAwLjA3MTMgNy41MzgyQzAuMTE3NSA3LjU5NzEgMC4xODIxIDcuNjM4OSAwLjI1NDggNy42NTY3QzAuNzEwOCA3Ljc3MTQgMS4xNTQ4IDcuOTIxNCAxLjU4OTUgOC4xMDgxQzIuNjk3IDguNTc5NSAzLjcwNCA5LjI1ODYgNC41NTYyIDEwLjEwODdDNS43NDMyIDExLjI5OCA2LjU5MDEgMTIuNzgzNCA3LjAwODggMTQuNDEwN0M3LjAyNjcgMTQuNDgzNCA3LjA2ODQgMTQuNTQ4IDcuMTI3MyAxNC41OTQyQzcuMTg2MiAxNC42NDA0IDcuMjU4OSAxNC42NjU1IDcuMzMzOCAxNC42NjU1QzcuNDA4NyAxNC42NjU1IDcuNDgxNCAxNC42NDA0IDcuNTQwMyAxNC41OTQyQzcuNTk5MiAxNC41NDggNy42NDA5IDE0LjQ4MzQgNy42NTg4IDE0LjQxMDdDNy43NzM1IDEzLjk1NDEgNy45MjM1IDEzLjUxMDEgOC4xMTAxIDEzLjA3NTRDOC41ODE2IDExLjk2NzkgOS4yNjA3IDEwLjk2MDkgMTAuMTEwOCAxMC4xMDg3QzExLjMwMDIgOC45MjE5IDEyLjc4NTYgOC4wNzUzIDE0LjQxMjggNy42NTY3QzE0LjQ4NTEgNy42Mzg0IDE0LjU0OTIgNy41OTY0IDE0LjU5NDkgNy41Mzc2QzE0LjY0MDcgNy40Nzg3IDE0LjY2NTUgNy40MDYzIDE0LjY2NTUgNy4zMzE3QzE0LjY2NTUgNy4yNTcyIDE0LjY0MDcgNy4xODQ3IDE0LjU5NDkgNy4xMjU5QzE0LjU0OTIgNy4wNjcgMTQuNDg1MSA3LjAyNTEgMTQuNDEyOCA3LjAwNjdDMTMuOTU2NCA2Ljg5MTkgMTMuNTA5OCA2Ljc0MDcgMTMuMDc3NSA2LjU1NDdaIi8+PC9zdmc+"); }
/* kimi */
html[data-dsh-wb] [data-model-id*="kimi" i][data-provider-id], html[data-dsh-wb] [data-model-id*="moonshot" i][data-provider-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMSAxLjYgMi4wMDA5OSkiIGQ9Ik0xMy4zMzMxIDEuMzM1N0wxMy4zMzMxIDEuMzM1MUMxMy4zMzMgMS4xMTEyIDEzLjI3NjYgMC44OTEgMTMuMTY5MSAwLjY5NDZDMTMuMDYxNSAwLjQ5OCAxMi45MDYyIDAuMzMxNyAxMi43MTc1IDAuMjEwOEMxMi41Mjg4IDAuMDkgMTIuMzEyNyAwLjAxODYgMTIuMDg5MiAwLjAwMzJDMTEuODY1NiAtMC4wMTIzIDExLjY0MTggMC4wMjg4IDExLjQzODMgMC4xMjI1QzExLjIzNDcgMC4yMTYyIDExLjA1ODEgMC4zNTk3IDEwLjkyNDUgMC41Mzk2QzEwLjc5MDkgMC43MTk1IDEwLjcwNDcgMC45MzAxIDEwLjY3MzkgMS4xNTJDMTAuNjQzIDEuMzc0IDEwLjY2ODUgMS42MDAxIDEwLjc0NzkgMS44MDk3QzEwLjgyNzQgMi4wMTkyIDEwLjk1ODIgMi4yMDU0IDExLjEyODUgMi4zNTFDMTAuOTYyNSAyLjU3MSAxMC43NjE4IDIuODA0NCAxMC43NjE4IDIuODA0NEMxMC43NjE4IDIuODA0NCAxMS44MDI1IDIuNjcxIDExLjk5NzEgMi42NzExQzEyLjE3MjYgMi42NzExIDEyLjM0NjQgMi42MzY2IDEyLjUwODUgMi41Njk1QzEyLjY3MDYgMi41MDI0IDEyLjgxNzkgMi40MDQgMTIuOTQyIDIuMjc5OUMxMy4wNjYxIDIuMTU1OSAxMy4xNjQ1IDIuMDA4NSAxMy4yMzE2IDEuODQ2NEMxMy4yOTg2IDEuNjg0NSAxMy4zMzMxIDEuNTExIDEzLjMzMzEgMS4zMzU3Wk03LjEyNDcgMC40NjU3TDUuMTU0MiA1LjA3NEwyLjMwMzQgNS4wNzQzTDIuMzAzNCAwLjUzODRMMCAwLjUzODRMMCAxMi4wNTI0TDIuMzAzNCAxMi4wNTE3TDIuMzAzNCA3LjM0MzdMNi40NTYgNy4zNDM3QzYuODgxMSA3LjM0NDEgNy4yODkgNy4xNzU2IDcuNTg5OSA2Ljg3NTNDNy44ODAzIDYuNTg1NSA4LjA0ODIgNi4xOTU4IDguMDYgNS43ODY4TDguMDYgMTIuMjE5N0wxMC4zMyAxMi4yMTlMMTAuMzMgNy4zNDNDMTAuMzI5NSA2Ljc0MTIgMTAuMDkwMSA2LjE2NDIgOS42NjQ1IDUuNzM4N0M5LjIzODkgNS4zMTMyIDguNjYxOCA1LjA3NDEgOC4wNiA1LjA3MzdMNi4xNTE2IDUuMDczOUw2LjU0NTMgNS4wNzM3QzYuODg1NSA1LjA3MzcgNy4yMTgyIDQuOTczNyA3LjUwMjEgNC43ODYyQzcuNzg2IDQuNTk4NyA4LjAwODUgNC4zMzIgOC4xNDIgNC4wMTkxTDkuNjYyIDAuNDY1N0w3LjEyNDcgMC40NjU3WiIvPjwvc3ZnPg=="); }
/* glm */
html[data-dsh-wb] [data-model-id*="glm" i][data-provider-id], html[data-dsh-wb] [data-model-id*="zhipu" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="glm" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxIDEuMjUgMi4zNzUpIiBkPSJNNi44MDkyIDBMNS41ODM3IDEuNjYxM0wwLjM2NzUgMS42NjEzTDEuNTkyMiAwTDYuODEgMEw2LjgwOTIgMFpNMTMuMDggOS41ODk1TDExLjg1NiAxMS4yNUw2LjY1NzcgMTEuMjVMNy44ODAyIDkuNTg5NUwxMy4wODA3IDkuNTg5NUwxMy4wOCA5LjU4OTVaTTEzLjUgMEw1LjIxMSAxMS4yNUwwIDExLjI1TDguMjg5IDBMMTMuNSAwWiIvPjwvc3ZnPg=="); }
/* hunyuan */
html[data-dsh-wb] [data-model-id*="hunyuan" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="hunyuan" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMSAwLjA0OTk4NzggMCkiIGQ9Ik0yLjMyOCAyLjM0NDJDMC43NzYgMy45MDYyIDAgNS43OTE0IDAgNy45OTk5QzAgMTAuMjA4NCAwLjc3NiAxMi4wOTM2IDIuMzI4IDEzLjY1NTVDMy4wNzM2IDE0LjQwNTkgMy45MzM2IDE0Ljk4NDIgNC45MDc5IDE1LjM5MDRDNS44ODI0IDE1Ljc5NjcgNi44OTcyIDE1Ljk5OTggNy45NTIxIDE1Ljk5OThDOS4wMDcgMTUuOTk5OCAxMC4wMjE3IDE1Ljc5NjcgMTAuOTk2MiAxNS4zOTA0QzExLjk3MDUgMTQuOTg0MiAxMi44MzA1IDE0LjQwNTkgMTMuNTc2MSAxMy42NTU1QzE1LjEyODEgMTIuMDkzNiAxNS45MDQxIDEwLjIwODQgMTUuOTA0MSA3Ljk5OTlDMTUuOTA0MSA1Ljc5MTQgMTUuMTI4MSAzLjkwNjIgMTMuNTc2MSAyLjM0NDJDMTIuODMwNSAxLjU5MzggMTEuOTcwNSAxLjAxNTUgMTAuOTk2MiAwLjYwOTRDMTAuMDIxNyAwLjIwMzEgOS4wMDcgMCA3Ljk1MjEgMEM2Ljg5NzIgMCA1Ljg4MjQgMC4yMDMxIDQuOTA3OSAwLjYwOTRDMy45MzM2IDEuMDE1NSAzLjA3MzYgMS41OTM4IDIuMzI4IDIuMzQ0MlpNNC4wMTg0IDYuMDU5OEM0LjI4MzQgNS43NzAzIDQuNDMwNCA1LjM4ODcgNC40MzAzIDQuOTk2MkM0LjQzMDMgNC4xMjggMy43MzE4IDMuNDI1MSAyLjg2OTMgMy40MjUxQzIuNTgzOSAzLjQyNTcgMi4zMDQxIDMuNTA0NyAyLjA2MDQgMy42NTMzQzEuODY1MiAzLjc3MjQgMS42OTkyIDMuOTMyNiAxLjU3MzUgNC4xMjJDMS44ODIxIDMuNjA3NyAyLjI1MzUgMy4xMjg2IDIuNjgyNiAyLjY5NjdDNC4wODAyIDEuMjkwMiA1Ljk3NTcgMC41IDcuOTUyMSAwLjVDOC40NDA0IDAuNSA4LjkyMzkgMC41NDgyIDkuMzk2MSAwLjY0MjFDMTEuNzg3OSAxLjIwMzQgMTMuNTcxMSAzLjM2MzEgMTMuNTcyIDUuOTQ0MkMxMy41NzIgOC4yMjY4IDEyLjMyMDggMTAuMTc0NiAxMC4zMzc2IDEwLjk4MDRDMTAuMDMxMSAxMS4xMTcgOS41NDUzIDExLjIwMTIgOS4xODg2IDExLjIwMTJDNy44MTM0IDExLjIwMTIgNi42OTk1IDEwLjA4MDIgNi42OTk1IDguNjk2MkM2LjY5OTUgOC41MjY2IDYuNzE2MiA4LjM2MDkgNi43NDgyIDguMjAwN0M3LjEzMjggOC4wNzEgNy41MzU4IDguMDAzOCA3Ljk0MTggOC4wMDE2TDcuOTUwMSA4LjAwMTZDMTAuMDA4NCA4LjAwMiAxMS42NzUgNi4zMjMgMTEuNjc1IDQuMjUyOUwxMS42NzUgNC4yMzQ2QzExLjY3NDcgNC4xNzQzIDExLjY3MyA0LjExMzEgMTEuNjcgNC4wNTM2QzExLjY3MDIgNC4wNTg2IDExLjY3MDUgNC4wNjM3IDExLjY3MDcgNC4wNjg3QzExLjU5NzEgMi41MDYzIDEwLjU5MiAxLjIxNTYgOS4yMDg3IDAuNzIwNEM5LjIxMDggMC43MjEyIDkuMjEzIDAuNzIyIDkuMjE1MSAwLjcyMjdDOC44NDE0IDAuNTg4MiA4LjQ0IDAuNTExOCA4LjAyMTggMC41MDM3QzkuNTg5NiAwLjU0MjUgMTAuODQ3OSAxLjgzMDUgMTAuODQ3OSAzLjQxNjdDMTAuODQ3OSA0Ljc1NTEgOS45MzUgNS45MTgzIDguNjM2OSA2LjI1MjJDNy42NDg5IDYuNDgzMSA2LjkxOTIgNy4yNjY3IDYuNzQ4MiA4LjIwMDdDNi42NzI5IDguMjI2NSA2LjU5NzggOC4yNTQ0IDYuNTI0MSA4LjI4NTFDNi4wNzIxIDguNDczNSA1LjY2MTQgOC43NDk3IDUuMzE1NSA5LjA5NzlDNC45Njk1IDkuNDQ2IDQuNjk1MSA5Ljg1OTMgNC41MDc5IDEwLjMxNDJDNC4zMjA3IDEwLjc2OTEgNC4yMjQ0IDExLjI1NjcgNC4yMjQ0IDExLjc0OUM0LjIyNDQgMTIuMjQxMyA0LjMyMDcgMTIuNzI4OSA0LjUwNzkgMTMuMTgzOEM0LjY5NTEgMTMuNjM4NiA0Ljk2OTUgMTQuMDUyIDUuMzE1NSAxNC40MDAxQzUuNjYxNCAxNC43NDgzIDYuMDcyMSAxNS4wMjQ0IDYuNTI0MSAxNS4yMTI5QzYuOTc2MSAxNS40MDEzIDcuNDYwNSAxNS40OTgzIDcuOTQ5OCAxNS40OTgzQzcuODQ2IDE1LjQ5ODMgNy43NDI0IDE1LjQ5NjIgNy42MzkyIDE1LjQ5MTlDNC43NDAxIDE1LjMyOTggMi40MzU4IDEyLjkxMTYgMi40MzU4IDkuOTUwN0MyLjQzMzQgOC40OTY1IDMuMDAxNyA3LjA5OTUgNC4wMTg0IDYuMDU5OFpNNy4yNDY2IDE1LjQ2NTZDNy4zNzY5IDE1LjQ3NzggNy41MDc4IDE1LjQ4NjYgNy42MzkyIDE1LjQ5MTlDNy42NDgzIDE1LjQ5MjUgNy42NTc0IDE1LjQ5MyA3LjY2NjUgMTUuNDkzNEM3LjUyNTUgMTUuNDg4IDcuMzg1NSAxNS40Nzg3IDcuMjQ2NiAxNS40NjU2Wk03LjI0NjYgMTUuNDY1NkM3LjA4ODQgMTUuNDUwNyA2LjkzMTEgMTUuNDMwOCA2Ljc3NDggMTUuNDA1NkM2LjkzMDUgMTUuNDMwNSA3LjA4NzggMTUuNDUwNiA3LjI0NjYgMTUuNDY1NlpNOC4wMDc3IDAuNTAwM0M4LjAzNCAwLjUwMDUgOC4wNjAyIDAuNTAwOCA4LjA4NjQgMC41MDEzQzguMDgxIDAuNTAxNSA4LjA3NTYgMC41MDE2IDguMDcwMiAwLjUwMThDOC4wNDkzIDAuNTAxMSA4LjAyODUgMC41MDA2IDguMDA3NyAwLjUwMDNaIi8+PC9zdmc+"); }
/* minimax */
html[data-dsh-wb] [data-model-id*="minimax" i][data-provider-id], html[data-dsh-wb] [data-model-id*="abab" i][data-provider-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2xpcFBhdGggaWQ9IndiLW1pbmltYXgtY2xpcCI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjd2ItbWluaW1heC1jbGlwKSI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMCAxLjAwMDA4KSIgZD0iTTYuNDkgMTEuNTk4Mkw2LjQ5IDYuNDQyMUw2LjQ5MSA2LjQ0MjFMNi40ODM5IDYuNDM4MUw2LjQ3MzkgNi40MzgxTDYuNDczOSAzLjAxNkM2LjQ4NCAyLjQ0MDYgNi40NzM5IDEuODU0MyA2LjQ5NCAxLjI3NzlDNi41NTQgMC43NzU2IDcuNTkyNiAwLjY4MDYgNy42Mjk2IDEuMzgxQzcuNjE5NyA0LjE3MTcgNy42MTk3IDYuOTc3NCA3LjYxOTcgOS43NzIxQzcuNjYxNyAxMC4xMzY0IDguNDE4MSAxMC4zMzY1IDguNDE4MiA5LjQwNDlDOC40MTQzIDguMzY1MyA4LjQxNzYgNy4zMjIyIDguNDIwOSA2LjI3ODVDOC40MjYyIDQuNjI2IDguNDMxNCAyLjk3MjQgOC40MDgxIDEuMzNDOC4zOTAxIDAuMDIyMiA2LjQyMjkgLTAuNjY3MyA1Ljc3NDUgMC45MTI3QzUuNjcwNCAxLjExMDcgNS42Nzg0IDEuNjA0MyA1LjY4MyAxLjg4OEM1LjY4MzggMS45MzY5IDUuNjg0NSAxLjk3OTUgNS42ODQ1IDIuMDEzNEM1LjY4NDUgNC4yMzA3IDUuNjk0NSA2LjQ0OTEgNS42OTQ1IDguNjY3NUM1LjY5NDUgOS41NjggNS42ODQ1IDEwLjQ1NzUgNS42ODQ1IDExLjM1ODFDNS41MzU0IDEyLjEyMjYgNC42MDY4IDEyLjEzMzYgNC42MTY4IDExLjM3MDFDNC42MjY4IDEwLjc4MjggNC42MjY4IDEwLjE4ODQgNC42MjY4IDkuNjAyQzQuNjI2OCA5LjEzOTcgNC42MTY4IDguNjcxNSA0LjYxNjggOC4xOTgyQzQuNjE2OCA3LjQ2NzcgNC42MjY4IDYuNzMzMyA0LjYyNjggNi4wMDI4QzQuNjI2OCA1LjYzMjYgNC42MTY4IDUuMjY4NCA0LjYxNjggNC45MDIyQzQuNjA2OCA0LjUwNDkgNC4zNDY3IDQuMTM5NyA0LjIzNjYgNC4wMjQ2QzMuOTQ5NCAzLjY5OTQgMy42NTAyIDMuNTExMyAzLjIgMy41NTEzQzIuMTYwMyAzLjYyNTQgMS44ODIyIDQuNDIzOSAxLjg4MjEgNS40MDQ1QzEuODgyMiA2LjE4NjkgMS44ODIyIDYuOTYyNCAxLjg3MjEgNy43Mzc5QzEuNjY1IDguNjc4NSAwLjc4NTUgOC4yOTEyIDAuNzk1NSA3LjcxNTlDMC43OTk3IDcuNTkxMyAwLjc5OTcgNy40NjQ3IDAuNzk5NiA3LjMzNzZDMC43OTk0IDcuMTM1OSAwLjc5OTMgNi45MzI3IDAuODE2NSA2LjczMzNDMC44NTg1IDYuMDc2OSAwIDYuMTc5OSAwIDYuNjE4MkwwIDcuOTU5QzAuMDU0IDkuNTYxIDIuMzk3NSA5Ljg4MjIgMi42ODQ2IDcuOTQ4QzIuNjc0NiA3LjUwODggMi42NzQ2IDcuMDgxNSAyLjY3NDYgNi42NDEyQzIuNjg1NiA2LjA4MzkgMi42NzQ2IDUuNTMwNSAyLjY5NjcgNC45NjUyQzIuNzA2NyA0LjU0MzkgMy4xNzQ5IDQuMjAwNyAzLjU2NTIgNC40OTI5QzMuNzY1MyA0LjYzNiAzLjgxNTMgNC44MTcxIDMuODE1MyA1LjA0NjJMMy44MTUzIDYuODc3NEMzLjgxNTMgNy40MDI1IDMuODE0MSA3LjkyNzkgMy44MTI5IDguNDUzOUMzLjgxMDQgOS41MDkxIDMuODA4IDEwLjU2NjUgMy44MTUzIDExLjYyODJDMy44MjUzIDEyLjg5NCA2LjE0MTggMTMuMzQ0MyA2LjQ5IDExLjU5ODJaTTkuNTMwOCAxLjI1MTlMOS41MzA4IDYuNDAyTDkuNTMzOCA2LjQwMkw5LjUzMzggMTAuOTkyOUM5LjUzMzggMTEuNTgwMiA5LjUzMzggMTIuMTU1NiA5LjUxMjggMTIuNzMxOUM5LjQ2MzggMTMuMjQ1MiA4LjQyNTEgMTMuMzMwMyA4LjM4NzEgMTIuNjI3OEw4LjM4NzEgMTEuMTUyQzguMzU1MSAxMC43OTc3IDcuNjQ3NyAxMC41OTg2IDcuNTk4NiAxMS40MzYxTDcuNTk4NiAxMi42Nzk5QzcuNjE2NiAxMy45ODY3IDkuNTkzOSAxNC42NzcxIDEwLjI0MTIgMTMuMDk4MkMxMC4zMzcgMTIuOTAwOCAxMC4zMjg3IDEyLjQxMjMgMTAuMzIzOSAxMi4xMjg2QzEwLjMyMyAxMi4wNzcyIDEwLjMyMjMgMTIuMDMyNSAxMC4zMjIzIDExLjk5NzVMMTAuMzIyMyAxLjQ5MUMxMC40ODA0IDAuNzE2NiAxMS40MDkgMC43MTY2IDExLjM5OSAxLjQ4QzExLjM4ODkgMi4wNjY0IDExLjM4ODkgMi42NDk3IDExLjM4ODkgMy4yNDcxTDExLjM4ODkgNy45NEMxMS40MjEgOC42MzA0IDExLjgxODIgOS4zMTM4IDEyLjgwNjggOS4yOTA4QzEzLjg1NTUgOS4yMDU4IDE0LjEzNDYgOC40MjAzIDE0LjEzNDYgNy40MjU3TDE0LjEzNDYgNS4xMDQzQzE0LjM0MDggNC4xNTI3IDE1LjIzMTMgNC41NTA5IDE1LjIxMTMgNS4xMTYzQzE1LjIwNjIgNS4yNTgxIDE1LjIwNzQgNi4wMjM0IDE1LjIwODcgNi44ODZDMTUuMjEwNSA4LjA2NzggMTUuMjEyNiA5LjQzMjMgMTUuMTk5MyA5LjYyNkMxNS4xNjEzIDEwLjI4NDQgMTYuMDA5OCAxMC4xODA0IDE2LjAwOTggOS43NDAxTDE2LjAwOTggNC44ODcxQzE1Ljk2MDggMy4yODUxIDEzLjYyNDMgMi45NjM5IDEzLjMzNDIgNC44OTgxTDEzLjMzNDIgNi4xOTY5QzEzLjMzNDIgNi4zNDMgMTMuMzM0OSA2LjQ4ODIgMTMuMzM1NiA2LjYzMjZDMTMuMzM3NyA3LjA1MDIgMTMuMzM5OCA3LjQ2MjEgMTMuMzI0MSA3Ljg3MzlDMTMuMzAzMSA4LjMwMjIgMTIuODM1OCA4LjYzNzQgMTIuNDU1NiA4LjM1MjJDMTIuMjU0NSA4LjE5ODEgMTIuMTk1NCA4LjAyOSAxMi4xOTU1IDcuNzg4OUMxMi4yMDU1IDcuMTgyNSAxMi4yMDU1IDYuNTc0MSAxMi4yMDU0IDUuOTY3OEMxMi4xOTk5IDUuMTc4NSAxMi4xOTk5IDQuMzg2MiAxMi4xOTk5IDMuNTkzOEMxMi4yIDIuODAxIDEyLjIgMi4wMDggMTIuMTk0NSAxLjIxNzlDMTIuMTg0NCAtMC4wNDg5IDkuODY5IC0wLjUwNjIgOS41MzA4IDEuMjUxOVoiLz48L2c+PC9zdmc+"); }
/* mistral */
html[data-dsh-wb] [data-model-id*="mistral" i][data-provider-id], html[data-dsh-wb] [data-model-id*="mixtral" i][data-provider-id], html[data-dsh-wb] [data-model-id*="codestral" i][data-provider-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIxIiB5PSIxIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRjdEMDQ2Ii8+PHJlY3QgeD0iMTIiIHk9IjEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGN0QwNDYiLz48cmVjdCB4PSIxIiB5PSI0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRjdEMDQ2Ii8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0YyQTczQiIvPjxyZWN0IHg9IjkiIHk9IjQiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGMkE3M0IiLz48cmVjdCB4PSIxMiIgeT0iNCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0Y3RDA0NiIvPjxyZWN0IHg9IjEiIHk9IjciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSI0IiB5PSI3IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUU3OTJGIi8+PHJlY3QgeD0iNyIgeT0iNyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VFNzkyRiIvPjxyZWN0IHg9IjkiIHk9IjciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFRTc5MkYiLz48cmVjdCB4PSIxMiIgeT0iNyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzAwMDAwMCIvPjxyZWN0IHg9IjEiIHk9IjEwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjMDAwMDAwIi8+PHJlY3QgeD0iNCIgeT0iMTAiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSI5IiB5PSIxMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzAwMDAwMCIvPjxyZWN0IHg9IjEyIiB5PSIxMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzAwMDAwMCIvPjxyZWN0IHg9IjEiIHk9IjEzIiB3aWR0aD0iMyIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwMDAwIi8+PHJlY3QgeD0iMTIiIHk9IjEzIiB3aWR0aD0iMyIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwMDAwIi8+PC9zdmc+"); }
/* groq */
html[data-dsh-wb] [data-model-id*="groq" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="groq" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCAxQzQuMTM0IDEgMSA0LjEzNCAxIDhzMy4xMzQgNyA3IDcgNy0zLjEzNCA3LTctMy4xMzQtNy03LTd6bTAgMTEuMkE0LjIgNC4yIDAgMTExMi4yIDggNC4yMDUgNC4yMDUgMCAwMTggMTIuMnptMC02LjcyYTIuNTIgMi41MiAwIDEwMCA1LjA0IDIuNTIgMi41MiAwIDAwMC01LjA0eiIgZmlsbD0iI0Y1NTAzNiIvPjwvc3ZnPg=="); }
/* together */
html[data-dsh-wb] [data-model-id*="together" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="together" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI0IiBjeT0iNCIgcj0iMiIgZmlsbD0iIzBGNkZGRiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNCIgcj0iMiIgZmlsbD0iIzBGNkZGRiIvPjxjaXJjbGUgY3g9IjQiIGN5PSIxMiIgcj0iMiIgZmlsbD0iIzBGNkZGRiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjIiIGZpbGw9IiMwRjZGRkYiLz48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iMi41IiBmaWxsPSIjMEY2RkZGIi8+PC9zdmc+"); }
/* fireworks */
html[data-dsh-wb] [data-model-id*="fireworks" i][data-provider-id], html[data-dsh-wb] [data-provider-id*="fireworks" i][data-model-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCAxbDEuNSA0LjVMMTQgOGwtNC41IDEuNUw4IDE0bC0xLjUtNC41TDIgOGw0LjUtMS41TDggMXoiIGZpbGw9IiM3QzNBRUQiLz48cGF0aCBkPSJNMTIgMmwuNzUgMi4yNUwxNSA1bC0yLjI1Ljc1TDEyIDhsLS43NS0yLjI1TDkgNWwyLjI1LS43NUwxMiAyeiIgZmlsbD0iIzdDM0FFRCIgb3BhY2l0eT0iMC42Ii8+PHBhdGggZD0iTTQgOWwuNzUgMi4yNUw3IDEybC0yLjI1Ljc1TDQgMTVsLS43NS0yLjI1TDEgMTJsMi4yNS0uNzVMNCA5eiIgZmlsbD0iIzdDM0FFRCIgb3BhY2l0eT0iMC42Ii8+PC9zdmc+"); }
/* perplexity */
html[data-dsh-wb] [data-model-id*="perplexity" i][data-provider-id], html[data-dsh-wb] [data-model-id*="sonar" i][data-provider-id] { --dsh-wb-brand-icon: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCAxTDIgNXY2bDYgNCA2LTRWNUw4IDF6IiBzdHJva2U9IiMyMDgwOEQiIHN0cm9rZS13aWR0aD0iMS4yIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTggMXYxNE0yIDVsNiAzLjVMMTQgNU0yIDExbDYtMi41IDYgMi41IiBzdHJva2U9IiMyMDgwOEQiIHN0cm9rZS13aWR0aD0iMS4yIi8+PC9zdmc+"); }
`

    function installWidgetStyle() {
      const existing = document.getElementById(WIDGET_STYLE_ID)
      if (existing !== null) existing.remove()
      const tag = document.createElement('style')
      tag.id = WIDGET_STYLE_ID
      tag.textContent = WIDGET_CSS
      document.head.appendChild(tag)
      return () => {
        const node = document.getElementById(WIDGET_STYLE_ID)
        if (node !== null) node.remove()
      }
    }

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

    /** 适配漂移信号：宿主升级改了类名时 probe() 把它置真，
     *  会话头胶囊与设置页「适配状态」行订阅它变黄——把静默失效变成一眼可见。 */
    const DRIFT = { active: false, listeners: new Set() }

    function setDrift(active) {
      if (DRIFT.active === active) return
      DRIFT.active = active
      for (const fn of DRIFT.listeners) {
        try { fn(active) } catch { /* 忽略 */ }
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
        setDrift(false)
        stop()
        return true
      }

      if (check()) return stop

      if (typeof MutationObserver === 'function') {
        const current = new MutationObserver(() => { check() })
        observer = current
        current.observe(root, { childList: true, subtree: true })
        // 侧栏 10 秒内没出现就不再等：视为宿主类名漂移，告警置位
        setTimeout(() => {
          stop()
          if (root.hasAttribute('data-dsh-wb')) return
          setDrift(true)
          console.warn(
            '[dsh-workbuddy-theme] 侧栏节点 10 秒未出现：宿主类名疑似漂移，结构层已停用，' +
            '配色与字体不受影响。请更新 dsh-workbuddy-theme 到最新版。',
          )
        }, 10000)
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

    /** 交互色/密度切换的落点，apply 每次挂载时写入（同 ON_SWITCH 模式）。 */
    const REAPPLY = { call: () => {} }

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
     *  所以这里只显示「当前会话」这个无害信息，不猜数字。
     *  适配漂移（probe 超时）时变成琥珀色告警：主题结构层已被停用，提示更新插件。 */
    function makeUtility(React) {
      return function WorkBuddyUtility() {
        const [drift, setDriftState] = React.useState(DRIFT.active)
        React.useEffect(() => {
          DRIFT.listeners.add(setDriftState)
          return () => DRIFT.listeners.delete(setDriftState)
        }, [])
        return React.createElement('span', {
          className: 'dsh-wb-stat' + (drift ? ' dsh-wb-stat-warn' : ''),
          title: drift
            ? 'DSH 升级改了类名，主题结构层已停用（配色不受影响）。请更新 dsh-workbuddy-theme。'
            : 'WorkBuddy 主题已启用（设置 → 通用 可关闭）',
        },
          React.createElement('span', { className: 'dsh-wb-stat-value' }, drift ? 'WorkBuddy · 适配失效' : 'WorkBuddy'),
        )
      }
    }

    /** 输入卡上方的快捷条。
     *  zone.session 拿得到 cwd，据此显示工作区名；点击没有任何副作用。
     *  新会话（composerHero）时在右端追加当前宠物，脚踩输入卡边框（CSS 门控显示）。 */
    function makeDock(React) {
      return function WorkBuddyDock(props) {
        const [pet, setPet] = React.useState(null)
        React.useEffect(() => {
          let live = true
          const load = () => {
            petInfo().then((info) => { if (live) setPet(selectedPet(info)) })
          }
          load()
          petListeners.add(load)
          return () => {
            live = false
            petListeners.delete(load)
          }
        }, [])
        const cwd = props && props.session ? props.session.cwd : undefined
        const hasCwd = typeof cwd === 'string' && cwd !== ''
        // 新会话还没有 session（也就没有 cwd），但宠物要能爬到输入卡上，所以这里不整体返回 null。
        if (!hasCwd && pet === null) return null
        const name = hasCwd ? cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() : null
        return React.createElement('div', { className: 'dsh-wb-actions' },
          hasCwd ? React.createElement('span', { className: 'dsh-wb-action', title: cwd }, name) : null,
          pet === null ? null : React.createElement('button', {
            type: 'button',
            className: 'dsh-wb-perch',
            title: pet.name + ' · 打开 WorkBuddy 主题设置',
            'aria-label': '打开 WorkBuddy 主题设置',
            style: petFrameStyle(pet, 72),
            onClick: openWorkBuddySettings,
          }),
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

      function PreviewItem(props) {
        return h('div', { className: 'dsh-wb-preview-item' },
          h('div', { className: 'dsh-wb-preview-label' }, props.label),
          h('div', { className: 'dsh-wb-preview-row' }, props.children),
        )
      }

      function SwitchReplica(props) {
        return h('button', {
          type: 'button',
          role: 'switch',
          'aria-checked': props.on ? 'true' : 'false',
          className: '_switch_1ik0f_5',
          tabIndex: -1,
        }, h('span', { className: '_thumb_1ik0f_33' }))
      }

      function Swatch(props) {
        return h('span', { className: 'dsh-wb-swatch', style: { background: props.fill } })
      }

      function SkinCard(props) {
        return h('button', {
          type: 'button',
          role: 'radio',
          className: 'dsh-wb-skin-card' + (props.selected ? ' is-on' : ''),
          'aria-checked': props.selected ? 'true' : 'false',
          style: props.vars,
          onClick: props.onSelect,
        },
          h('div', { className: 'dsh-wb-skin-thumb' },
            h('div', { className: 'dsh-wb-skin-win' },
              h('div', { className: 'dsh-wb-skin-bar' }, h('i'), h('i'), h('i')),
              h('div', { className: 'dsh-wb-skin-body' },
                h('div', { className: 'dsh-wb-skin-side' },
                  h('span', { className: 'dsh-wb-skin-ava' }),
                  h('i'), h('i'), h('i'),
                ),
                h('div', { className: 'dsh-wb-skin-main' },
                  h('div', { className: 'dsh-wb-skin-bub' }),
                  h('i', { className: 'l1' }),
                  h('i', { className: 'l2' }),
                  h('div', { className: 'dsh-wb-skin-composer' }, h('span')),
                ),
              ),
            ),
          ),
          h('div', { className: 'dsh-wb-skin-cap' },
            h('span', { className: 'dsh-wb-skin-name' }, props.name),
            props.sub ? h('span', { className: 'dsh-wb-skin-sub' }, props.sub) : null,
          ),
          props.selected ? h('span', { className: 'dsh-wb-skin-check' }, '✓') : null,
        )
      }

      function skinPreviewVars(preset) {
        const surface = preset.surface ?? {}
        return {
          '--bk-bg': surface['--dsw-alias-bg-base'] ?? '#ffffff',
          '--bk-side': surface['--dsw-specific-sidebar-fill'] ?? '#f7f7f7',
          '--bk-card': surface['--dsw-alias-bg-layer-1'] ?? '#ffffff',
          '--bk-bubble': preset.bubble?.light ?? '#f2f2f2',
          '--bk-line': preset.border?.light ?? '#e6e6e6',
          '--bk-accent': preset.accent?.['--wb-control-on']?.light ?? '#00c29a',
        }
      }

      return function WorkBuddySection() {
        const [on, setOn] = React.useState(isEnabled)
        const [accent, setAccent] = React.useState(accentChoice)
        const [density, setDensity] = React.useState(densityChoice)
        const [skin, setSkin] = React.useState(skinChoice)
        const [drift, setDriftState] = React.useState(DRIFT.active)
        const [pets, setPets] = React.useState([])
        const [petOn, setPetOn] = React.useState(petEnabled)
        React.useEffect(() => {
          DRIFT.listeners.add(setDriftState)
          return () => DRIFT.listeners.delete(setDriftState)
        }, [])
        React.useEffect(() => {
          let live = true
          const load = () => {
            petInfo().then((info) => { if (live) setPets(info === null ? [] : info.pets) })
          }
          load()
          petListeners.add(load)
          return () => {
            live = false
            petListeners.delete(load)
          }
        }, [])
        const pet = selectedPet(pets.length === 0 ? null : { pets })
        function pickPet(id) {
          if (pet !== null && pet.id === id) return
          try { localStorage.setItem(PET_ID_KEY, id) } catch { /* 隐私模式写不了，忽略 */ }
          refreshPets()
        }
        function pickSkin(id) {
          writeSkin(id)
          try {
            REAPPLY.call()
          } catch (error) {
            console.warn('[dsh-workbuddy-theme] 切换皮肤失败：', error)
          }
          setSkin(id)
        }
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
          h('div', { className: 'dsh-wb-row dsh-wb-row-stack' },
            h('div', { className: 'dsh-wb-row-main' },
              h('div', { className: 'dsh-wb-row-label' }, '外观皮肤'),
              h('div', { className: 'dsh-wb-row-desc' }, '默认系统外观（WorkBuddy 薄荷绿）；选中皮肤后接管背景、侧栏、气泡、边框与主色，交互色三档随之禁用，仅作用于浅色主题。'),
            ),
            h('div', { className: 'dsh-wb-skins', role: 'radiogroup', 'aria-label': '外观皮肤' },
              h(SkinCard, {
                key: 'system',
                name: '系统（默认）',
                sub: '薄荷绿',
                selected: skin === '',
                vars: {
                  '--bk-bg': 'var(--dsw-alias-bg-base)',
                  '--bk-side': 'var(--dsw-specific-sidebar-fill)',
                  '--bk-card': 'var(--dsw-alias-bg-layer-1)',
                  '--bk-bubble': 'var(--wb-bubble-fill)',
                  '--bk-line': 'var(--wb-border)',
                  '--bk-accent': (ACCENTS[accent] ?? ACCENTS.mint)['--wb-control-on'].light,
                },
                onSelect: () => pickSkin(''),
              }),
              SKIN_PRESETS.map((preset) => h(SkinCard, {
                key: preset.id,
                name: preset.name,
                sub: '',
                selected: skin === preset.id,
                vars: skinPreviewVars(preset),
                onSelect: () => pickSkin(preset.id),
              })),
            ),
          ),
          pet === null ? null : h('div', { className: 'dsh-wb-row dsh-wb-row-stack' },
            h('div', { className: 'dsh-wb-row-main' },
              h('div', { className: 'dsh-wb-row-label' }, '宠物联动'),
              h('div', { className: 'dsh-wb-row-desc' },
                !petOn
                  ? '已关闭：新会话不显示宠物。'
                  : '来源 ~/.codex/pets；选中的宠物在新会话中站在输入卡右上角。',
              ),
            ),
            h('div', { className: 'dsh-wb-pet-bar' },
              pets.length > 1
                ? h('div', { className: 'dsh-wb-pet-list', role: 'radiogroup', 'aria-label': '选择宠物' },
                  pets.map((item) => {
                    const on = pet.id === item.id
                    return h('button', {
                      key: item.id,
                      type: 'button',
                      role: 'radio',
                      'aria-checked': on ? 'true' : 'false',
                      className: 'dsh-wb-pet-option' + (on ? ' is-on' : ''),
                      title: item.name || item.id,
                      onClick: () => pickPet(item.id),
                    },
                      h('span', { className: 'dsh-wb-pet-thumb', style: petFrameStyle(item, 30) }),
                      h('span', { className: 'dsh-wb-pet-name' }, item.name || item.id),
                    )
                  }),
                )
                : h('span', { className: 'dsh-wb-pet-chip' },
                  h('span', { className: 'dsh-wb-pet-thumb', style: petFrameStyle(pet, 30) }),
                  h('span', { className: 'dsh-wb-pet-name' }, pet.name),
                ),
              h(Segmented, {
                value: petOn ? 'on' : 'off',
                options: [{ id: 'on', label: '开' }, { id: 'off', label: '关' }],
                onChange: (id) => {
                  const next = id === 'on'
                  writePetEnabled(next)
                  setPetOn(next)
                },
              }),
            ),
          ),
          h(Row, {
            label: '交互色',
            desc: skin === ''
              ? '按钮、开关、复选框、发送键、光标与选中色共用；切换时 200ms 淡入。'
              : '已由皮肤提供，切回「系统」后可手动选择。',
            control: h(Segmented, {
              value: accent,
              options: [
                { id: 'mint', label: '薄荷绿', disabled: skin !== '' },
                { id: 'indigo', label: '靛蓝', disabled: skin !== '' },
                { id: 'amber', label: '琥珀', disabled: skin !== '' },
              ],
              onChange: (id) => {
                writeAccent(id)
                try {
                  REAPPLY.call()
                } catch (error) {
                  console.warn('[dsh-workbuddy-theme] 切换交互色失败：', error)
                }
                setAccent(id)
              },
            }),
          }),
          h(Row, {
            label: '字号密度',
            desc: '紧凑 13px / 宽松 15px；标准档跟随宿主设置里的字号调节。',
            control: h(Segmented, {
              value: density,
              options: [{ id: 'compact', label: '紧凑' }, { id: 'standard', label: '标准' }, { id: 'roomy', label: '宽松' }],
              onChange: (id) => {
                writeDensity(id)
                try {
                  REAPPLY.call()
                } catch (error) {
                  console.warn('[dsh-workbuddy-theme] 切换字号密度失败：', error)
                }
                setDensity(id)
              },
            }),
          }),
          h(Row, { label: '配色', desc: '由 --dsw-static-* 静态色阶整体重排，明暗两态各自成对。', control: h('span', { className: 'dsh-wb-row-label' }, '浅色 / 跟随系统') }),
          h(Row, { label: '字体', desc: '界面用系统中文栈（PingFang SC → 微软雅黑），代码用等宽栈。' }),
          h(Row, { label: '对话栏宽度', desc: '默认 848px；窗口宽于 1681px 时 1008px；仍可用宽度手柄拖拽覆盖。' }),
          h(Row, { label: '已知取舍', desc: '中性 14 档明暗同值；深色是「跟随」而非逐档复刻。' }),
          h(Row, {
            label: '适配状态',
            desc: '宿主升级改了类名时，结构层自动停用并在这里与会话头胶囊提示；配色不受影响。',
            control: h('span', {
              className: 'dsh-wb-row-label',
              style: drift ? { color: '#d97706' } : undefined,
            }, drift ? '适配失效 · 请更新插件' : '正常'),
          }),
          h('div', { className: 'dsh-wb-panel-title', style: { marginTop: 14 } }, '控件预览'),
          h('div', { className: 'dsh-wb-panel-hint' }, '主题当前实际生效的效果；哪一项看着不对，就是那一处坏了。'),
          h('div', { className: 'dsh-wb-preview' },
            h(PreviewItem, { label: '复选框' },
              h('input', { type: 'checkbox', defaultChecked: true }),
              h('input', { type: 'checkbox' }),
            ),
            h(PreviewItem, { label: '单选框' },
              h('input', { type: 'radio', defaultChecked: true }),
              h('input', { type: 'radio' }),
            ),
            h(PreviewItem, { label: '开关' },
              h(SwitchReplica, { on: true }),
              h(SwitchReplica, { on: false }),
            ),
            h(PreviewItem, { label: '交互色' }, h(Swatch, { fill: 'var(--wb-control-on)' })),
            h(PreviewItem, { label: '用户气泡' }, h(Swatch, { fill: 'var(--wb-bubble-fill)' })),
            h(PreviewItem, { label: '文字层级' },
              h('span', { style: { color: 'var(--dsw-alias-label-primary)' } }, '一'),
              h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, '二'),
              h('span', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, '三'),
            ),
          ),
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
        document.documentElement.removeAttribute('data-dsh-wb-density')
      }
    }

    /** 交互色档位：读 localStorage，脏值一律回落薄荷绿。 */
    const ACCENT_KEY = 'dsh-workbuddy-theme:accent'

    function accentChoice() {
      try {
        const v = localStorage.getItem(ACCENT_KEY)
        return v === 'indigo' || v === 'amber' ? v : 'mint'
      } catch { return 'mint' }
    }

    function writeAccent(id) {
      try {
        if (id === 'mint') localStorage.removeItem(ACCENT_KEY)
        else localStorage.setItem(ACCENT_KEY, id)
      } catch { /* 隐私模式写不了，忽略 */ }
    }

    /** 字号密度档：compact/roomy 写属性到 <html>，结构 CSS 里按属性切换字号变量；
     *  标准档不写，跟随宿主自己的字号设置。 */
    const DENSITY_KEY = 'dsh-workbuddy-theme:density'

    function densityChoice() {
      try {
        const v = localStorage.getItem(DENSITY_KEY)
        return v === 'compact' || v === 'roomy' ? v : 'standard'
      } catch { return 'standard' }
    }

    function writeDensity(id) {
      try {
        if (id === 'standard') localStorage.removeItem(DENSITY_KEY)
        else localStorage.setItem(DENSITY_KEY, id)
      } catch { /* 隐私模式写不了，忽略 */ }
    }

    /** 外观皮肤：空字符串 = 系统（插件默认的 WorkBuddy 外观）。 */
    const SKIN_KEY = 'dsh-workbuddy-theme:skin'
    const SKIN_STYLE_ID = 'dsh-workbuddy-skin-css'

    function skinChoice() {
      try {
        const v = localStorage.getItem(SKIN_KEY)
        if (v === null || v === '') return ''
        return SKIN_PRESETS.some((p) => p.id === v) ? v : ''
      } catch { return '' }
    }

    function currentSkin() {
      const id = skinChoice()
      return id === '' ? null : SKIN_PRESETS.find((p) => p.id === id) ?? null
    }

    function writeSkin(id) {
      try {
        if (id === '' || id === null || id === undefined) localStorage.removeItem(SKIN_KEY)
        else localStorage.setItem(SKIN_KEY, id)
      } catch { /* 隐私模式写不了，忽略 */ }
    }

    /** 宠物联动：素材来自 Codex 原生目录 ~/.codex/pets，宿主端负责列目录、
     *  客户端按名字展示并按本机记录选中。
     *  贴图是 8 列 × 9/11 行的精灵表，静态预览取第 0 帧（idle 第一格）。 */
    const PET_API = '/dsh-workbuddy-theme/pet/state'
    const PET_SWITCH_KEY = 'dsh-workbuddy-theme:pet'
    const PET_ID_KEY = 'dsh-workbuddy-theme:pet-id'
    let petRequest = null
    const petListeners = new Set()
    function jsonOrNull(url) {
      return fetch(url).then((response) => (response.ok ? response.json() : null)).catch(() => null)
    }
    function petInfo() {
      if (petRequest === null) {
        petRequest = jsonOrNull(PET_API).then((info) => {
          if (info !== null && Array.isArray(info.pets) && info.pets.length > 0) return info
          // 宿主刚启动时接口可能还没挂上，失败不缓存，下次挂载再试一次。
          petRequest = null
          return null
        })
      }
      return petRequest
    }
    /** 换宠物或目录变动后清缓存并通知所有已挂载的浮宠与设置行重新取值。 */
    function refreshPets() {
      petRequest = null
      for (const fn of petListeners) {
        try { fn() } catch { /* 单个订阅方出错不影响其他 */ }
      }
    }
    function petEnabled() {
      try { return localStorage.getItem(PET_SWITCH_KEY) !== '0' } catch { return true }
    }
    function writePetEnabled(on) {
      try { localStorage.setItem(PET_SWITCH_KEY, on ? '1' : '0') } catch { /* 隐私模式写不了，忽略 */ }
      applyPetGate()
    }
    /** 宠物样式属于主题的一部分：主题总开关关闭时一并收起，避免只残留一只浮宠。 */
    function applyPetGate() {
      document.documentElement.setAttribute('data-dsh-wb-pet', isEnabled() && petEnabled() ? 'on' : 'off')
    }
    function selectedPet(info) {
      if (!info) return null
      const list = info.pets
      let id = null
      try { id = localStorage.getItem(PET_ID_KEY) } catch { id = null }
      const pet = (typeof id === 'string' && list.find((item) => item.id === id)) || list[0]
      if (!pet || typeof pet.url !== 'string' || pet.url === '') return null
      return {
        id: pet.id,
        name: pet.name || pet.id,
        url: pet.url,
        version: Number(pet.version) || 1,
      }
    }
    function petFrameStyle(pet, width) {
      const rows = pet.version >= 2 ? 11 : 9
      const cell = width * 208 / 192
      return {
        backgroundImage: 'url("' + pet.url + '")',
        backgroundSize: (width * 8) + 'px ' + (cell * rows) + 'px',
        backgroundPosition: '0 0',
      }
    }

    /** 宠物点击：打开设置弹窗并切到本插件分区。
     *  宿主没有把设置开关暴露成服务（只有 settings.launcher 的 owner prop），
     *  所以走用户同款路径：侧栏底部账号菜单 →「设置」→ 本插件导航行。
     *  没装账号入口时，设置壳会自己渲染一个 aria-haspopup="dialog" 的按钮。
     *  弹窗已打开时只切分区，不再重复点入口。 */
    const SETTINGS_SECTION_LABEL = 'WorkBuddy 外观'
    const SETTINGS_MENU_LABELS = ['设置', 'Settings', '設定', 'Configuración', 'Paramètres', 'Einstellungen', 'Настройки', 'Configurações']

    function findSettingsPanel() {
      return document.querySelector('[data-shortcut-modal="settings"]')
    }

    function selectWorkBuddySection(panel) {
      for (const row of panel.querySelectorAll('nav button')) {
        if (row.textContent.trim() !== SETTINGS_SECTION_LABEL) continue
        row.scrollIntoView({ block: 'nearest' })
        row.click()
        return true
      }
      return false
    }

    /** 账号菜单里的「设置」项；菜单项可能带快捷键后缀，按前缀匹配各语言文案。 */
    function findSettingsMenuEntry() {
      for (const item of document.querySelectorAll('[role="menuitem"]')) {
        const text = item.textContent.trim()
        if (SETTINGS_MENU_LABELS.some((label) => text.startsWith(label))) return item
      }
      return null
    }

    function findSettingsTrigger() {
      const sidebar = document.querySelector('.wtg9ga_root')
      const scope = sidebar ?? document
      let dialog = null
      for (const button of scope.querySelectorAll('button[aria-haspopup="dialog"][aria-expanded="false"]')) {
        dialog = button
      }
      if (dialog !== null) return { mode: 'dialog', element: dialog }
      // 默认组成是账号菜单：设置入口在侧栏 foot 最末，取最后一个菜单触发器。
      let menu = null
      for (const button of scope.querySelectorAll('button[aria-haspopup="menu"][aria-expanded]')) {
        menu = button
      }
      return menu === null ? null : { mode: 'menu', element: menu }
    }

    /** 等设置弹窗挂出后切到本插件分区；React 提交发生在点击之后，轮询若干帧。 */
    function waitForSettingsPanel() {
      let tries = 0
      const tick = () => {
        const panel = findSettingsPanel()
        if (panel !== null) {
          selectWorkBuddySection(panel)
          return
        }
        if (++tries < 30) setTimeout(tick, 16)
      }
      setTimeout(tick, 16)
    }

    function openWorkBuddySettings() {
      const open = findSettingsPanel()
      if (open !== null) {
        selectWorkBuddySection(open)
        return
      }
      const trigger = findSettingsTrigger()
      if (trigger === null) return
      trigger.element.click()
      if (trigger.mode === 'dialog') {
        waitForSettingsPanel()
        return
      }
      let tries = 0
      const clickSettingsEntry = () => {
        const entry = findSettingsMenuEntry()
        if (entry !== null) {
          entry.click()
          waitForSettingsPanel()
          return
        }
        if (++tries < 30) setTimeout(clickSettingsEntry, 16)
      }
      setTimeout(clickSettingsEntry, 16)
    }

    /** 皮肤只覆盖浅色：选择器带 :not([data-ds-dark-theme])，
     *  深色下这条规则整条不命中，界面回到插件默认深色，不需要另配一套深色皮肤。
     *  用样式层而不是 overrideTokens，是因为宿主要求每个令牌成对给明暗两值，
     *  而皮肤只有浅色一份；样式层能让浅色生效、深色零改动。 */
    function installSkinStyle() {
      const existing = document.getElementById(SKIN_STYLE_ID)
      if (existing !== null) existing.remove()
      const skin = currentSkin()
      if (skin === null) return () => {}
      const body = Object.entries(skin.surface)
        .map(([name, value]) => `  ${name}: ${value};`)
        .join('\n')
      let css = `body:not([data-ds-dark-theme]) {\n${body}\n}\n`
      if (skin.shadow) {
        // 宿主的 --dsw-elevation-* 定义在 body 与每个元素上，必须同时覆盖元素级变量。
        const elev = ['--dsw-elevation-panel', '--dsw-elevation-prominent', '--dsw-elevation-soft']
          .map((name) => `  ${name}: var(--dsw-elevation-stroke), ${skin.shadow.popover};`)
          .join('\n')
        const stroke = skin.shadow.stroke ? `  --dsw-elevation-stroke-color: ${skin.shadow.stroke};\n` : ''
        css += `body:not([data-ds-dark-theme]),\nbody:not([data-ds-dark-theme]) * {\n${stroke}${elev}\n}\n`
      }
      const tag = document.createElement('style')
      tag.id = SKIN_STYLE_ID
      tag.textContent = css
      document.head.appendChild(tag)
      return () => {
        const node = document.getElementById(SKIN_STYLE_ID)
        if (node !== null) node.remove()
      }
    }

    /** 令牌负载：WorkBuddy 静态色阶 + 字体栈 + 插件自用的语义色，全部明暗成对。
     *  交互色按当前档位覆盖 STATIC_TOKENS 里的薄荷绿字面量；
     *  选了皮肤时再用皮肤自带的主色与气泡色覆盖（皮肤优先于交互色档位）。 */
    function buildTokens() {
      const tokens = {}
      for (const [name, pair] of Object.entries(STATIC_TOKENS)) tokens[name] = { light: pair.light, dark: pair.dark }
      for (const [name, pair] of Object.entries(FONT_TOKENS)) tokens[name] = { light: pair.light, dark: pair.dark }
      for (const [name, pair] of Object.entries(SEMANTIC_TOKENS)) tokens[name] = { light: pair.light, dark: pair.dark }
      for (const [name, pair] of Object.entries(ACCENTS[accentChoice()])) tokens[name] = { light: pair.light, dark: pair.dark }
      const skin = currentSkin()
      if (skin !== null) {
        for (const [name, pair] of Object.entries(skin.accent)) tokens[name] = { light: pair.light, dark: pair.dark }
        tokens['--wb-bubble-fill'] = { light: skin.bubble.light, dark: skin.bubble.dark }
        tokens['--wb-border'] = { light: skin.border.light, dark: skin.border.dark }
      }
      return tokens
    }

    /** 切换动效：View Transition 截新旧两帧做 200ms 交叉淡化；
     *  宿主不支持就退化成即时切换。 */
    function withFade(fn) {
      if (typeof document.startViewTransition === 'function') {
        try {
          document.startViewTransition(fn)
          return
        } catch { /* 不支持或被中断，落回直接换 */ }
      }
      fn()
    }

    /** ---------------- 插件入口 ---------------- */

    function apply(ctx) {
      teardown()

      // 3'. 常驻小部件层：不随主题开关装卸（见 WIDGET_CSS 顶部说明）。
      track(installWidgetStyle())

      const theme = ctx.get('theme')
      if (theme === null || theme === undefined || typeof theme.overrideTokens !== 'function') {
        console.warn('[dsh-workbuddy-theme] 宿主没有提供 theme 服务，主题未启用')
        return teardown
      }

      // 1+2. 两层效果：
      //   令牌层 —— 配色与字体，宿主写成 body 内联样式，随明暗自动切；
      //   结构层 —— 自己的 CSS，只管侧栏 / 输入卡 / 气泡 / 工具行的形状。
      //   开关关掉时两层都撤，页面立即回到 DSH 原样。
      //   （设置页/小部件的 .dsh-wb-* 样式在常驻层 WIDGET_CSS，见顶部说明。）
      // 用对象持有两个句柄：setWorkbuddy 重建两层后句柄会更新，
      // 而 track 出去的清理函数通过闭包读的是对象的最新值，
      // 不会像捕获变量那样指向已经失效的旧函数。
      const handles = { tokens: () => {}, structure: () => {}, skin: () => {} }

      /** 设置页开关的落点：apply 每次挂载时把当前实例的切换函数挂到这里，
       *  行组件通过 ON_SWITCH 拿到它 —— 避免把闭包塞进组件 props。 */
      ON_SWITCH.call = (next) => {
        withFade(() => {
          writeEnabled(next)
          handles.structure()
          handles.tokens()
          handles.skin()
          handles.structure = () => {}
          handles.tokens = () => {}
          handles.skin = () => {}
          applyTheme()
          applyPetGate()
        })
      }

      /** 交互色/密度/皮肤切换的落点：不动开关状态，只按新档位重铺令牌、密度属性与皮肤层。 */
      REAPPLY.call = () => {
        if (!isEnabled()) return
        withFade(() => {
          handles.tokens()
          handles.tokens = () => {}
          handles.tokens = theme.overrideTokens(SOURCE, buildTokens())
          document.documentElement.setAttribute('data-dsh-wb-density', densityChoice())
          handles.skin()
          handles.skin = installSkinStyle()
        })
      }

      const applyTheme = () => {
        if (!isEnabled()) return
        handles.tokens = theme.overrideTokens(SOURCE, buildTokens())
        handles.structure = installStructure()
        handles.skin = installSkinStyle()
        document.documentElement.setAttribute('data-dsh-wb-density', densityChoice())
      }

      track(() => handles.structure())
      track(() => handles.tokens())
      track(() => handles.skin())
      applyPetGate()
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
