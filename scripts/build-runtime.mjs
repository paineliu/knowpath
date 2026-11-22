import {readFile,writeFile,mkdir} from 'node:fs/promises';
const subjects=['math','physics','chemistry','biology','history','geography'];
for(const subject of subjects){
 const read=async name=>JSON.parse(await readFile(new URL(`../data/${subject}/${name}`,import.meta.url),'utf8'));
 const topics=await read(`${subject}_topics.json`),depend=await read(`${subject}_depend.json`),questions=await read(`${subject}_questions.json`),manifest=await read('manifest.json');
 const dir=new URL(`../data/runtime/${subject}/`,import.meta.url);await mkdir(dir,{recursive:true});
 const ids=[...new Set(questions.questions.map(q=>q.topicId))],questionFiles={};
 for(let offset=0;offset<ids.length;offset+=20){
  const group=new Set(ids.slice(offset,offset+20)),name=`questions-${String(offset/20).padStart(3,'0')}.json`;
  for(const id of group)questionFiles[id]=name;
  await writeFile(new URL(name,dir),JSON.stringify(questions.questions.filter(q=>group.has(q.topicId))));
 }
 const {questions:rows,...metadata}=questions;
 await writeFile(new URL('graph.json',dir),JSON.stringify({topics,depend,manifest,questions:{...metadata,questions:[]},questionFiles}));
 console.log(`${subject}: ${ids.length} topics with questions; graph ${Buffer.byteLength(JSON.stringify({topics,depend,manifest,questions:metadata,questionFiles}))} bytes`);
}
