# 动 UI 布局的 TODO

这份文档回答一个问题：**如果以后不满足于「换配色」，要把 DSH 的界面布局也改成
WorkBuddy 的样子，该怎么做、按什么顺序做、每一步会踩什么坑。**

现状（0.4.1）只做第 0 层：配色、字体、间距、圆角这类「形状之外的外观」。
布局一层没动，这是有意的——布局的每一步都比配色危险一个量级，而危险来源不同，需要分别对待。

---

## 0. 先认清三种改造手段的风险

| 层 | 手段 | 谁在用 | 改动范围 | DSH 升级后 | 回滚 |
|---|---|---|---|---|---|
| L0 令牌 | `theme.overrideTokens()` | 本插件、dsh-theme-native、dsh-appearance、dsh-fonttune | 颜色 / 字体 / 部分尺寸 | **基本不坏** | 整层撤销，干净 |
| L1 结构 CSS | 自己注入 `<style>` 改盒模型、排列、显隐 | 本插件、dsh-fonttune 的一部分 | 位置 / 大小 / 顺序 | 类名带哈希，**会坏** | 删标签即恢复 |
| L2 槽位插入 | `ctx.slots.register()` 往宿主预留的位置塞自己的组件 | codex-ui、claude-style 的设置页 | 增加元素 | **契约稳定**，最安全 | disposer 撤销 |
| L3 DOM 改写 | `MutationObserver` + 移动/包裹/删除宿主节点 | codex-ui 侧栏分区、claude-style 部分 feature | 任意 | **最脆** | 需完整快照回滚，容易留残骸 |
| L4 CSS 重写 | 用 CSSOM 改写宿主已注入的样式表 | claude-style（`engine/src/sheet-rewrite.ts`） | 任意 | 中，规则还在就活得下来 | 写回原选择器 |

**结论：能往低层走就别往高层走。** L2 槽位插入是被官方设计出来的，
只要宿主还在那里留位置，几乎不会坏；L3/L4 是「和宿主的渲染逻辑抢方向盘」，
一旦 DSH 换一版 React 结构就得重做。这件事的判断顺序应该是：
**能不能只靠 L0 → 能不能靠 L1 → 能不能靠 L2 → 实在不行才考虑 L3/L4。**

---

## 1. 动手之前必须做的事

- [ ] **锁定宿主版本。** 读 `E:/DeepSeek Harness/resources/app.asar` 里的
      `dsh/node_modules/@deepseek-ai/dsh-web-frontend/package.json` 版本号，
      写进本文件与 README。所有类名哈希都是这一版编译出来的。
- [ ] **把要改的组件的全部类名 + CSS 原文抄下来**，存到 `docs/host-<组件>-<版本>.css`。
      将来 DSH 升级，diff 这份快照就能知道哪里变了——不要靠记忆。
      已有导出脚本：`C:\Users\4399\.dsh\tmp\asar_get.js <asar内路径> <输出>`
      （索引 `C:\Users\4399\.dsh\tmp\asar_index.json`）。
- [ ] **给每一处改动写「探测门控」**。这是本插件现有的做法，布局改造必须延续：
      找不到预期节点就整段跳过 + `console.warn`，宁可少改，不要错改。
- [ ] **准备回滚开关。** 现在已有 `localStorage['dsh-workbuddy-theme:enabled']`
      总开关；布局部分要单独一个键（建议 `dsh-workbuddy-theme:layout`），
      这样「配色留着、布局关掉」可以分开。
- [ ] **每个布局改动单独一个 CSS 节 + 单独一次提交**，这样出问题能精确 revert。
      别把 5 个改动塞进一次提交。

---

## 2. 宿主到底留了哪些扩展点（已核实）

### 2.1 客户端槽位（L2，安全）

从 `dsh-client-ui-conversation` / `dsh-client-ui-sidebar` / `dsh-client-ui-workspace`
三个包的 `lib/client.js` 里抄出来的真实槽位树：

