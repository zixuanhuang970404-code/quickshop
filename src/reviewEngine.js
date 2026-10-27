import {pdfjs} from 'react-pdf';
const SHAPE=/\b(?:W|S|M|HP|C|MC)\s*\d{1,2}(?:\.\d+)?\s*[X×]\s*\d{1,3}(?:\.\d+)?(?:_ESS)?\b|\bHSS\s*\d+(?:\.\d+)?\s*[X×]\s*\d+(?:\.\d+)?(?:\s*[X×]\s*(?:\d+\/\d+|\d+(?:\.\d+)?))?\b/gi;
const SHEET=/\bS\s*\d+(?:\.\d+)+(?:\.[A-Z0-9]+)*\b/gi;
const GRID=/\b[A-Z]{1,2}\s*\/\s*\d{1,2}(?:\s*[-–]\s*\d{1,2})?\b/g;
export const norm=s=>s.toUpperCase().replace(/\s+/g,'').replace(/×/g,'X');
export function levelFromTitle(t){
 const s=t.toUpperCase().replace(/[_-]/g,' ');
 if(/\bROOF\b/.test(s))return 'ROOF';
 const m=s.match(/\b(?:LEVEL|LVL|FLOOR|L)\s*0?(\d{1,2})\b/);if(m)return 'L'+Number(m[1]);
 const b=s.match(/\b(?:BASEMENT|B)\s*(\d{1,2})\b/);if(b)return 'B'+Number(b[1]);
 return null;
}
export function parsePageText(items){
 const lines=items.filter(x=>typeof x.str==='string').map(x=>x.str.trim()).filter(Boolean);
 const text=lines.join(' '), joined=lines.join('\n');
 const title=(joined.match(/[^\n]{0,90}(?:FRAMING|ERECTION)\s+PLAN[^\n]{0,90}/i)||[])[0]||'';
 const refs=[...new Set([...text.matchAll(SHEET)].map(m=>norm(m[0])))];
 const shapes=[...new Set([...text.matchAll(SHAPE)].map(m=>norm(m[0])))];
 const grids=[...new Set([...text.matchAll(GRID)].map(m=>norm(m[0])))];
 const heading=text.match(/STRUCTURAL\s+DRAWING\s+REFERENCE\s*[-:]?\s*([^\n]{0,130})/i);
 const structuralRefs=heading?[...new Set([...heading[1].matchAll(SHEET)].map(m=>norm(m[0])))]:[];
 return {title,level:levelFromTitle(title),refs,structuralRefs,shapes,grids,characters:text.length,sample:lines.slice(0,16).join(' | ').slice(0,500)};
}
export async function scanPdf(file,{limit=80,onProgress=()=>{},signal}={}){
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
 const doc=await task.promise;const pages=[];
 try{
  const n=Math.min(doc.numPages,limit);
  for(let p=1;p<=n;p++){
   if(signal?.aborted)throw new Error('Analysis cancelled');
   const page=await doc.getPage(p),content=await page.getTextContent();
   pages.push({page:p,...parsePageText(content.items)});
   page.cleanup();onProgress(p,n,doc.numPages);
   if(p%4===0)await new Promise(resolve=>setTimeout(resolve,0));
  }
  return {pages,total:doc.numPages,scanned:n,truncated:n<doc.numPages};
 }finally{await doc.destroy();}
}
export function comparePages(design,shop,designPages,shopPages){
 const gather=(doc,pages)=>new Set(doc.pages.filter(x=>pages.includes(x.page)).flatMap(x=>x.shapes));
 const d=gather(design,designPages),s=gather(shop,shopPages);
 return [...new Set([...d,...s])].sort().map(shape=>({shape,status:d.has(shape)&&s.has(shape)?'In both selections':d.has(shape)?'Design only':'Shop only'}));
}
export function parsePageRanges(s,max){
 const result=new Set();
 for(const token of s.split(',')){
  const m=token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)continue;
  const a=Number(m[1]),z=Number(m[2]||m[1]);
  if(a<1||z<a||z-a>300)continue;
  for(let i=a;i<=Math.min(z,max);i++)result.add(i);
 }
 return [...result].sort((a,b)=>a-b);
}
