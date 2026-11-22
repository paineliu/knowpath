# 数学知识图谱 v3 · 字段与设计说明

这个数据包可以回答三个开发问题：一道题属于哪个知识点、它能为哪项能力提供证据、学生遇到困难时可以回查哪些基础。程序通过 ID 关联记录，显示名称、题干和标准文字可以独立修订。学生的作答记录和掌握状态由使用方另行保存。

## 1. 文件与关联

| 文件 | 主集合 | 当前内容 |
|---|---|---|
| `manifest.json` | 发布清单 | 数据版本、成品摘要、判分默认值和诊断策略 |
| `math_topics.json` | `topics` | 877 个知识点，内嵌 1796 条掌握标准 |
| `math_depend.json` | `dependencies`、`prerequisiteGroups` | 1596 条有向边，另有 2 个可替代先修组 |
| `math_questions.json` | `questions` | 8820 道题，每个知识点至少 10 道 |
| `math_reviews.json` | `reviews` | 2473 条知识点和边的审查记录 |

四个集合文件都有 `schemaVersion`（当前为字符串 `"3.0"`）、`subject`（`math`）、`sourceSnapshot`（上游输入快照标识）和 `count`（主集合长度）。依赖文件的 `count` 只计边。各文件必须来自同一套成品，缓存键可用清单的 `artifactSetId`。

| 从哪个字段出发 | 指向哪里 | 使用场景 |
|---|---|---|
| 题目 `topicId` | `topics[].id` | 取知识点下全部练习 |
| 题目 `criterionIds[]` | 本知识点的 `masteryCriteria[].id` | 取能测查某项能力的题 |
| 知识点 `exampleQuestionId` | 本知识点的一道题的 `id` | 读取展示例题及选项、配图 |
| 边 `sourceTopicId → targetTopicId` | 两端知识点的 `id` | 查目标的基础、推荐顺序或相关内容 |
| 边 `targetCriterionIds[]` | **目标**知识点的掌握标准 ID | 限定这条关系适用的能力 |
| 题目 `sourceQuestionIds[]` | 同一知识点内的原题 ID | 追溯讲解、辨错等派生练习 |
| 审查 `entityType + entityId` | 一个知识点或一条边 | 查对应版本的审查记录 |

## 2. 知识点与掌握标准

| 字段 | 含义与用法 |
|---|---|
| `id`、`name`、`description` | 字符串，分别为节点主键、展示名称、学习内容说明。用完整 ID 查找。 |
| `domain`、`stage` | 数学领域与学段。学段为 `primary` 小学、`junior` 初中、`senior` 高中。 |
| `type` | 节点类型，含 `conceptual` 概念、`procedural` 程序与运算、`reasoning` 推理、`modeling` 建模、`application` 应用。 |
| `standards[]` | 关联的课程标准条目。每项有来源条目 `id`、匹配置信标注 `confidence`，可有补充说明 `note`。 |
| `curriculum_placement` | 教材定位对象，包括来源编码 `source_grade_code`、学期 `semester`、章节 `chapter`、核实状态 `verification_status`。如 `inherited_not_reverified` 表示沿用原定位。编码 12、13、14 的显示名取自清单 `placementLabels`，分别对应选择性必修第一至三册。 |
| `masteryCriteria[]` | 每项的 `id` 是全包唯一的掌握标准编号，`text` 描述学生可以展示的能力。题目和依赖边引用这里的 ID。 |
| `exampleQuestionId` 或 `inlineExample` | 二选一。前者复用题库，后者直接保存 `{question, answer}`。两种格式都可通过 `index.example(topicId)` 展示。 |
| `contentOrigin` | 知识点、边、题目共用的来源标记。相对原始数据，`inherited` 为沿用，`revised` 为修订，`added` 为新增。内容审查状态另见第 5 节。 |

例如，节点 `cnm_p001` 对应“1到5各数的认识”。题目 `cnm_p001_q1` 问“3 的后面一个数是几？”，其 `criterionIds` 引用 `18f3d001-5fc8-51a7-9de8-064e792d4756`，对应“能说出一个数的前一个和后一个”。同节点的看图计数题另有关联标准。做学情统计时按标准 ID 汇总，可以保留这种差别。

## 3. 依赖边与可替代先修组

每条边有 `id`、`sourceTopicId`、`targetTopicId`、`relation`、`reason`（建立关系的理由）、`contentOrigin`，以及可选的 `targetCriterionIds`。从目标回查用入边，从已学知识寻找后续内容用出边。