```
main.conversation
└─ conversation.header                    single
   ├─ conversation.header.leading         single, root
   └─ conversation.session.header         single
      ├─ .lineage / .actions / .utilities / .corner   single
conversation.content                      session-maybe
├─ conversation.session                   single
│  └─ conversation.view                   list      ← 视图页签（对话 / 文件 等）
├─ conversation.composer                  chain
├─ conversation.composer.bar              single
└─ conversation.input.dock                list      ← 输入框上方附加区
   ├─ conversation.input.overlay          ← 浮层
   ├─ conversation.input.attachments
   ├─ conversation.input.permission
   ├─ conversation.input.plan
   ├─ conversation.input.left / .right
   ├─ conversation.input.model
   └─ conversation.input.activity

sidebar.workspaces                        ← 侧栏主体区域
├─ sidebar.workspaces.directoryFlow       single
├─ sidebar.workspaces.session.row.action  list      ← 每个会话行右侧按钮
├─ sidebar.session.row.leading            list, inline
├─ sidebar.session.row.trailing           list, inline
└─ sidebar.session.row.hover              list

sidebar.panellist / .panellist.actions / .footer.action / .settings
sidebar.brand.mark / .brand.name / .toggle.badge / .left.toggle
contextMenu.content (key: "session")      ← 会话右键菜单
settings.section → general → settings.general.item (list, 已占用 order 见下)
```

已占用的 `settings.general.item` order：appearance 10、font-size 11、developer-tools 15、
session-log 90、current-version 100。本插件用 9.5。

**这些槽位足以完成的事情**（不用碰 DOM）：会话行右侧加自定义按钮、
输入框上方加面板、加一整个设置页、往右键菜单里加项、往会话头右侧加控件。

### 2.2 宿主的 data-* 契约（L1 的首选钩子）

宿主 JSX 里直接发布的属性，比类名稳定得多：

| 属性 | 位置 | 发布方 |
|---|---|---|
| `data-composer-card` / `-input` / `-seat` / `-dock` / `-overlay` / `-placeholder` | 输入卡 | `dsh-client-ui-conversation` |
| `data-message-bubble` | 用户气泡 | `dsh-client-ui-chat`（UserMessageBubble） |
| `data-tool` / `data-state` / `data-variant` | 工具行 | `dsh-client-ui-tool`（ToolRow） |
| `data-conversation-scroll` / `-content` / `-region` | 对话滚动区 | `dsh-client-ui-conversation` |
| `data-ds-dark-theme` | body 深色态 | `dsh-client-ui-theme` |

**侧栏与会话行没有 data-\* 属性**，只能靠 `.wtg9ga_*` / `AnXs9G_*` 这类哈希类名——这是侧栏动布局的主要风险点。

---

## 3. TODO 清单

按「风险从低到高、收益从大到小」排。**建议严格按顺序做，每一步都能独立发布、独立回滚。**

### P0 —— 只动 L0 + L1，不碰结构与 DOM

- [ ] **行高与密度的全局档位。** 正文 14/22、次要 13px 已是 WorkBuddy 的值；
      剩下的是**列表行高**（侧栏 40px 已改）与**设置页行高**（宿主 40px + 16px padding）。
      目标：给宿主令牌再加一层 `--dsh-content-font-delta` / 行高档位，让「紧凑 / 舒适」两档可选。
      风险：低。**这是最值得先做的一件事**，视觉收益大。
- [ ] **对话栏宽度分级。** 宿主是 `--dsh-chat-content-width: clamp(680px, 列宽×0.64, 920px)`，
      WorkBuddy 是固定 848px、屏幕 ≥1681px 时 1008px。
      做法：L1 覆盖 `.an3WzG_body` 上的 `--dsh-chat-content-width`，用 `@media` 分档，
      不要动 `[data-conversation-scroll]`——**这个坑踩过一次**（0.2.0：
      给滚动容器加 `max-width` 会把可滚动区本身缩窄，表现为「对话范围变小」）。
- [ ] **输入卡内部分区。** 宿主 `GRgSLq_root > card > [input, row, dock]`。
      WorkBuddy 是「输入区 / 工具条 / 底部信息」三段，间距 12px / 8px。
      做法：只调 `gap`、`padding`、`min-height`，**不改 DOM**。
- [ ] **工具卡展开态的高度上限。** 宿主 `.hKdVjq_bodyScroll{max-height:260px}`。
      WorkBuddy 是折叠到 320px 且带渐隐。L1 可做，注意别写死高度导致内容截断。

