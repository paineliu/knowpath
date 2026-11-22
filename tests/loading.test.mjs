import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fetchJSON} from '../data-loader.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
test('request timeout includes an indefinitely stalled response body',async()=>{
 let signal;
 await assert.rejects(fetchJSON('/slow',{timeout:15,fetcher:async(_,options)=>{signal=options.signal;return {ok:true,json:()=>new Promise(()=>{})}}}),/超时/);
 assert.equal(signal.aborted,true);
});
test('HTTP errors are surfaced for retry',async()=>{
 await assert.rejects(fetchJSON('/missing',{fetcher:async()=>({ok:false,status:404})}),/404/);
});
test('all six runtime graphs and question chunks preserve original data',async()=>{
 for(const subject of ['math','physics','chemistry','biology','history','geography']){
  const graph=await read(`data/runtime/${subject}/graph.json`);
  assert.deepEqual(graph.topics,await read(`data/${subject}/${subject}_topics.json`));
  assert.deepEqual(graph.depend,await read(`data/${subject}/${subject}_depend.json`));
  assert.deepEqual(graph.manifest,await read(`data/${subject}/manifest.json`));
  const original=await read(`data/${subject}/${subject}_questions.json`),rows=[];
  for(const file of new Set(Object.values(graph.questionFiles)))rows.push(...await read(`data/runtime/${subject}/${file}`));
  assert.deepEqual([...rows].sort((a,b)=>a.id.localeCompare(b.id)),[...original.questions].sort((a,b)=>a.id.localeCompare(b.id)));
  for(const row of rows)assert.ok(graph.questionFiles[row.topicId]);
  const {questions,...metadata}=original;const {questions:empty,...runtimeMetadata}=graph.questions;
  assert.deepEqual(metadata,runtimeMetadata);assert.deepEqual(empty,[]);
 }
});
test('graph renders while questions are pending, failed chunks retry, stale replies stay isolated',async()=>{
 const elements=new Map();
 const element=selector=>{if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',value:'',style:{},classList:{toggle(){}},querySelectorAll(){return []},addEventListener(){}});return elements.get(selector)};
 const calls=[];let releaseMath,fail=true;
 const source=(await readFile(new URL('../app.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
 const context=vm.createContext({document:{querySelector:element,addEventListener(){}},localStorage:{getItem(){return null}},setTimeout,clearTimeout,structuredClone,console,fetchJSON:async url=>{
  calls.push(url);
  if(url.endsWith('graph.json'))return read(url);
  if(url.includes('/math/'))return new Promise(resolve=>{releaseMath=async()=>resolve(await read(url))});
  if(fail)throw Error('test timeout');
  return read(url);
 }});
 vm.runInContext(source,context);
 const settle=()=>new Promise(resolve=>setTimeout(resolve,25));await settle();
 assert.match(element('#topic-list').innerHTML,/一元/);assert.match(element('#graph').innerHTML,/<svg/);
 assert.equal(calls.filter(x=>x.endsWith('_questions.json')).length,0);
 assert.match(element('#detail').innerHTML,/正在加载当前知识点/);
 await vm.runInContext("load('physics')",context);await settle();
 assert.match(element('#detail').innerHTML,/重试加载例题/);
 fail=false;vm.runInContext('loadTopicQuestions(true)',context);await settle();
 assert.doesNotMatch(element('#detail').innerHTML,/重试加载例题|正在加载当前知识点/);
 const before=element('#detail').innerHTML;await releaseMath();await settle();
 assert.equal(vm.runInContext('subject',context),'physics');assert.equal(element('#detail').innerHTML,before);
 await vm.runInContext('loadAllQuestions()',context);
 assert.equal(vm.runInContext('pkg.questions.questions.length',context),(await read('data/physics/physics_questions.json')).questions.length);
 assert.equal(vm.runInContext('pkg.allQuestionsLoaded',context),true);
});
