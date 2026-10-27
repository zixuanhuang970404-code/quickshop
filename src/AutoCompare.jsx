import React,{useState} from 'react';
import {extractMembers,compareMembers} from './memberCompare.js';
import {compareByLevel} from './levelDetection.js';
export default function AutoCompare({design,shop,onReview}){
  const [selectedLevel,setSelectedLevel]=useState('');const [busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[results,setResults]=useState(null),[error,setError]=useState('');
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
  const levels=results?[...new Set(results.s.pageStats.map(p=>p.level).filter(Boolean))]:[];
  const scoped=results&&selectedLevel?compareByLevel(results.d,results.s,selectedLevel):null;
  const rows=scoped?compareMembers(scoped.design,scoped.shop):[];
  return <section className="reviews"><div className="reviewHeading"><div><h2>Automatic member text comparison</h2><p className="muted">Extracts candidate steel section sizes from selectable PDF text. Findings are not confirmed member-to-member mismatches.</p></div><button onClick={run} disabled={!design||!shop||busy}>{busy?'Analyzing…':'Compare PDFs'}</button></div>
    {progress&&<p role="status">{progress}</p>}{error&&<p className="error" role="alert">{error}</p>}
    {!design||!shop?<p className="muted">Upload both PDFs to enable comparison.</p>:null}
    {results&&<><div className="fields"><label>Shop drawing level (detected from title)<select value={selectedLevel} onChange={e=>setSelectedLevel(e.target.value)}><option value="">Select / confirm level</option>{levels.map(level=><option key={level}>{level}</option>)}</select></label></div><p className="muted">Detected shop titles: {results.s.pageStats.filter(p=>p.title).map(p=>'p.'+p.page+': '+p.title).slice(0,12).join(' | ')||'None detected'}</p>{selectedLevel?<p><b>{rows.length}</b> unique shapes on {selectedLevel} · <b>{rows.filter(r=>r.finding!=='Found in both').length}</b> review candidates</p>:<p className="error">Confirm a level to compare. Pages without recognized titles are excluded.</p>}
    {(results.d.pageStats.every(p=>p.characters===0)||results.s.pageStats.every(p=>p.characters===0))&&<p className="error">One PDF has no extractable text. Scanned/image-only PDFs require OCR, which is not included.</p>}
    <p className="muted">A shape appearing in only one document is not necessarily an error: documents may cover different sheets, revisions or member scopes. No member marks or locations are matched.</p>
    <div className="tableScroll"><table className="compareTable"><thead><tr><th>Section</th><th>Result</th><th>Design PDF pages</th><th>Shop PDF pages</th><th>Action</th></tr></thead><tbody>{rows.map(row=><tr key={row.shape}><td><b>{row.shape}</b></td><td>{row.finding}</td><td>{row.designPages.join(', ')||'—'}</td><td>{row.shopPages.join(', ')||'—'}</td><td><button onClick={()=>onReview(row)}>Review pages</button></td></tr>)}</tbody></table></div>
    {selectedLevel&&!rows.length&&<p className="muted">No supported steel shapes detected on the selected level. Check whether PDFs contain selectable text.</p>}</>}
  </section>;
}
