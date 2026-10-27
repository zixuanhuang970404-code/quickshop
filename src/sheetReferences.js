// Extract explicit structural sheet references printed in shop drawing titles/notes.
const SHEET=/\bS\s*\d+(?:\.\d+)*(?:\.[A-Z0-9]+)*\b/gi;
export function normalizeSheet(s){return s.toUpperCase().replace(/\s+/g,'');}
export function structuralRefs(text){
 const lines=text.split(/\n/);
 const relevant=lines.filter(line=>/STRUCTURAL\s+DRAWING\s+REFERENCE|STRUCTURAL\s+SHEET|REFER\s+TO\s+S\d/i.test(line));
 const refs=relevant.flatMap(line=>[...line.matchAll(SHEET)].map(m=>normalizeSheet(m[0])));
 // PDF.js may split the heading and sheet identifiers into adjacent text items.
 const compact=text.replace(/\s+/g,' ');
 for(const match of compact.matchAll(/STRUCTURAL\s+DRAWING\s+REFERENCE\s*[-:]?\s*([^\n]{0,160})/gi)){
   for(const hit of match[1].matchAll(SHEET))refs.push(normalizeSheet(hit[0]));
 }
 return [...new Set(refs)];
}
export function findStructuralPages(designStats,refs){
 return refs.map(ref=>({ref,pages:designStats.filter(p=>p.sheetId===ref).map(p=>p.page)}));
}
export function extractSheetId(text){
 const hits=[...text.matchAll(SHEET)].map(m=>normalizeSheet(m[0]));
 // Only accept a unique identifier on a page; ambiguous matches require manual verification.
 const unique=[...new Set(hits)];
 return unique.length===1?unique[0]:null;
}
