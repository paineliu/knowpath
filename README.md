# 知序 · 全学科知识图谱

面向小学至高中的知识图谱浏览与编辑工作台，直接读取 `data/` 中六个学科的 v3 数据包，无需安装依赖。

## 在线体验与项目介绍

- [打开知序](https://paineliu.github.io/knowpath/)
- [阅读项目介绍](https://paineliu.github.io/knowpath/intro.html)
- [可直接复制的分享文案](https://paineliu.github.io/knowpath/intro.html#share)

## 运行

```sh
npm run dev
```

访问 http://localhost:5173 。请通过 HTTP 服务访问，直接打开 HTML 无法读取 JSON。

## 功能

- 数学、物理、化学、生物、历史、地理切换；按学段、知识领域及关键词筛选。
- 知识点目录、列表视图及可缩放的局部知识关联图；图中每侧最多展示五个节点，详情提供所有关联。
- 查看与编辑知识点说明、掌握目标、题目、答案、解析、选项和难度；新增知识点与例题。
- 新增及编辑必要基础、推荐先学、相关知识关系；检查重复关系及必要基础循环。
- SVG 配图展示；输出文字经过转义，SVG 过滤脚本及外部引用。
- 修改存储于当前浏览器 localStorage；按学科导出包含 topics、depend、questions 的 JSON 文件。

## 手机与慢速网络加载

图谱与例题分开加载：先下载当前学科的知识点和关联，再按知识点加载例题分包。请求超时后显示重试入口，例题加载失败不会阻塞图谱浏览。导出时仍会读取完整学科题库。

修改原始数据后运行 `npm run build:data` 重新生成 `data/runtime/`；发布时一并提交。运行 `npm test` 可检查超时、按需加载、切换学科及分包数据完整性。

## 数据保存范围

原始 `data/` 文件不会被网页修改。清除浏览器数据会移除本地编辑，请及时导出备份。当前是单机工作台，不包含账号、云端同步或多用户协作。修改掌握目标时按原有行序保留 ID，避免破坏原题目的标准引用。

## 检查

```sh
npm run check
```

已检查六科题目及依赖边的知识点外键、脚本语法和 HTTP 资源响应。浏览器控制服务不可用，尚未完成实际浏览器交互和视觉验收。

## 数据来源、致谢与许可

本网站使用的六科知识图谱数据基于 [xiaoyang111222 及项目贡献者的 cn-math-taxonomy](https://github.com/xiaoyang111222/cn-math-taxonomy) 整理、修订与扩充。感谢原项目对基础教育知识结构与题库建设的贡献。

当前 v3 数据包包含对知识点说明、掌握标准、知识关联和配套题目的修订或补充。各学科的 `data/<subject>/manifest.json` 保留来源仓库、来源文件摘要、`sourceSnapshot`、`sourceRevisionSummary` 及来源局限说明。`sourceSnapshot` 是数据包记录的快照标识，不应直接当作 Git 提交号。

网站提供独立开发的图谱浏览、编辑与导出界面。用户在浏览器中编辑的内容属于后续修改；本站不代表原作者认可、合作或背书。

来源数据采用 [CC BY-NC 4.0（署名—非商业性使用 4.0 国际）](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans)，参见[原项目 LICENSE](https://github.com/xiaoyang111222/cn-math-taxonomy/blob/main/LICENSE)。使用、修改或再分发相关数据时，应保留作者署名、来源及许可链接，并说明改动。商业使用需另行取得原权利人授权，联系入口见原项目 README。本说明不为网站新增代码单独设定许可证。

数据按现状提供，不保证内容完整、准确或适用于特定教学目的；请结合教材及教学实际核对。

导出 JSON 包含 `attribution`、`sourceManifest` 和 `exportNotice`，保留来源、许可、改动说明以及输入包的来源记录。来源清单内的摘要、计数与审查状态仅描述输入包，不代表编辑后的导出数据已重新验证；原数据内既有的来源和修订字段一并保留。
