export function packageValidator(subject, minimum) {
  const files = {topics:subject+'_topics', dependencies:subject+'_depend', questions:subject+'_questions', reviews:subject+'_reviews'};
  const check = (value, path, detail) => {
    if (!value) throw new Error(path + ' — ' + detail);
  };
  const unique = (set, value, path) => {
    check(typeof value === 'string' && value && !set.has(value), path, '缺少或重复的 ID/key: ' + value);
    set.add(value);
  };
  function validatePackage(pkg) {
    const {manifest, topics, questions, dependencies, reviews} = pkg;
    check(manifest?.schemaVersion === '3.0' && manifest.subject === subject &&
      /^[0-9a-f]{64}$/.test(manifest.sourceSnapshot), 'manifest.json', '版本、学科或快照无效');
    for (const [key,file] of Object.entries(files)) {
      const doc=pkg[key];
      check(doc?.schemaVersion===manifest.schemaVersion && doc?.subject===subject &&
        doc?.sourceSnapshot===manifest.sourceSnapshot, file+'.json', '数据包版本不一致');
      check(Array.isArray(doc[key]) && doc.count===doc[key].length,file+'.count','记录数量错误');
    }
    const topicIds=new Set(), criteria=new Map(), parents=new Map(), counts=new Map();
    for(const t of topics.topics){
      const path=subject+'_topics/'+t.id;
      unique(topicIds,t.id,path); counts.set(t.id,0); parents.set(t.id,[]);
      check(Array.isArray(t.masteryCriteria)&&t.masteryCriteria.length,path,'缺少掌握标准');
      for(const c of t.masteryCriteria){
        check(typeof c.id==='string' && c.id && !criteria.has(c.id) && c.text?.trim(),path+'/masteryCriteria','重复或无效的标准 '+c.id);
        criteria.set(c.id,t.id);
      }
    }
    const checkedCriteria=(ids,tid,path)=>{
      if(ids===undefined)return;
      check(Array.isArray(ids)&&ids.length&&new Set(ids).size===ids.length&&ids.every(id=>criteria.get(id)===tid),path,'标准必须属于目标节点且不重复');
    };
    const edgeIds=new Set(), pairs=new Map();
    for(const e of dependencies.dependencies){
      const path=subject+'_depend/'+e.id;
      unique(edgeIds,e.id,path);
      const a=e.sourceTopicId,b=e.targetTopicId,pair=JSON.stringify([a,b]);
      check(topicIds.has(a)&&topicIds.has(b)&&a!==b,path,'端点无效');
      check(!pairs.has(pair),path,'端点对重复'); pairs.set(pair,e.relation);
      check(['prerequisite','recommended_before','related'].includes(e.relation),path+'/relation','未知关系');
      checkedCriteria(e.targetCriterionIds,b,path+'/targetCriterionIds');
      if(e.relation==='prerequisite')parents.get(b).push(a);
    }
    const gids=new Set();
    for(const g of dependencies.prerequisiteGroups){
      const path=subject+'_depend/prerequisiteGroups/'+g.id;
      unique(gids,g.id,path);
      check(topicIds.has(g.targetTopicId)&&g.mode==='any_of'&&Array.isArray(g.memberTopicIds)&&
        g.memberTopicIds.length>=2&&new Set(g.memberTopicIds).size===g.memberTopicIds.length,path,'替代组无效');
      for(const id of g.memberTopicIds){
        check(pairs.get(JSON.stringify([id,g.targetTopicId]))==='recommended_before',path+'/memberTopicIds','成员或推荐边缺失 '+id);
        parents.get(g.targetTopicId).push(id);
      }
    }
    const active=new Set(), done=new Set();
    function visit(id){
      if(done.has(id))return;
      check(!active.has(id),subject+'_depend/'+id,'先修环');
      active.add(id);parents.get(id).forEach(visit);active.delete(id);done.add(id);
    }
    topicIds.forEach(visit);
    const qids=new Set(), owners=new Map(), sets=new Map(), prompts=new Set();
    for(const q of questions.questions){
      const path=subject+'_questions/'+q.id;
      unique(qids,q.id,path);owners.set(q.id,q.topicId);
      check(topicIds.has(q.topicId),path+'/topicId','不存在的节点');
      check(typeof q.prompt==='string' && q.prompt.trim() && typeof q.answer==='string' &&
        q.answer.trim() && ((q.type==='short' && !Object.hasOwn(q,'explanation')) ||
        (typeof q.explanation==='string' && q.explanation.trim())),path,'缺题干、答案或解析');
      check(Object.hasOwn(manifest.gradingDefaults,q.type),path+'/type','未知题型');
      unique(prompts,JSON.stringify([q.topicId,q.prompt.trim()]),path+'/prompt');
      counts.set(q.topicId,counts.get(q.topicId)+1);
      checkedCriteria(q.criterionIds,q.topicId,path+'/criterionIds');
      if(q.type==='choice'){
        const keys=new Set();for(const c of q.choices)unique(keys,c.key,path+'/choices');
        check(keys.has(q.answer),path+'/answer','无此选项');
      }
      if(q.rubric)check(q.rubric.criteria.every(c=>c.points>0&&c.description)&&
        q.rubric.criteria.reduce((a,c)=>a+c.points,0)===q.rubric.max_score,path+'/rubric','评分不一致');
      if(q.assessment_set){
        const s=sets.get(q.assessment_set)??{owner:q.topicId,focus:new Set()};
        check(s.owner===q.topicId&&['procedure','concept','application'].includes(q.assessment_focus),path,'题组归属或维度错误');
        unique(s.focus,q.assessment_focus,path+'/assessment_focus');sets.set(q.assessment_set,s);
      }
    }
    for(const [id,s] of sets)check(s.focus.size===3,subject+'_questions/'+id,'题组维度不完整');
    for(const q of questions.questions)for(const id of q.sourceQuestionIds??[])
      check(owners.get(id)===q.topicId&&id!==q.id,subject+'_questions/'+q.id+'/sourceQuestionIds','引用题目无效');
    for(const t of topics.topics){
      const path=subject+'_topics/'+t.id;
      check(counts.get(t.id)>=minimum,path,'题量不足');
      check(t.exampleQuestionId ? !t.inlineExample&&owners.get(t.exampleQuestionId)===t.id :
        typeof t.inlineExample?.question==='string'&&typeof t.inlineExample.answer==='string',path,'示例引用无效');
    }
    const reviewed=new Set();
    for(const r of reviews.reviews){
      const path=subject+'_reviews/'+r.entityType+'/'+r.entityId;
      check(r.entityType==='topic'?topicIds.has(r.entityId):r.entityType==='edge'&&edgeIds.has(r.entityId),path,'审核对象无效');
      unique(reviewed,r.entityType+'/'+r.entityId,path);
      check(r.reviewStatus===(r.reviewedDigest===r.currentDigest?'reviewed':'pending_review'),path,'审核状态错误');
    }
    check(reviewed.size===topicIds.size+edgeIds.size,subject+'_reviews','审核覆盖不完整');
  }

  function canonical(value) {
    if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
    if (value && typeof value==='object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  async function sha256(bytes) {
    const digest=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
    return Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function verifyReviewDigests(pkg) {
    const groups=new Map();
    for (const g of pkg.dependencies.prerequisiteGroups) {
      if(!groups.has(g.targetTopicId))groups.set(g.targetTopicId,[]);
      groups.get(g.targetTopicId).push(g);
    }
    const payloads=new Map();
    for(const t of pkg.topics.topics)payloads.set('topic/'+t.id,[t.name,t.description,t.masteryCriteria,groups.get(t.id)??[]]);
    for(const e of pkg.dependencies.dependencies)payloads.set('edge/'+e.id,[e.sourceTopicId,e.targetTopicId,e.relation,e.targetCriterionIds??[],e.reason]);
    await Promise.all(pkg.reviews.reviews.map(async r=>{
      const key=r.entityType+'/'+r.entityId;
      const current=await sha256(new TextEncoder().encode(canonical(payloads.get(key))));
      check(current===r.currentDigest,subject+'_reviews/'+key,'审核记录与当前对象内容不符');
    }));
  }

  // readBytes(filename) returns Uint8Array, e.g. from fetch or node:fs.
  async function loadPackage(readBytes){
    const decoder=new TextDecoder();
    const manifest=JSON.parse(decoder.decode(await readBytes('manifest.json')));
    const expectedSet=await sha256(new TextEncoder().encode(canonical(manifest.artifactHashes)));
    check(manifest.artifactSetId===expectedSet,'manifest.json/artifactSetId','成品清单摘要不符');
    const pkg={manifest};
    await Promise.all(Object.entries(files).map(async ([key,file])=>{
      const name=file+'.json', bytes=await readBytes(name);
      const hex=await sha256(bytes);
      check(hex===manifest.artifactHashes?.[name],name,'成品 SHA-256 不符');
      pkg[key]=JSON.parse(decoder.decode(bytes));
    }));
    validatePackage(pkg);
    await verifyReviewDigests(pkg);
    return pkg;
  }

  return {validatePackage, loadPackage};
}
