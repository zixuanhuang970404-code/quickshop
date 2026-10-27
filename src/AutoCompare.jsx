import React,{useState} from 'react';
import {extractMembers,compareMembers} from './memberCompare.js';
import {compareByLevel} from './levelDetection.js';
import {findStructuralPages} from './sheetReferences.js';
import {findIndexReference} from './drawingIndex.js';
export default function AutoCompare({design,shop,onReview}){
  const [selectedLevel,setSelectedLevel]=useState('');const [manualShopPages,setManualShopPages]=useState('');const [manualDesignPages,setManualDesignPages]=useState('');const [busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[results,setResults]=useState(null),[error,setError]=useState('');
  async function run(){
    if(!design||!shop)return;
    setBusy(true);setError('');setResults(null);
    try{
      setProgress('Reading design PDF…');
      const d=await extractMembers(design,(p,n)=>setProgress('Design: page '+p+' / '+n));
      setProgress('Reading shop PDF…');
      const s=await extractMembers(shop,(p,n)=>setProgress('Shop: page '+p+' / '+n));
      const levels=[...new Set(s.pageStats.map(p=>p.level).filter(Boolean))];
      setSelectedLevel(levels.length===1?levels[0]:'');
      setResults({d,s});
    }catch(e){setError(e.message||String(e));}finally{setBusy(false);setProgress('');}
  }
  const levels=results?[...new Set([...results.s.pageStats,...results.d.pageStats].map(p=>p.level).filter(Boolean))]:[];
  const shopRefs=results?[...new Set(results.s.pageStats.filter(p=>!selectedLevel||p.level===selectedLevel).flatMap(p=>p.refs||[]))]:[];
  const referenceMatches=results?findStructuralPages(results.d.pageStats,shopRefs):[];
  const indexMatches=results?findIndexReference(results.d.drawingIndex||[],shopRefs):[];
  const fabricationPages=results?results.s.pageStats.filter(p=>p.fabrication?.sizes.length&&p.fabrication?.gridCandidates.length).slice(0,30):[];
  const parsePages=(value,max)=>[...new Set(value.split(',').flatMap(token=>{const m=token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)return [];const a=Number(m[1]),z=Number(m[2]||m[1]);return z>=a&&z-a<=200?Array.from({length:z-a+1},(_,i)=>a+i):[]}).filter(n=>n>=1&&n<=max))];
  const manualShop=results?parsePages(manualShopPages,results.s.pageStats.length):[];
  const manualDesign=results?parsePages(manualDesignPages,results.d.pageStats.length):[];
  const scoped=results&&manualShop.length&&manualDesign.length?{design:{occurrences:results.d.occurrences.filter(x=>manualDesign.includes(x.page))},shop:{occurrences:results.s.occurrences.filter(x=>manualShop.includes(x.page))}}:results&&selectedLevel?compareByLevel(results.d,results.s,selectedLevel):null;
  const rows=scoped?compareMembers(scoped.design,scoped.shop):[];
  return <section className="reviews"><div className="reviewHeading"><div><h2>Automatic member text comparison</h2><p className="muted">Extracts candidate steel section sizes from selectable PDF text. Findings are not confirmed member-to-member mismatches.</p></div><button onClick={run} disabled={!design||!shop||busy}>{busy?'Analyzing…':'Compare PDFs'}</button></div>
    {progress&&<p role="status">{progress}</p>}{error&&<p className="error" role="alert">{error}</p>}
    {!design||!shop?<p className="muted">Upload both PDFs to enable comparison.</p>:null}
    {results&&<><div className="fields"><label>Shop drawing level (detected from title)<select value={selectedLevel} onChange={e=>setSelectedLevel(e.target.value)}><option value="">Select / confirm level</option>{[...new Set([...levels,...Array.from({length:15},(_,i)=>`L${i+1}`),...Array.from({length:5},(_,i)=>`B${i+1}`),"ROOF","PODIUM"])].map(level=><option key={level}>{level}</option>)}</select></label></div><div className="fields"><label>Design PDF page(s), e.g. 12,14-16<input value={manualDesignPages} onChange={e=>setManualDesignPages(e.target.value)} placeholder="Design PDF pages" /></label><label>Shop PDF page(s), e.g. 7,20-22<input value={manualShopPages} onChange={e=>setManualShopPages(e.target.value)} placeholder="Shop PDF pages" /></label></div><p className="muted">To bypass title detection, enter pages in BOTH fields. Page-specific candidate size comparison will then run regardless of detected level. These are PDF page numbers, not drawing sheet numbers.</p><div><h3>Structural sheet references from shop drawings</h3>{referenceMatches.length?referenceMatches.map(item=><p key={item.ref}><b>{item.ref}</b> — {item.pages.length?'Possible design PDF page(s): '+item.pages.join(', '):'Not uniquely located in design PDF; verify manually'} {item.pages.map(page=><button key={page} onClick={()=>onReview({shape:'Structural sheet '+item.ref,designPages:[page],shopPages:[],finding:'Verify referenced sheet and framing location'})}>Review p.{page}</button>)}</p>):<p className="muted">No structural sheet references detected in selectable shop PDF text.</p>}<p className="muted">Sheet matching is conservative: ambiguous sheet identifiers are not automatically assigned. Confirm the correct plan and grid locations manually.</p></div><div><h3>Structural drawing index</h3><p className="muted">{results.d.drawingIndex?.length||0} candidate index entries detected on structural PDF page 1. References require confirmation.</p>{indexMatches.map(x=><p key={x.ref}>{x.ref}: {x.entry?.title||'Not found in parsed index'}</p>)}<h3>Fabrication sheet candidates (first 30)</h3><p className="muted">Grid and mark tokens are unverified text candidates, not member-to-grid assignments.</p>{fabricationPages.map(p=><p key={p.page}>Shop PDF p.{p.page}: {p.fabrication.sizes.slice(0,3).join(', ')} · grids: {p.fabrication.gridCandidates.slice(0,3).join(', ')}</p>)}</div><p className="muted">Detected shop titles: {results.s.pageStats.filter(p=>p.title).map(p=>'p.'+p.page+': '+p.title).slice(0,12).join(' | ')||'None detected'}</p>{scoped?<p><b>{rows.length}</b> unique shapes in selected scope · <b>{rows.filter(r=>r.finding!=='Found in both').length}</b> review candidates</p>:<p className="error">Choose a level or enter design and shop PDF page numbers to compare. Level-only mode excludes pages without recognized titles.</p>}
    {(results.d.pageStats.every(p=>p.characters===0)||results.s.pageStats.every(p=>p.characters===0))&&<p className="error">One PDF has no extractable text. Scanned/image-only PDFs require OCR, which is not included.</p>}
    <p className="muted">A shape appearing in only one document is not necessarily an error: documents may cover different sheets, revisions or member scopes. No member marks or locations are matched.</p>
    <div className="tableScroll"><table className="compareTable"><thead><tr><th>Section</th><th>Result</th><th>Design PDF pages</th><th>Shop PDF pages</th><th>Action</th></tr></thead><tbody>{rows.map(row=><tr key={row.shape}><td><b>{row.shape}</b></td><td>{row.finding}</td><td>{row.designPages.join(', ')||'—'}</td><td>{row.shopPages.join(', ')||'—'}</td><td><button onClick={()=>onReview(row)}>Review pages</button></td></tr>)}</tbody></table></div>
    {scoped&&!rows.length&&<p className="muted">No supported steel shapes detected on the selected level. Check whether PDFs contain selectable text.</p>}</>}
  </section>;
}
