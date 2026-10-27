import {pdfjs} from 'react-pdf';
import {detectLevel,titleCandidate} from './levelDetection.js';

/** Candidate steel shapes found in selectable PDF text; not OCR or verified member assignments. */
export const SHAPE_RE = /\b(?:W|S|M|HP)\s*\d{1,2}(?:\.\d+)?\s*[X×]\s*\d{1,3}(?:\.\d+)?\b|\bHSS\s*\d+(?:\.\d+)?\s*[X×]\s*\d+(?:\.\d+)?(?:\s*[X×]\s*(?:\d+\/\d+|\d+(?:\.\d+)?))?\b|\b(?:C|MC)\s*\d+(?:\.\d+)?\s*[X×]\s*\d+(?:\.\d+)?\b/gi;
export function normalizeShape(value){return value.toUpperCase().replace(/\s+/g,'').replace(/×/g,'X');}
export async function extractMembers(file,onProgress=()=>{}){
  const data=new Uint8Array(await file.arrayBuffer());
  const task=pdfjs.getDocument({data});
  const doc=await task.promise;
  const occurrences=[];
  const pageStats=[];
  const pageLevels={};
  try{
    for(let pageNum=1;pageNum<=doc.numPages;pageNum++){
      const page=await doc.getPage(pageNum);
      const content=await page.getTextContent();
      const items=content.items.filter(i=>typeof i.str==='string');
      // PDF text is sometimes split across adjacent spans. Join neighboring spans.
      const text=items.map(i=>i.str).join(' ');
      const candidate=titleCandidate(items.map(i=>i.str).join('\n'));
      pageLevels[pageNum]=detectLevel(candidate);
      const matches=[...text.matchAll(SHAPE_RE)];
      for(const match of matches) occurrences.push({shape:normalizeShape(match[0]),page:pageNum});
      pageStats.push({page:pageNum,characters:text.trim().length,matches:matches.length,title:candidate,level:pageLevels[pageNum]});
      onProgress(pageNum,doc.numPages);
      page.cleanup();
    }
  }finally{await doc.destroy();}
  return {occurrences,pageStats,pageLevels};
}
export function compareMembers(design,shop){
  const group=arr=>{const map=new Map();for(const item of arr){if(!map.has(item.shape))map.set(item.shape,new Set());map.get(item.shape).add(item.page);}return map;};
  const d=group(design.occurrences),s=group(shop.occurrences);
  return [...new Set([...d.keys(),...s.keys()])].sort().map(shape=>({
    shape,designPages:[...(d.get(shape)||[])],shopPages:[...(s.get(shape)||[])],
    finding:d.has(shape)&&s.has(shape)?'Found in both':d.has(shape)?'Design only':'Shop only'
  }));
}
