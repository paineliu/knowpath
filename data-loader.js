// Bound the complete request, including downloading and parsing its body.
export async function fetchJSON(url,{timeout=20000,fetcher=fetch}={}){
 const controller=new AbortController();
 let timer;
 try{
  return await Promise.race([
   (async()=>{const response=await fetcher(url,{signal:controller.signal});if(!response.ok)throw new Error(`数据请求失败（${response.status}）`);return response.json()})(),
   new Promise((_,reject)=>{timer=setTimeout(()=>{reject(new Error('网络较慢，数据加载超时'));controller.abort()},timeout)})
  ]);
 }finally{clearTimeout(timer)}
}
