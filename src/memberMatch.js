// Conservative matching: only compare members sharing an explicit unique mark on paired level pages.
// Repeated marks or ambiguous sizes are held for manual review, never declared a mismatch.
const SIZE=/\b(?:W|S|M|HP|C|MC)\s*\d{1,2}(?:\.\d+)?\s*[X×]\s*\d{1,3}(?:\.\d+)?\b/gi;
const MARK=/\b(?:B|BM|BEAM|G|GR|GIRDER)[-_ ]?\d{1,4}[A-Z]?\b/gi;
const normalize=s=>s.toUpperCase().replace(/\s+/g,'').replace(/×/g,'X');
export function extractMarkedMembers(text){
 const lines=text.split(/\n/),result=[];
 for(const line of lines){
  const marks=[...line.matchAll(MARK)].map(x=>normalize(x[0]));
  const sizes=[...line.matchAll(SIZE)].map(x=>normalize(x[0]));
  if(marks.length===1&&sizes.length===1)result.push({mark:marks[0],size:sizes[0]});
 }
 return result;
}
export function compareMarkedMembers(designPages,shopPages){
 const collect=pages=>{
  const groups=new Map();
  for(const p of pages)for(const m of p.markedMembers||[]){
   const key=(p.level||'UNKNOWN')+'|'+m.mark;
   groups.set(key,[...(groups.get(key)||[]),{...m,page:p.page,level:p.level}]);
  }
  return groups;
 };
 const d=collect(designPages),s=collect(shopPages),mismatches=[],unresolved=[];
 for(const [key,ds] of d){
  const ss=s.get(key);
  if(!ss)continue;
  if(ds.length!==1||ss.length!==1){unresolved.push({key,reason:'Duplicate or ambiguous member mark'});continue;}
  if(key.startsWith('UNKNOWN|')){unresolved.push({key,reason:'Level not established'});continue;}
  if(ds[0].size!==ss[0].size)mismatches.push({key,mark:ds[0].mark,level:ds[0].level,designSize:ds[0].size,shopSize:ss[0].size,designPage:ds[0].page,shopPage:ss[0].page});
 }
 return {mismatches,unresolved};
}