| `relation` | 含义 | 程序用途 |
|---|---|---|
| `prerequisite` | 目标能力的候选必要基础 | 目标答错后优先选基础题直接测查 |
| `recommended_before` | 推荐先学的支持知识或可选解法 | 排学习顺序，或作为明确声明的替代组成员 |
| `related` | 比较、迁移或主题联系 | 展示关联内容 |

边省略 `targetCriterionIds` 时适用于整个节点。有该字段时只适用于列出的标准。`incomingEdges.get(id)` 返回全部入边。`incomingForCriterion(id)` 只返回整节点适用的入边，传入第二个参数后返回整节点入边加上适用于该标准的入边。

每个替代组有 `id`、`targetTopicId`、`mode`、`memberTopicIds` 和 `reason`。当前 `mode` 为 `any_of`，表示组内任一成员可满足该组要求。例如 `cnm_091` 的两种消元法可以择一。`prerequisites(id, criterionId)` 返回的 `allOf` 收集适用的直接先修节点，`groups` 单独保留各替代组。处理先修条件时逐组判断。诊断时仍需直接测查学生，上下游之间不能自动传递掌握或薄弱状态。

## 4. 题库字段与判分

每道题都有 `id`、`topicId`、`type`、`difficulty`、`prompt`、`answer` 和 `contentOrigin`。其中 `prompt` 是题干，`answer` 始终是字符串，可表示数字、分数、多项答案、选项键或参考作答。`difficulty` 目前有 `basic`、`standard`、`advanced`、`challenge`。

| 字段 | 读取规则 |
|---|---|
| `type`、`gradingMode` | `numeric` 数值题、`choice` 选择题默认 `automatic`；`short` 简答题、`self` 自评题默认 `human`。可选的题级 `gradingMode` 优先，其次取清单 `gradingDefaults[type]`。接口仅返回判分模式。 |
| `choices[]`、`figure`、`hideChoiceText` | 选择题选项含 `key`、`text`，可附 `figure`。选择题答案匹配选项键。题干和选项均可能带 SVG 字符串，`hideChoiceText` 用于图形选项的文字显示控制。 |
| `explanation` | 解析。简答题中与参考答案相同的解析可省略，读取时取 `explanation ?? answer`。 |
| `accept[]`、`unordered` | 补充可接受的答案写法；多项答案仅在 `unordered === true` 时忽略次序。 |
| `rubric` | 分项评分对象。`criteria[].description` 是给分条件，`points` 是分值，各项合计等于 `max_score`。这些评分项与知识点的掌握标准分别存储。 |
| `verify` | 维护题库时核对参考答案的表达式。学生答案的判分应使用对应题型的规则。 |
| `criterionIds[]` | 可选，一题可关联本节点的一项或多项掌握标准。缺省表示仅关联知识点。多个 ID 没有各自的分值或达标阈值。 |
| `assessment_focus`、`assessment_set` | 维度为 `procedure` 操作与计算、`concept` 概念理解、`application` 应用。缺省维度为 `unspecified`。同一个诊断组属于同一节点，三个维度各一道。单题也可标维度。 |
| `measures[]`、`diagnostic_intent`、`misconceptions` | 分别是测量内容文字列表（缺省为空）、诊断意图、按选项键记录的误解说明。程序关联标准使用 `criterionIds`。 |
| `sourceQuestionIds[]`、`revision_source_id`、`fixed_from_source` | 分别追溯同节点来源题、上游修订来源标识和原题修正说明。只有 `sourceQuestionIds` 用作本包题目外键。 |
| `authoringStatus` | `generated_practice_draft` 标识生成的练习草稿，可用于后台筛选。 |

当前有 7050 道题显式关联掌握标准，1770 道只关联知识点，所有标准均有对应题。知识点练习列表应包含两类题。分项统计只使用显式关联的作答；缺乏直接证据的能力显示“未知”。单题得分只提供该题范围内的证据。

## 5. 审查记录与发布清单

`math_reviews.json` 顶层的 `reviewerType`、`scope` 说明审查者类型与范围。每条记录用 `entityType`（`topic` 或 `edge`）和 `entityId` 定位。题目未纳入这个审查集合。