### P1 —— L1 结构调整（需要认真做探测门控）

- [ ] **侧栏会话行改成 WorkBuddy 的双行结构**：
      上「标题 · 时间」一行、下「工作区 / 标签」一行。
      宿主现在是单行 `panelRow`（40px）。
      做法：只能用 CSS（`flex-wrap` + 伪元素），因为**不能加 DOM**。
      局限：拿不到真实数据做第二行，只能把已有的 metadata 挪位置。
      如果非要真实数据 → 升级为 P3 的 L2/L3 方案。
- [ ] **会话分组**（今天 / 昨天 / 更早）。宿主没有分组 DOM，
      纯 CSS 做不到。**必须走 L3**（参考 codex-ui `sections/`：用 `MutationObserver`
      观察 `[data-row-key^="workspace:"]`，插入自己的分组标题）。
      这是 L3 里最值得做的一个，也是风险最高的一档，建议单独一个开关。
- [ ] **空状态 / Hero 区重排**（`conversation.hero.brand.mark` / `.hero.workspace` /
      `.hero.options`）。这几个是槽位，能直接注册替换 → 属于 L2，安全。

### P2 —— L2 槽位插入（安全，但要做成正式组件）

- [ ] **输入框下方加「最近文件 / 快捷指令」条**：注册 `conversation.input.dock`。
- [ ] **会话行右侧加状态徽标**：注册 `sidebar.session.row.trailing`（`inline: true`）。
- [ ] **会话头右侧加统计**（上下文占用 / 令牌数，参考 claude-style 的 `context-stats`）：
      注册 `conversation.session.header.utilities`。
- [ ] **一个完整的「WorkBuddy 外观」设置页**：注册 `settings.section`（order 18 附近，
      参考 dsh-theme-native 的 `codex-theme`）。比现在挂在「通用」里的一行更合适——
      布局开关、宽度档位、密度档位都塞得进去。
      注意：这是**新增一页**，`settings.section` 已占用 12 个 id，别撞名。

### P3 —— L3 DOM 改写 / L4 CSS 重写（最后再碰）

- [ ] **侧栏整体重构**（WorkBuddy 是「工作区下拉 + 会话列表 + 底部账号」三段）。
      做法参考 `@michengai/dsh-codex-ui`：`MutationObserver` + `querySelector` 往宿主节点旁插自己的节点，
      给宿主按钮打 `data-*` 标记避免重复处理，状态持久化到自己的 store（它用 32KB 上限 + 校验）。
- [ ] **L4：运行时改写宿主样式表**（`CSSOM` 原地改选择器再写回）。
      参考 `dsh-claude-style/engine/src/sheet-rewrite.ts`——它保留规则在原位置、
      写回原选择器即完全复原。**只在 L1 无法覆盖（优先级/顺序问题）时才用。**
      许可证注意：那份引擎是 PolyForm Shield，只能读思路，不能抄代码。

---

## 4. 每个改动都必须通过的验收

- [ ] `node --check client.js` 通过
- [ ] `grep -c $'\xef\xbf\xbd' client.js` → 0（编码自检，见 AGENTS.md）
- [ ] CSS 花括号深度 0
- [ ] CSS 里引用的每个 `var(--dsw-*)` 都真实存在（脚本：`C:\Users\4399\.dsh\tmp\check_vars.mjs`）
- [ ] 回归测试全绿：`wb_test.mjs` 32/32、`wb_row_test.mjs` 25/25、`switch_test.mjs` 19/19、`dark_test.mjs` 10/10
- [ ] 浅色 + 深色各渲染一次预览截图，取色核对
      （脚本：`C:\Users\4399\.dsh\tmp\make_preview.mjs` + Edge `--headless=new --dump-dom`）
- [ ] **真实 DSH 里目视确认**（预览页只能证明 CSS 本身，证明不了宿主 DOM 真的长这样）
      抓图：`C:\Users\4399\.dsh\tmp\pw2.py`（PrintWindow，不占用户鼠标）
- [ ] 在 CHANGELOG 写清「改了什么、为什么、怎么退回」

---

## 5. 已知的坑（都是真踩过的）

