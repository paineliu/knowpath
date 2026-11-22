# 生物 v3 字段与接入说明

核心字段和关联方向见[数学 v3 字段说明](../math/README.md)。本包由原有生物数据转换，保留知识点、题目与边的 ID。

| 文件 | 用途 |
|---|---|
| manifest.json | 成品版本、教材册次、审查依据、判分默认值和诊断策略 |
| biology_topics.json | 节点、活动类型 nodeKind、掌握标准 masteryCriteria 与展示例题 |
| biology_depend.json | 从 sourceTopicId 到 targetTopicId 的关系与先修组 |
| biology_questions.json | 按 topicId 选题，按可选 criterionIds 筛选具体能力 |
| biology_reviews.json | 节点与边的来源状态、摘要及待复核状态 |

biological_assumptions 保存生物学题设条件，answer_unit 保存答案单位。实验操作表现需另行观察。

每节点至少 4 道题。迁移时仅在原题 measures 和本节点掌握标准文字完全相同时建立 criterionIds。其余题可参与知识点练习。reviewStatus 为 pending_review 表示仍待建立逐项批准基线。

## 接入

在本目录的 Node.js ES 模块中可以这样读取。部署时保留相邻的 shared 公共模块。

```js
import { readFile } from 'node:fs/promises';
import { loadPackage, createIndex } from './index.mjs';

const pkg = await loadPackage(name => readFile(new URL(name, import.meta.url)));
const index = createIndex(pkg);
const id = pkg.topics.topics[0].id;
console.log(index.example(id), index.questionsByTopic.get(id).length);
```

在仓库根目录运行 `python3 scripts/build_science_v3.py` 可从上游 JSON 重建数据包。
