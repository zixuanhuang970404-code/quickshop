// Conservative title-based detection. Never infer a level from arbitrary drawing notes.
const ORDINAL={FIRST:1,SECOND:2,THIRD:3,FOURTH:4,FIFTH:5,SIXTH:6,SEVENTH:7,EIGHTH:8,NINTH:9,TENTH:10};
export function detectLevel(title){
 const t=title.toUpperCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();
 if(!/(FRAMING|ERECTION|STEEL|FLOOR|LEVEL|ROOF|BASEMENT|PODIUM)/.test(t))return null;
 if(/\bROOF\b/.test(t))return 'ROOF';
 const basement=t.match(/\b(?:BASEMENT|B)\s*(\d{1,2})\b/);if(basement)return 'B'+Number(basement[1]);
 const floor=t.match(/\b(?:LEVEL|LVL|FLOOR|L)\s*(\d{1,2})\b/);if(floor)return 'L'+Number(floor[1]);
 const ord=t.match(/\b(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s+FLOOR\b/);if(ord)return 'L'+ORDINAL[ord[1]];
 return null;
}
export function titleCandidate(text){
 const lines=text.split(/\n/).map(x=>x.trim()).filter(Boolean);
 return lines.filter(line=>/(FRAMING|ERECTION)\s+PLAN|(?:LEVEL|FLOOR|ROOF|BASEMENT).{0,35}(?:STEEL|FRAMING|ERECTION)/i.test(line)).sort((a,b)=>a.length-b.length)[0]||'';
}
export function compareByLevel(design,shop,level){
 const d={...design,occurrences:design.occurrences.filter(x=>design.pageLevels?.[x.page]===level)};
 const s={...shop,occurrences:shop.occurrences.filter(x=>shop.pageLevels?.[x.page]===level)};
 return {design:d,shop:s};
}
