# 更新日志

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
本插件只做视觉，不以破坏性方式改变结构，因此主版本号的变化只代表「选择器策略或视觉规范的整体换代」。

## 0.3.1 — 2026-11-13

只补文档与已知取舍，不改任何行为。

### 新增

- CHANGELOG 记录 0.3.0 在真实 DSH 窗口（1296×828）上的截图核对结果：
  侧栏灰底 / 会话项 40px 高 8px 圆角 / 选中态灰底、用户气泡 12px 圆角、
  输入框 24px 圆角单层细描边、发送钮薄荷绿圆钮、工具卡片细边圆角 —— 全部符合预期。

### 已知取舍

- **`--dsw-static-neutral-*` 一族共 14 档的明暗两值相同**。
  WorkBuddy 的灰阶只设计了浅色，生成器里这一族直接复用了浅色值。
  只做浅色时无影响；若将来启用深色，这一族会被引用到的描边 / 分割线需要重新给档位。
- **深色模式是「跟随」，不是「复刻」**：深色下沿用 DSH 的明暗关系，
  只把品牌色与色阶方向对齐 WorkBuddy，没有逐像素复刻 WorkBuddy 的深色皮肤。

## 0.3.0 — 2026-11-13

实现方式换代：**不再注册自定义主题，改为叠加令牌层**。

旧版用 `theme.register({ id: 'workbuddy' })` 注册了一个自己的主题 id，
这带来了三个改不掉的毛病：宿主的主题偏好只持久化 `light / dark / system`，
外观卡片里也只写死了这三块，所以自定义主题既会被重启丢掉、暗色下也切不回来；
字体与配色还分在两层里，切走时会残留一半。

这一版照 `dsh-theme-native` / `@hmkk/dsh-appearance` / `dsh-fonttune` 三家市场插件
的共同做法重写：**一个 `theme.overrideTokens()` 调用，配色与字体同一层，
一个令牌同时给 light / dark 两个值**。宿主把它写成 `<body>` 内联样式，
随明暗切换自动换，切走 / 禁用 / 热重载时整层一起回收。

### 变更

- **配色来源**：重排 82 个 `--dsw-static-*` 静态色阶（Oklab 插值），
  而不是逐条覆盖 `--dsw-alias-*`。宿主的语义层（hover / active / 描边 / 阴影）
  全部引用静态色阶，改一处整层自动跟随 —— 与 dsh-theme-native 同一思路。
- **字体**：`--dsw-font-family`（PingFang SC 优先）与 `--ds-font-family-code`
  （Cascadia Code 优先）也放进同一层，切走时与配色一起撤掉。
- **设置入口**：从「注册成外观卡片里的第四块」改为
  「设置 → 通用里的一行」，排在「外观」上方（`order: 9.5`），带一个可点的
  WorkBuddy 方块按钮，自己读写开关状态，不再依赖宿主的 `store` / `inject` 契约。
- **开关**：存 `localStorage` 的 `dsh-workbuddy-theme:enabled`，与 dsh-theme-native
  的 `codex-theme:enabled` 同做法。**默认开启**。

### 修复

- 切到深色再切回来变不回去 —— 现在是叠加层，与当前明暗无关。
- 切走主题后字体不变 —— 字体与配色同层，一起撤。
- 发送按钮裸样式 —— 不再重写形状与底色，宿主自带的 34px 圆形按钮保留，
  只补 hover / disabled / 圆角。
- 深色模式下侧栏与气泡发白 —— 静态色阶在暗色档位方向写反了，已修正。
- 插件卸载后令牌层与 CSS 撤不掉 —— `apply()` 现在始终返回清理函数。
- 热重载后句柄指向旧函数 —— 改用对象持有句柄，重建时同步更新。

### 移除

- 外观卡片里的第四块方块（宿主 `CUBES` 写死三块，塞进去的块不受管）。
- `client-ui-theme` 的自定义主题注册。
- 页面左下角的诊断浮层。

## 0.2.0 — 2026-11-12

