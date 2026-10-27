import React,{useState} from 'react';
import {extractMembers,compareMembers} from './memberCompare.js';
export default function AutoCompare({design,shop,onReview}){
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[results,setResults]=useState(null),[error,setError]=useState('');
  async function run(){
    if(!design||!shop)return;
    setBusy(true);setError('');setResults(null);
    try{
      setProgress('Reading design PDF…');
      const d=await extractMembers(design,(p,n)=>setProgress('Design: page '+p+' / '+n));
      setProgress('Reading shop PDF…');
      const s=await extractMembers(shop,(p,n)=>setProgress('Shop: page '+p+' / '+n));
      setResults({rows:compareMembers(d,s),d,s});
    }catch(e){setError(e.message||String(e));}finally{setBusy(false);setProgress('');}
  }
  return <section className="reviews"><div className="reviewHeading"><div><h2>Automatic member text comparison</h2><p className="muted">Extracts candidate steel section sizes from selectable PDF text. Findings are not confirmed member-to-member mismatches.</p></div><button onClick={run} disabled={!design||!shop||busy}>{busy?'Analyzing…':'Compare PDFs'}</button></div>
    {progress&&<p role="status">{progress}</p>}{error&&<p className="error" role="alert">{error}</p>}
    {!design||!shop?<p className="muted">Upload both PDFs to enable comparison.</p>:null}
    {results&&<><p><b>{results.rows.length}</b> unique steel shapes detected · <b>{results.rows.filter(r=>r.finding!=='Found in both').length}</b> candidates requiring review</p>
    {(results.d.pageStats.every(p=>p.characters===0)||results.s.pageStats.every(p=>p.characters===0))&&<p className="error">One PDF has no extractable text. Scanned/image-only PDFs require OCR, which is not included.</p>}
    <p className="muted">A shape appearing in only one document is not necessarily an error: documents may cover different sheets, revisions or member scopes. No member marks or locations are matched.</p>
    <div className="tableScroll"><table className="compareTable"><thead><tr><th>Section</th><th>Result</th><th>Design PDF pages</th><th>Shop PDF pages</th><th>Action</th></tr></thead><tbody>{results.rows.map(row=><tr key={row.shape}><td><b>{row.shape}</b></td><td>{row.finding}</td><td>{row.designPages.join(', ')||'—'}</td><td>{row.shopPages.join(', ')||'—'}</td><td><button onClick={()=>onReview(row)}>Review pages</button></td></tr>)}</tbody></table></div>
    {!results.rows.length&&<p className="muted">No supported steel shapes detected. Check whether PDFs contain selectable text.</p>}</>}
  </section>;
}
