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

/* ============ 32. 宠物联动（dsh-codex-pet）============
   浮宠颜色派生自宿主令牌，主题生效即跟随；这里补两处：
   1) 新会话（composerHero 布局）把宠物摆在输入卡右上角，脚踩边框；
   2) 宠物气泡换成 WorkBuddy 风格：14px 圆角、细描边、elevation 阴影。
   宠物插件未安装时两条规则都遇不到目标元素。 */
.dsh-wb-perch {
  display: none;
  position: absolute;
  right: 18px;
  bottom: 100%;
  margin-bottom: -10px;
  width: 72px;
  height: 78px;
  pointer-events: none;
  background-repeat: no-repeat;
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 12%));
}
html[data-dsh-wb-pet="on"] .an3WzG_composerHero .dsh-wb-perch { display: block; }
html[data-dsh-wb-pet="on"] .dcp .dcp-bubble {
  border-radius: 14px !important;
  border-color: var(--dsw-alias-border-l2) !important;
  background: var(--dsw-alias-bg-layer-3) !important;
  box-shadow: var(--dsw-elevation-panel) !important;
}
html[data-dsh-wb-pet="on"] .dcp .dcp-bubble strong { color: var(--dsw-alias-label-primary); }
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
          petInfo().then((info) => { if (live) setPet(selectedPet(info)) })
          return () => { live = false }
        }, [])
        const cwd = props && props.session ? props.session.cwd : undefined
        const hasCwd = typeof cwd === 'string' && cwd !== ''
        // 新会话还没有 session（也就没有 cwd），但宠物要能爬到输入卡上，所以这里不整体返回 null。
        if (!hasCwd && pet === null) return null
        const name = hasCwd ? cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() : null
        return React.createElement('div', { className: 'dsh-wb-actions' },
          hasCwd ? React.createElement('span', { className: 'dsh-wb-action', title: cwd }, name) : null,
          pet === null ? null : React.createElement('span', {
            className: 'dsh-wb-perch',
            'aria-hidden': 'true',
            title: pet.name,
            style: petFrameStyle(pet, 72),
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
        const [pet, setPetState] = React.useState(null)
        const [petOn, setPetOn] = React.useState(petEnabled)
        React.useEffect(() => {
          DRIFT.listeners.add(setDriftState)
          return () => DRIFT.listeners.delete(setDriftState)
        }, [])
        React.useEffect(() => {
          let live = true
          petInfo().then((info) => { if (live) setPetState(selectedPet(info)) })
          return () => { live = false }
        }, [])
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
          pet === null ? null : h(Row, {
            label: '宠物联动',
            desc: !petOn
              ? '已关闭：新会话不显示宠物，宠物气泡保持插件原样。'
              : petOriginLabel(pet)
                + (skin === '' ? '浮宠卡片、气泡与强调色跟随宿主配色。' : '当前皮肤已带到浮宠的卡片、气泡、文字与强调色。'),
            control: h('span', { className: 'dsh-wb-pet-control' },
              h('span', { className: 'dsh-wb-pet-chip' },
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
          }),
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

    /** 宠物联动：优先用运行中的 dsh-codex-pet（含它选中的宠物与内置套），
     *  没有该插件时退回宿主端直接读 ~/.codex/pets（Codex 原生宠物目录）。
     *  贴图是 8 列 × 9/11 行的精灵表，静态预览取第 0 帧（idle 第一格）。 */
    const PET_PLUGIN_API = '/dsh-codex-pet/api/state'
    const PET_OWN_API = '/dsh-workbuddy-theme/pet/state'
    const PET_SWITCH_KEY = 'dsh-workbuddy-theme:pet'
    const PET_ID_KEY = 'dsh-workbuddy-theme:pet-id'
    let petRequest = null
    function jsonOrNull(url) {
      return fetch(url).then((response) => (response.ok ? response.json() : null)).catch(() => null)
    }
    function petPackOk(info) {
      return info !== null && info !== undefined && Array.isArray(info.pets) && info.pets.length > 0
    }
    function petInfo() {
      if (petRequest === null) {
        petRequest = jsonOrNull(PET_PLUGIN_API).then((info) => {
          if (petPackOk(info)) return { source: 'plugin', info }
          return jsonOrNull(PET_OWN_API).then((own) => (petPackOk(own) ? { source: 'codex', info: own } : null))
        }).then((pack) => {
          // 宿主刚启动时接口可能还没挂上，失败不缓存，下次挂载再试一次。
          if (pack === null) petRequest = null
          return pack
        })
      }
      return petRequest
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
    function selectedPet(pack) {
      if (!pack) return null
      const list = pack.info.pets
      let id = pack.info.config && pack.info.config.selected
      if (typeof id !== 'string' || id === '') {
        try { id = localStorage.getItem(PET_ID_KEY) } catch { id = null }
      }
      const pet = list.find((item) => item.id === id) ?? list[0]
      if (!pet || typeof pet.url !== 'string' || pet.url === '') return null
      return {
        id: pet.id,
        name: pet.name || pet.id,
        url: pet.url,
        version: Number(pet.version) || 1,
        source: pack.source,
      }
    }
    /** 来源按宠物本身判定：dsh-codex-pet 里的自定义宠物同样来自 ~/.codex/pets，
     *  只有它自带的内置宠物才是插件自己的素材。 */
    function petOriginLabel(pet) {
      const custom = pet.source === 'codex' || pet.id.startsWith('custom:')
      return custom ? '来源 ~/.codex/pets；' : '来源 dsh-codex-pet 内置；'
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
      // dsh-codex-pet 的浮宠界面从宿主令牌派生配色，除强调色外已自动跟随皮肤；
      // 强调色走 --dsw-alias-brand-primary（宿主映射到中性色阶），这里按皮肤主色补上。
      const skinAccent = skin.accent['--wb-control-on'] ?? skin.accent['--dsw-static-deepseek-500']
      if (skinAccent) {
        css += `body:not([data-ds-dark-theme]) .dcp {\n  --dsw-alias-brand-primary: ${skinAccent.light};\n}\n`
      }
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
