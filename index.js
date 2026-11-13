// dsh-workbuddy-theme — 宿主端（node）。
//
// 效果全在 client.js：主题通过宿主公开的 ctx.theme.overrideTokens()
// 叠加一层令牌覆盖（配色 + 字体），再注入一段只描述结构细节的 CSS。
// 宿主端不持有任何状态，也不面向模型。
//
// 这里存在的唯一目的，是让加载器挂起本包，
// 从而由 dsh-client-modules 提供 /plugins/dsh-workbuddy-theme/client.js。
export const name = 'dsh-workbuddy-theme'

/** 宿主端没有要挂载的东西。 */
export function apply() {}
