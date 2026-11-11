// dsh-workbuddy-theme — 宿主端（node）。
//
// 与本文件同目录的 client.js 是全部效果所在：主题是一段注入到页面 <head> 的 CSS，
// 不涉及任何服务端状态或传输。这里的存在只有一个目的——让加载器把本包挂起来，
// 从而让 dsh-client-modules 提供 /plugins/dsh-workbuddy-theme/client.js。
// 写法与官方 dsh-focus-notify 的宿主端一致：导出 name + 空 apply。
export const name = 'dsh-workbuddy-theme'

/** 宿主端没有要挂载的东西。 */
export function apply() {}