选择器策略换代：**优先使用宿主主动发布的 `data-*` 属性，类名只作兜底**。

DSH 前端类名是 CSS Modules 构建产物，带哈希前缀（如 `wtg9ga_panelRow`、`GRgSLq_card`），
宿主一升级就可能全部失效。这一版把能换成 `data-*` 的地方全换掉了。

### 变更

- **输入卡**：`[class*="GRgSLq_card"]` → `[data-composer-card]`
- **输入行**：`[class*="GRgSLq_input"]` → `[data-composer-input]`
- **用户气泡**：`._bubble_1sgyj_1` → `[data-message-bubble]`（类名保留兜底）
- **工具行**：`[class*="hKdVjq_row"]` + `:has()` → `[data-tool]`（宿主同时发布 `data-state` / `data-variant`）
- **侧栏**：加门控前缀 `html[data-dsh-wb-sidebar="on"]`

### 新增

- **宿主探测（Fail-Closed）**：插件加载时探测 DSH 侧栏节点（`.wtg9ga_*`），
  探测不到就**整段跳过侧栏定制**，并在控制台输出 warning，而不是套上错位的样式。
  侧栏可能晚于插件挂载，因此用 `MutationObserver` 兜住时序（最多观察 10 秒）。
- **正文排版改为令牌驱动**：
  - `--dsh-font-family-text-default` → PingFang SC 优先的字体栈
  - `--dsw-font-markdown-base` → `14px / 22px`（原为 `14px / 24px`）
  - 行高用 `calc(22px + var(--dsh-content-font-delta))`，保留设置里调节字号时的联动

### 修复

- **对话区宽度被缩窄**（0.1.2 → 本次改造中引入并当场修复）：
  给满宽的滚动容器 `[data-conversation-scroll]` 套了 `max-width`，导致可滚动区域本身变窄、
  滚动条缩到中间。已移除该规则；宿主的居中栏由 `--dsh-chat-content-width`
  与拖拽手柄控制，比写死 848px 更好用。
- **正文字体规则从未生效**：此前写的 `.prose` / `.markdown-body` 是 GitHub Markdown 的类名约定，
  DSH 完全不使用，因此 v1 ~ v0.1.2 这条规则一直空转。现改为令牌驱动。

### 移除

- 20 行永不命中的 `[class*="sidebar"]` 系列死代码（DSH 类名里没有 sidebar 字样）
- 重复的 `[class*="sendButton"] / [class*="sendBtn"] / button[class*="submit"]` 一组（同样不命中）
- 现已无用的 `--wb-chat-max` 变量

### 内部

- 带哈希的 `class*=` 匹配从 33 处降到 10 处，剩余全部是无 `data-*` 可用的兜底
  （发送钮、工具展开体、工具徽标、侧栏项）
- 新增 GitHub Actions：打 `v*` tag 时校验 tag 与 `package.json` 版本一致、
  校验 `dsh.bundle` / `index.js` 具名导出、`npm pack` 冒烟测试，并建 GitHub Release

---

## 0.1.2 — 2026-11-11

首个可用版本。

### 内容

- WorkBuddy 设计令牌移植（取自 WorkBuddy v5.0.2 安装包 `resources/app.asar` 的 1985 个 `--wb-*` 变量）：
  品牌绿 `#00c29a`、灰阶 `#fafafa / #f7f7f7 / #f2f2f2 / #ebebeb / #e6e6e6`、
  正文色 `#000 / #000000b3 / #00000080 / #0000004d`
- 会话布局：正文 14px / 22px、字体 PingFang SC 优先
- 用户气泡 12px 圆角 + `#f2f2f2`
- 输入卡 24px 圆角 + 单层 `#e6e6e6` 描边，聚焦不变色
- 侧栏 `#f7f7f7`，选中态用灰阶而非品牌色
- 工具卡 8px 圆角
- 只做浅色模式

### 说明

- `0.1.1` 因 npm 两阶段发布进程中断留下 staged 记录，该版本号永久不可用，故首发为 `0.1.2`。
