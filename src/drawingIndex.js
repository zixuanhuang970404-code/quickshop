// Parse drawing index entries without treating every detail reference as a sheet ID.
export const normalizeRef=s=>s.toUpperCase().replace(/\s+/g,'');
export function indexEntries(text){
 const out=[];const re=/\b(S\d+(?:\.\d+)+(?:\.[A-Z0-9]+)*)\s+((?:LEVEL|ROOF|STEEL|FOUNDATION|TYPICAL|BRACE|COLUMN|STAIR)[^\n]{3,95})/gi;
 for(const m of text.matchAll(re))out.push({sheet:normalizeRef(m[1]),title:m[2].trim()});
 return [...new Map(out.map(x=>[x.sheet,x])).values()];
}
export function fabricationFields(text){
 const size=[...text.matchAll(/\b(?:W|HSS|C|MC)\s*\d+(?:X|×)\d+(?:X\d+(?:\/\d+)?)?(?:_ESS)?\b/gi)].map(m=>m[0].toUpperCase());
 const grid=[...text.matchAll(/\b[A-Z]{1,2}\s*\/\s*\d+(?:\s*[-–]\s*\d+)?\b/g)].map(m=>m[0]);
 const mark=[...text.matchAll(/\b\d{3,5}[A-Z]{0,3}\b/g)].map(m=>m[0]);
 return {sizes:[...new Set(size)],gridCandidates:[...new Set(grid)],markCandidates:[...new Set(mark)]};
}
export function findIndexReference(index,refs){return refs.map(ref=>({ref,entry:index.find(x=>x.sheet===ref)||null}));}
