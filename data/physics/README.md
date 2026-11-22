# 物理 v3 字段与接入说明

知识点、题目、掌握标准、先修关系和题组沿用[数学 v3 字段说明](../math/README.md)中的命名和关联方向。本包由原有三份物理数据转换，保留原知识点、题目和关系边 ID。

| 文件 | 用途 |
|---|---|
| manifest.json | 版本、文件摘要、教材册次编码、默认判分规则和学科策略 |
| physics_topics.json | 节点、masteryCriteria、教材定位和展示例题 |
| physics_depend.json | sourceTopicId → targetTopicId 的有向边及替代先修组 |
| physics_questions.json | 按 topicId 查题，按可选的 criterionIds 筛选具体能力 |
| physics_reviews.json | 节点与边的来源审查状态和当前摘要 |

**学科字段。** nodeKind 区分普通知识点、实验及其他教学活动。answer_unit 保留答案单位，verification_kind 区分表达式核对和答案字面一致性检查。物理题保留 physics_assumptions（模型假设）和 percent（百分数标记）。节点的 mathLinks[].id 可连接 math 的知识点，reason 说明关联理由。这些链接用于数学支撑参考。 书面作答只能提供书面证据，实验操作能力需要另行观察。

**覆盖与来源。** 每节点现有题量下限为 4，见 manifest.practiceMinimum。已有诊断组包含 procedure、concept、application 三个维度。此次转换只在原题 measures 与本节点标准文字完全一致时建立 criterionIds。缺少该字段时，可按知识点选题。authoringStatus 保留 AI 编写草稿标记。contentOrigin 表示来源，sourceReviewStatus 保存上游编辑状态；尚无批准基线的记录使用 pending_review，reviewedDigest 和 decision 均为 null。

**程序接入。** 三科的 index.mjs 都导出 loadPackage 和 createIndex。把模块放在原目录结构中，保留相邻的 shared 公共模块。下面的示例在本目录以 Node.js ES 模块运行。

```js
import { readFile } from 'node:fs/promises';
import { loadPackage, createIndex } from './index.mjs';

const pkg = await loadPackage(name => readFile(new URL(name, import.meta.url)));
const index = createIndex(pkg);
const id = pkg.topics.topics[0].id;
console.log(index.example(id), index.questionsByTopic.get(id).length);
```

在仓库根目录运行 `python3 scripts/build_science_v3.py` 可重建物理和化学包。发布时以 manifest.artifactSetId 识别成品版本。
