import React,{useEffect,useMemo,useState} from 'react';
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
const defaults=['L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','ROOF','B1','B2','B3','PODIUM'];
function App(){
 const [design,setDesign]=useState(null),[shop,setShop]=useState(null),[dp,setDp]=useState(1),[sp,setSp]=useState(1);
 const [analysis,setAnalysis]=useState(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState('');
 const [level,setLevel]=useState(''),[designPages,setDesignPages]=useState(''),[shopPages,setShopPages]=useState(''),[category,setCategory]=useState('Member size'),[note,setNote]=useState('');
 const [comments,setComments]=useState(()=>{try{return JSON.parse(localStorage.getItem('steel-review-v3-comments')||'[]')}catch{return []}});
 useEffect(()=>{localStorage.setItem('steel-review-v3-comments',JSON.stringify(comments))},[comments]);
 useEffect(()=>{setAnalysis(null);setDesignPages('');setShopPages('');setLevel('')},[design,shop]);
 async function analyze(){if(!design||!shop)return;setBusy(true);setError('');setAnalysis(null);
 try{const d=await scanPdf(design,{limit:120,onProgress:(p,n,total)=>setProgress('Structural PDF '+p+'/'+n+' of '+total+' total pages')});const s=await scanPdf(shop,{limit:120,onProgress:(p,n,total)=>setProgress('Shop PDF '+p+'/'+n+' of '+total+' total pages')});setAnalysis({d,s});const found=[...new Set(s.pages.map(x=>x.level).filter(Boolean))];if(found.length)setLevel(found[0]);}
 catch(e){setError(e.message||String(e))}finally{setBusy(false);setProgress('')}}
 const scopes=analysis?autoScopes(analysis.d,analysis.s):[];
 const activeScope=scopes.find(x=>x.level===level);
 const detectedLevels=analysis?[...new Set([...defaults,...analysis.s.pages.map(x=>x.level).filter(Boolean)])]:defaults;
 const shopMatches=analysis?analysis.s.pages.filter(p=>p.level===level):[];
 const designMatches=analysis?analysis.d.pages.filter(p=>p.level===level):[];
 const dPages=activeScope?.designPages||[];
 const sPages=activeScope?.shopPages||[];
 const rows=analysis&&dPages.length&&sPages.length?comparePages(analysis.d,analysis.s,dPages,sPages):[];
 const refs=analysis?[...new Set(analysis.s.pages.filter(p=>!level||p.level===level).flatMap(p=>p.structuralRefs))]:[];
 function addComment(e){e.preventDefault();if(!note.trim())return;setComments(v=>[{id:crypto.randomUUID(),text:note.trim(),category,status:'Open',level:level||'Unassigned',designPage:dp,shopPage:sp,date:new Date().toISOString()},...v]);setNote('')}
 function exportCsv(){const cells=[['Level','Category','Status','Design PDF page','Shop PDF page','Comment','Date'],...comments.map(c=>[c.level,c.category,c.status,c.designPage,c.shopPage,c.text,c.date])];const csv=cells.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='steel-review-comments.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <main><div className="top"><div><h1>Steel Shop Drawing Review</h1><p>Level- and sheet-scoped engineering review workspace</p></div><span className="tag">Rebuilt MVP · Engineer verification required</span></div>
 <div className="workspace"><Viewer label="Structural drawings" file={design} setFile={setDesign} page={dp} setPage={setDp}/><Viewer label="Steel shop drawings" file={shop} setFile={setShop} page={sp} setPage={setSp}/></div>
 <section className="reviews"><div className="reviewHeading"><div><h2>1. Detect drawings and select scope</h2><p className="muted">Scans up to 120 pages per PDF and automatically groups recognized shop erection plans by level. Unknown pages are not assigned.</p></div><button onClick={analyze} disabled={!design||!shop||busy}>{busy?'Scanning…':'Analyze PDFs'}</button></div>
 {progress&&<p role="status">{progress}</p>}{error&&<p className="error" role="alert">{error}</p>}
 {analysis&&<><p className="muted">Scanned structural {analysis.d.scanned}/{analysis.d.total} pages; shop {analysis.s.scanned}/{analysis.s.total} pages. {analysis.d.truncated||analysis.s.truncated?'Additional pages were not scanned. Use a smaller PDF containing the relevant erection plan or increase the scan range in a future release.':''}</p>
 <h3>Automatically detected levels</h3><p className="muted">The app groups erection plans by their detected floor title and searches the structural PDF for matching floor sheets and referenced sheet IDs. No page input is needed. Unmatched pages are withheld, not compared to another level.</p>
 {scopes.length?<div className="actions">{scopes.map(scope=><button key={scope.level} onClick={()=>setLevel(scope.level)} style={{background:level===scope.level?'#dbeafe':'white'}}>{scope.level} · {scope.ready?'Candidate pairing':'Needs review'}</button>)}</div>:<p className="error">No reliable shop erection plan level found in the scanned pages. Automatic comparison cannot proceed; try a text-based erection plan PDF.</p>}
 {activeScope&&<p>Selected: <b>{activeScope.level}</b> · Structural PDF pages: {dPages.join(', ')||'not found'} · Shop PDF pages: {sPages.join(', ')} · Structural references: {activeScope.refs.join(', ')||'none'} {activeScope.warnings.map((w,i)=><span key={i} className="error">{w} </span>)}</p>}
 <h3>Shop erection plan titles and structural references</h3>{analysis.s.pages.filter(p=>p.title||p.structuralRefs.length).slice(0,30).map(p=><article key={p.page}><b>Shop PDF p.{p.page}</b> · {p.title||'Title not recognized'} · References: {p.structuralRefs.join(', ')||'none'} <button onClick={()=>{setSp(p.page);if(p.level)setLevel(p.level)}}>Use shop page</button></article>)}
 {!analysis.s.pages.some(p=>p.title||p.structuralRefs.length)&&<p className="muted">No titles recognized. You can still enter pages manually.</p>}
 {refs.length>0&&<p>Referenced structural sheets: <b>{refs.join(', ')}</b> (verify the corresponding PDF pages manually)</p>}
 <h3>2. Automatic level-scoped candidate comparison</h3><p className="muted">Comparison is restricted to automatically paired sheets at the selected level. This checks section occurrences, not member placement at gridlines.</p>
 {dPages.length&&sPages.length?<><p>{rows.length} distinct shapes in selected pages; {rows.filter(x=>x.status!=='In both selections').length} one-sided candidates.</p><div className="tableScroll"><table className="compareTable"><thead><tr><th>Shape</th><th>Candidate result</th><th>Review</th></tr></thead><tbody>{rows.map(x=><tr key={x.shape}><td>{x.shape}</td><td>{x.status}</td><td><button onClick={()=>{setDp(dPages[0]);setSp(sPages[0]);setCategory('Member size');setNote('VERIFY '+x.shape+' AT THE CORRECT LEVEL AND GRID LOCATION. '+x.status.toUpperCase()+'.')}}>Draft comment</button></td></tr>)}</tbody></table></div></>:<p className="muted">No trustworthy same-level page pairing found. Comparison withheld.</p>}
 <h3>3. Grid and fabrication text candidates</h3>{analysis.s.pages.filter(p=>sPages.includes(p.page)&&p.grids.length).slice(0,20).map(p=><p key={p.page}>Shop p.{p.page}: grid text {p.grids.slice(0,10).join(', ')}; sizes {p.shapes.slice(0,10).join(', ')}</p>)}<p className="muted">Grid strings and sizes are extracted independently. The app cannot yet establish that a particular beam spans those grids. No automatic compliance determination is made.</p>
 </>}</section>
 <section className="reviews"><div className="reviewHeading"><h2>Review comments ({comments.length})</h2><button disabled={!comments.length} onClick={exportCsv}>Export CSV</button></div><form onSubmit={addComment}><div className="fields"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{['Member size','Grid / location','Missing framing','Connection','Weld','Bolt / anchor','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Level<input value={level} onChange={e=>setLevel(e.target.value)} placeholder="e.g. L3"/></label></div><label>Review comment<textarea required value={note} onChange={e=>setNote(e.target.value)} placeholder="VERIFY BEAM SIZE AND LOCATION AT GRID B/3–B/4 PER STRUCTURAL FRAMING PLAN."/></label><div className="formFoot"><small>Structural PDF p.{dp} / Shop PDF p.{sp}</small><button type="submit">Add comment</button></div></form>{comments.map(c=><article key={c.id}><b>{c.category} · {c.level} · {c.status}</b><p>{c.text}</p><small>Structural p.{c.designPage} / Shop p.{c.shopPage}</small><div className="actions"><button onClick={()=>{setDp(c.designPage);setSp(c.shopPage);window.scrollTo({top:0,behavior:'smooth'})}}>Go to pages</button><button onClick={()=>setComments(v=>v.map(x=>x.id===c.id?{...x,status:x.status==='Open'?'Resolved':'Open'}:x))}>Toggle status</button><button onClick={()=>setComments(v=>v.filter(x=>x.id!==c.id))}>Delete</button></div></article>)}</section><footer>PDFs stay in your browser. Comments are saved only in localStorage. This tool does not approve structural shop drawings.</footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
