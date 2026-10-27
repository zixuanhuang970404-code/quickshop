import {compareMarkedMembers} from './memberMatch.js';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Document,Page,pdfjs} from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {scanPdf,comparePages} from './reviewEngine.js';
import {autoScopes} from './autoScopes.js';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './style.css';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
function Viewer({label,file,setFile,page,setPage}){
 const [count,setCount]=useState(0),[error,setError]=useState('');
 useEffect(()=>{setCount(0);setError('');setPage(1)},[file]);
 return <section className="panel"><header><b>{label}</b><label className="upload">Choose PDF<input type="file" accept=".pdf,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></header><p className="filename">{file?.name||'No PDF uploaded'}</p><nav className="toolbar"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>PDF page {page} / {count||'—'}</span><button disabled={!count||page>=count} onClick={()=>setPage(p=>p+1)}>Next</button><input aria-label={label+' page'} type="number" min="1" max={count||1} value={page} onChange={e=>setPage(Math.max(1,Math.min(count||1,Number(e.target.value)||1)))}/></nav><div className="paper">{file?<Document file={file} onLoadSuccess={x=>setCount(x.numPages)} onLoadError={e=>setError(e.message)} loading="Loading PDF…"><Page pageNumber={Math.min(page,count||1)} width={560}/></Document>:<p>Upload a PDF to begin.</p>}</div>{error&&<p className="error">{error}</p>}</section>;
}
function App(){
 const [design,setDesign]=useState(null),[shop,setShop]=useState(null),[dp,setDp]=useState(1),[sp,setSp]=useState(1);
 const [analysis,setAnalysis]=useState(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState('');
 const [category,setCategory]=useState('Member size'),[note,setNote]=useState('');
 const [comments,setComments]=useState(()=>{try{return JSON.parse(localStorage.getItem('steel-review-v3-comments')||'[]')}catch{return []}});
 useEffect(()=>{localStorage.setItem('steel-review-v3-comments',JSON.stringify(comments))},[comments]);
 useEffect(()=>{setAnalysis(null)},[design,shop]);
 async function analyze(){if(!design||!shop)return;setBusy(true);setError('');setAnalysis(null);
 try{const d=await scanPdf(design,{limit:120,onProgress:(p,n,total)=>setProgress('Structural PDF '+p+'/'+n+' of '+total+' total pages')});const s=await scanPdf(shop,{limit:120,onProgress:(p,n,total)=>setProgress('Shop PDF '+p+'/'+n+' of '+total+' total pages')});setAnalysis({d,s});}
 catch(e){setError(e.message||String(e))}finally{setBusy(false);setProgress('')}}
 const scopes=analysis?autoScopes(analysis.d,analysis.s):[];
 const readyScopes=scopes.filter(scope=>scope.ready);
 const comparisons=readyScopes.map(scope=>({...scope,rows:comparePages(analysis.d,analysis.s,scope.designPages,scope.shopPages)}));
 const memberResults=analysis?compareMarkedMembers(analysis.d.pages.filter(p=>readyScopes.some(s=>s.ready&&s.designPages.includes(p.page))),analysis.s.pages.filter(p=>readyScopes.some(s=>s.ready&&s.shopPages.includes(p.page)))):{mismatches:[],unresolved:[]};
 const refs=analysis?[...new Set(analysis.s.pages.flatMap(p=>p.structuralRefs))]:[];
 function addComment(e){e.preventDefault();if(!note.trim())return;setComments(v=>[{id:crypto.randomUUID(),text:note.trim(),category,status:'Open',level:comparisons.find(scope=>scope.shopPages.includes(sp))?.level||'Unassigned',designPage:dp,shopPage:sp,date:new Date().toISOString()},...v]);setNote('')}
 function exportCsv(){const cells=[['Level','Category','Status','Design PDF page','Shop PDF page','Comment','Date'],...comments.map(c=>[c.level,c.category,c.status,c.designPage,c.shopPage,c.text,c.date])];const csv=cells.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='steel-review-comments.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <main><div className="top"><div><h1>Steel Framing Size Review</h1><p>Review potential framing member-size discrepancies</p></div><span className="tag">Rebuilt MVP · Engineer verification required</span></div>
 <div className="workspace"><Viewer label="Structural drawings" file={design} setFile={setDesign} page={dp} setPage={setDp}/><Viewer label="Steel shop drawings" file={shop} setFile={setShop} page={sp} setPage={setSp}/></div>
 <section className="reviews"><div className="reviewHeading"><div><h2>Automatic framing size review</h2><p className="muted">Scans up to 120 pages per PDF; uses detected levels and sheet references internally. No manual floor or page inputs.</p></div><button onClick={analyze} disabled={!design||!shop||busy}>{busy?'Scanning…':'Analyze PDFs'}</button></div>
 {progress&&<p role="status">{progress}</p>}{error&&<p className="error" role="alert">{error}</p>}
 {analysis&&<><p className="muted">Scanned structural {analysis.d.scanned}/{analysis.d.total} pages; shop {analysis.s.scanned}/{analysis.s.total} pages. {analysis.d.truncated||analysis.s.truncated?'Additional pages were not scanned. Use a smaller PDF containing the relevant erection plan or increase the scan range in a future release.':''}</p>
 <h3>Framing size mismatch review</h3>{memberResults.mismatches.length>0&&<table><thead><tr><th>Level</th><th>Mark</th><th>Design size</th><th>Shop size</th><th>PDF pages</th></tr></thead><tbody>{memberResults.mismatches.map(m=><tr key={m.key}><td>{m.level}</td><td>{m.mark}</td><td>{m.designSize}</td><td>{m.shopSize}</td><td>Design {m.designPage} / Shop {m.shopPage}</td></tr>)}</tbody></table>}<p className="muted">{memberResults.mismatches.length} candidate mismatches from unique same-level member marks; {memberResults.unresolved.length} ambiguous matches require manual review. Member marks alone do not prove physical location.</p><p className="muted">The app uses drawing levels and references internally to narrow the search. It does not report a size mismatch unless the same physical member can be identified in both drawings.</p>
 {readyScopes.length?<><p><b>{memberResults.mismatches.length} marked-member size mismatch candidates.</b> The current extraction does not establish member-to-member correspondence, so it cannot yet certify mismatches.</p><p className="muted">{comparisons.reduce((n,s)=>n+s.rows.filter(x=>x.status!=='In both selections').length,0)} one-sided section-size occurrences were found across automatically paired levels. These are not reported as mismatches because different members can legitimately have different sizes.</p></>:<p className="error">No reliably paired erection-plan sheets found in scanned pages. No framing size comparison can be confirmed.</p>}
 <p className="muted">Member-to-member size mismatch detection requires matching framing positions or unique member marks first. The current MVP cannot perform that geometry matching. Unscanned pages and image-only titles may also prevent detection.</p>
 </>}</section>
 <section className="reviews"><div className="reviewHeading"><h2>Review comments ({comments.length})</h2><button disabled={!comments.length} onClick={exportCsv}>Export CSV</button></div><form onSubmit={addComment}><div className="fields"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{['Member size','Grid / location','Missing framing','Connection','Weld','Bolt / anchor','Other'].map(x=><option key={x}>{x}</option>)}</select></label></div><label>Review comment<textarea required value={note} onChange={e=>setNote(e.target.value)} placeholder="VERIFY BEAM SIZE AND LOCATION AT GRID B/3–B/4 PER STRUCTURAL FRAMING PLAN."/></label><div className="formFoot"><small>Structural PDF p.{dp} / Shop PDF p.{sp}</small><button type="submit">Add comment</button></div></form>{comments.map(c=><article key={c.id}><b>{c.category} · {c.level} · {c.status}</b><p>{c.text}</p><small>Structural p.{c.designPage} / Shop p.{c.shopPage}</small><div className="actions"><button onClick={()=>{setDp(c.designPage);setSp(c.shopPage);window.scrollTo({top:0,behavior:'smooth'})}}>Go to pages</button><button onClick={()=>setComments(v=>v.map(x=>x.id===c.id?{...x,status:x.status==='Open'?'Resolved':'Open'}:x))}>Toggle status</button><button onClick={()=>setComments(v=>v.filter(x=>x.id!==c.id))}>Delete</button></div></article>)}</section><footer>PDFs stay in your browser. Comments are saved only in localStorage. This tool does not approve structural shop drawings.</footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