| 坑 | 现象 | 原因 |
|---|---|---|
| 给 `[data-conversation-scroll]` 加 `max-width` | 「对话范围变小、滚动条缩到中间」 | 那是满宽的滚动容器，缩它就缩了可滚动区。居中栏应由 `--dsh-chat-content-width` 实现 |
| 给表格容器加 `overflow: hidden` | 横向滚动条消失、右侧内容看不到 | 宿主 `.md-table-wide` 是「平时 overflow-x:hidden + padding-bottom 预留、hover 才展开」的逐行滚动方案 |
| 用 `appearance: none` 自绘复选框 | 勾选状态看不见（全变空框） | 宿主复选框有多种 DOM，选择器漏一种就丢功能。**回退 accent-color** |
| 在 `<body>{}` 之前注入覆盖 | 全量失效，看到的还是 DSH 原色 | DSH 令牌写在 `body{}` 里，`:root` 与 `body` 是两个元素、互不覆盖；必须用同等或更高特异性并在源顺序上靠后 |
| 把「本就不命中」的模糊选择器换成精确属性选择器 | 原先潜伏的破坏性规则被激活 | 迁移前必须逐条判断「这条规则原来到底生效了没有」 |
| 设 `store` / `inject` 但契约不满足 | 设置行不显示（错误边界吞掉，界面无痕迹） | 行组件崩溃时 `SlotErrorBoundary` 只渲染空 div。**先用 console 诊断账本，再猜** |
| 侧栏用 `[class*="sidebar"]` | 一条都不命中 | 改版后类名已完全不含 `sidebar` 字样。`class*=` 只是兜底，不是策略 |
| CI 里 OIDC 的 workflow 文件名对不上 | `ENEEDAUTH / need auth`，看起来像没登录 | Trusted Publisher 绑定的是**文件名字符串**，改名即失效 |

---

## 6. 不建议做的事

- **不要注册自定义主题 id**。宿主的 `setTheme` 只持久化 `light` / `dark` / `system`，
  自定义 id 选了存不住；外观卡片的三块也是写死的 `CUBES` 数组，注册了也不会出现在里面。
  0.3.0 之前就是栽在这上面（切到深色回不来、切走字体残留）。
- **不要用 `[class*="xxx"]` 去猜类名**。只在找不到任何 data-\* 属性、且必须改的那几处用，
  并且要写注释说明为什么只能用哈希类名。
- **不要在插件里重启应用、不要自己改宿主的 package.json 依赖**（除了用户明确要求）。
- **不要在没有真实页面验证的情况下改「绘制方式」**（原生控件外观、`appearance`、
  `pointer-events`、`display` 这类）。外观妥协可以接受，功能丢失不行。

---

## 7. 参考实现（已 clone 到 `C:\Users\4399\.dsh\tmp\ref\`）

| 插件 | 值得看什么 |
|---|---|
| `Nwflower_dsh-claude-style` | `engine/src/sheet-rewrite.ts`（L4 原地改写并复原）、46 个 `features/*` 模块的拆分方式、`skin.json` 的皮肤描述格式 |
| `michengai_dsh-codex-ui` | `src/client/sidebar/sections/`（L3 侧栏分区：观察器 + 插节点 + 打标记）、`src/client/composer/`（用 `conversation.input.dock` 做输入历史） |
| `BarneyZhaoooo_dsh-theme-native` | 纯 L0 的最干净写法：重排静态色阶，alias 层自动跟随 |
| `LyaxZ_dsh-fonttune` | 字体轴拆两层（令牌管字体栈、自己的 `<style>` 管字号行高） |
| `LX-HMKK_DSH-appearance` | `settings.section` 整页设置的做法 |

---

## 8. 建议的落地顺序

1. P0 四项（全是 L1，风险低，收益大）→ 发 0.5.0
2. P2 里挑 1~2 项做成正式槽位组件 → 发 0.6.0
3. P1 的会话分组（L3）单独一个开关、单独一个大版本 → 0.7.0
4. P3 只在真的需要时做，且必须做成「关掉就和原生一模一样」

每一步发布前，先问自己一个问题：**万一 DSH 明天升级，用户看到的是「样式没生效」（可接受）
还是「界面坏了、点不动了」（不可接受）？**
