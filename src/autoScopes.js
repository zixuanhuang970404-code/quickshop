// Automatic level-scoped page pairing; never mix floors or silently assign unknown pages.
const norm=s=>s.toUpperCase().replace(/\s+/g,'');
export function autoScopes(design,shop){
 const groups=new Map();
 for(const p of shop.pages){
  if(!p.level)continue;
  const key=p.level;
  if(!groups.has(key))groups.set(key,{level:key,shopPages:[],designPages:[],refs:new Set(),warnings:[]});
  const g=groups.get(key);g.shopPages.push(p.page);for(const ref of p.structuralRefs)g.refs.add(norm(ref));
 }
 return [...groups.values()].map(g=>{
  const refPages=design.pages.filter(p=>p.refs.some(ref=>g.refs.has(norm(ref))));
  const levelPages=design.pages.filter(p=>p.level===g.level);
  const candidates=g.refs.size?refPages:levelPages;
  // Reference matches may be incidental mentions in notes: require level agreement.
  g.designPages=candidates.filter(p=>p.level===g.level).map(p=>p.page);
  if(!g.designPages.length)g.warnings.push('No reliable structural sheet match. Comparison withheld.');
  if(!g.shopPages.length)g.warnings.push('No shop erection plan found.');
  if(g.refs.size&&!refPages.length)g.warnings.push('Referenced structural sheets not located in scanned pages.');
  return {...g,refs:[...g.refs],ready:g.shopPages.length>0&&g.designPages.length>0};
 });
}
