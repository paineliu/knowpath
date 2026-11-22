import { buildIndex } from '../shared/index.mjs';
import { validatePackage } from './validate.mjs';
export * from './validate.mjs';

export function createIndex(pkg) {
  const index = buildIndex(validatePackage, pkg);
  // Pass attempts for one learner. Confirmation is an explicit decision by the caller.
  function criterionReport(topicId, attempts = [], confirmedCriteria = []) {
    const topic = index.topicById.get(topicId);
    if (!topic) throw Error('未知知识点 ' + topicId);
    const questions = index.questionsByTopic.get(topicId);
    const graded = attempts.filter(a => {
      const q = index.questionById.get(a.questionId);
      if (!q || q.topicId !== topicId || !['correct', 'wrong'].includes(a.result) || a.excluded) return false;
      if (a.artifactSetId === pkg.manifest.artifactSetId) return true;
      // Imported legacy records need the actual item shown to the learner.
      return a.prompt === q.prompt && a.answer === q.answer && a.type === q.type &&
        (a.figure ?? '') === (q.figure ?? '') &&
        JSON.stringify(a.choices ?? []) === JSON.stringify(q.choices ?? []);
    });
    const focusLabels = ['procedure', 'concept', 'application'];
    const dimensions = focusLabels.filter(f => questions.some(q => q.assessment_focus === f));
    const criteria = topic.masteryCriteria.map(c => {
      const items = questions.filter(q => q.criterionIds?.includes(c.id));
      const ids = new Set(items.map(q => q.id));
      const records = graded.filter(a => ids.has(a.questionId));
      return { ...c, questionCount: items.length,
        draftCount: items.filter(q => q.authoringStatus === 'generated_practice_draft').length,
        attemptedQuestions: new Set(records.map(a => a.questionId)).size, attempts: records.length,
        status: !records.length ? 'unknown' : confirmedCriteria.includes(c.id) ? 'mastered' : 'observed' };
    });
    return { dimensions, diagnosticSets: index.setsByTopic.get(topicId).size, criteria };
  }
  return { ...index, criterionReport };
}
export { createIndex as createMathIndex };
