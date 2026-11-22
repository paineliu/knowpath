// Pass the parsed JSON documents, e.g. from fetch() or a local file loader.
export function buildIndex(validatePackage, { manifest, topics, dependencies, questions, reviews }) {
  validatePackage({ manifest, topics, dependencies, questions, reviews });
  const topicById = new Map(topics.topics.map(t => [t.id, t]));
  const questionById = new Map(questions.questions.map(q => [q.id, { measures: [], assessment_focus: 'unspecified', explanation: q.answer, ...q }]));
  const emptyLists = () => new Map(topics.topics.map(t => [t.id, []]));
  const incomingEdges = emptyLists();
  const outgoingEdges = emptyLists();
  const questionsByTopic = emptyLists();
  const groupsByTopic = emptyLists();
  const setsByTopic = new Map(topics.topics.map(t => [t.id, new Map()]));
  for (const e of dependencies.dependencies) {
    incomingEdges.get(e.targetTopicId).push(e);
    outgoingEdges.get(e.sourceTopicId).push(e);
  }
  for (const g of dependencies.prerequisiteGroups) groupsByTopic.get(g.targetTopicId).push(g);
  for (const q of questionById.values()) {
    questionsByTopic.get(q.topicId).push(q);
    if (q.assessment_set) {
      const sets = setsByTopic.get(q.topicId);
      if (!sets.has(q.assessment_set)) sets.set(q.assessment_set, new Map());
      sets.get(q.assessment_set).set(q.assessment_focus, q.id);
    }
  }
  const reviewByEntity = new Map(reviews.reviews.map(r => [r.entityType + '/' + r.entityId, r]));
  function incomingForCriterion(id, criterionId) {
    const topic = topicById.get(id);
    if (!topic || (criterionId && !topic.masteryCriteria.some(c => c.id === criterionId)))
      throw new Error('节点或掌握标准不存在: ' + id + '/' + criterionId);
    return incomingEdges.get(id).filter(e => !e.targetCriterionIds || e.targetCriterionIds.includes(criterionId));
  }
  function prerequisites(id, criterionId) {
    const allOf = incomingForCriterion(id, criterionId).filter(e => e.relation === 'prerequisite').map(e => e.sourceTopicId);
    const groups = groupsByTopic.get(id);
    return { allOf, groups, hasPrerequisites: allOf.length > 0 || groups.length > 0 };
  }
  function example(id) {
    const t = topicById.get(id);
    if (t.inlineExample) return t.inlineExample;
    const q = questionById.get(t.exampleQuestionId);
    const result = { question: q.prompt, answer: q.answer, explanation: q.explanation };
    for (const key of ['choices', 'figure', 'hideChoiceText']) {
      if (key in q) result[key] = q[key];
    }
    return result;
  }
  function gradingMode(q) {
    return q.gradingMode ?? manifest.gradingDefaults[q.type];
  }
  return { topicById, questionById, incomingEdges, outgoingEdges, questionsByTopic,
    groupsByTopic, setsByTopic, reviewByEntity, incomingForCriterion, prerequisites, example, gradingMode };
}