| 字段 | 含义 |
|---|---|
| `decision` | 历史审查决定，当前有 `retain` 保留、`clarify` 澄清、`add` 新增、`reclassify` 调整分类、`revise` 修订。决定对应 `reviewedDigest` 所标识的内容。 |
| `reviewedDigest`、`currentDigest`、`reviewStatus` | 审查基线摘要与当前内容摘要相同为 `reviewed`，不同为 `pending_review`。节点摘要覆盖名称、描述、掌握标准和替代组；边摘要覆盖端点、关系、适用标准和理由。 |

清单中的字段按用途读取：

| 用途 | 字段 |
|---|---|
| 版本与溯源 | `schemaVersion`、`subject`、`sourceSnapshot`、`source`、`inputHashes`、`status`、`scope`、`sourceSnapshotLimitations`、`sourceRevisionSummary` |
| 文件完整性 | `artifactHashes` 保存四个 JSON 成品的 SHA-256，`artifactSetId` 标识这组文件摘要。同一上游快照可以生成不同成品。 |
| 教学与诊断策略 | `relations`、`diagnosticPolicy`、`masteryRequiresDirectEvidence`、`assessmentPolicy`、`evidenceScope` |
| 展示与默认规则 | `placementLabels`、`gradingDefaults`、`questionFieldDefaults` |
| 维护信息 | `practiceMinimum` 为每节点最低题量，`questionCounts.original` 与 `addedPractice` 分别统计输入题和补充练习；`criteriaSource` 指向标准源文件，`reviewPolicy` 说明审查状态。 |

## 6. 在程序中读取

以下示例可在本目录以 Node.js ES 模块运行（需支持全局 Web Crypto）。浏览器中可把读取回调换成返回文件字节的 `fetch`。加载接口先核对文件摘要，再校验外键、先修环、题组和审查摘要。`createMathIndex` 建立查询索引，并为题目补齐解析、维度和测量描述的默认值。

```js
import { readFile } from 'node:fs/promises';
import { loadMathPackage, createMathIndex } from './index.mjs';

const pkg = await loadMathPackage(name => readFile(new URL(name, import.meta.url)));
const index = createMathIndex(pkg);
const topicId = 'cnm_p001';
const criterionId = '18f3d001-5fc8-51a7-9de8-064e792d4756';

const topic = index.topicById.get(topicId);
const practice = index.questionsByTopic.get(topicId);
const targeted = practice.filter(q => q.criterionIds?.includes(criterionId));
const example = index.example(topicId);
const prerequisites = index.prerequisites(topicId, criterionId);
console.log(topic.name, practice.length, targeted.length, example.question, prerequisites);
```

按题目 ID 查详情用 `questionById.get(id)`，按题型取判分模式用 `index.gradingMode(q)`。诊断组索引为 `setsByTopic.get(topicId).get(setId).get(focus)`，结果是题目 ID。审查记录可用 `reviewByEntity.get('topic/' + topicId)` 读取。

## 7. 维护与验证

从仓库根目录运行以下命令。构建脚本会重新导出 JSON，持久修改应落在构建输入中。掌握标准维护在 `scripts/math_v3_sources/criteria.json`，逐题映射维护在同目录的 `question_criteria.json`，部分派生题的关联由构建规则产生。

```sh
python3 scripts/build_math_v3.py
node scripts/check_math_v3.mjs data/math_v3
node tests/test_math_v3.mjs
```


### 分项学情查询

`index.criterionReport(topicId, attempts, confirmedCriteria)` 接受单个学生的作答数组和可选的已确认达标标准 ID 数组。当前包作答包含 `questionId`、`result`（correct 或 wrong）和作答时的 `artifactSetId`。旧记录需以题干、题型、答案、选项及配图核对同一道题。跳过、排除和无法核对的记录不参与统计。

返回的 `dimensions` 是该知识点实际有题的维度，`diagnosticSets` 是完整三维题组数量。每项标准分别给出关联题数、草稿数、已答不同题数和总作答次数。无直接记录为 unknown，有直接记录为 observed，有直接记录且调用方已确认达标为 mastered。记录数量本身不会触发达标。孩子档案的历史页可展开每次数学诊断查看这些直接证据；旧档案只保存节点结论时，无法还原逐题证据。

新增直接测查题及一年级替换题保存在 `scripts/math_v3_sources/direct_checks.json`。本轮 AI 复核记录在 `scripts/math_v3_sources/review_updates.json`，保留前次摘要及决定，区分措辞和内容变更。
