# 更新日志

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
本插件只做视觉，不以破坏性方式改变结构，因此主版本号的变化只代表「选择器策略或视觉规范的整体换代」。

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
