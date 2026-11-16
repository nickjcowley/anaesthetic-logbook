"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=dt=>dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());
const today=()=>iso(new Date());
const shiftYears=(d,n)=>(+d.slice(0,4)+n)+d.slice(4);
const mins=t=>t?(+t.slice(0,2))*60+(+t.slice(3,5)):null;
const addMin=(t,m)=>{const x=((mins(t)+m)%1440+1440)%1440;return pad(Math.floor(x/60))+':'+pad(x%60)};
const normOp=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const uk=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'';
const caseMins=c=>{const a=mins(c.s),b=mins(c.e); if(a==null||b==null) return null; let d=b-a; if(d<0&&a>=17*60&&b<=10*60) d+=1440; return d>0&&d<=16*60?d:null};
const exactTime=c=>!!(c.h&&(c.h.tAn||c.h.tAnRoom)&&(c.h.tRec||c.h.tEnd));
const isGA=c=>/^GA/i.test(c.a1||'');
const maint=c=>c.mt||(isGA(c)&&(c.procs||[]).some(p=>/^(tci|tiva)$/i.test(p[0]))?'TIVA':'');
const MT={TIVA:'TIVA / TCI',Volatile:'Volatile'};
const niceDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});

/* ---------- operation names and groups ---------- */
const OPMAP={"laparoscopic cholecystectomy":"lap chole","la appendix":"lap appendix","laparoscopic appendecectomy":"lap appendix","trh":"thr","haemarroidectomy":"haemorrhoidectomy","laparoscopic inguinal hernia repair":"lap inguinal hernia repair","sleeve gastrectomy":"lap sleeve gastrectomy","redo gastric bypass":"redo roux en y bypass","gastric band removal":"removal gastric band","removal of gastric band":"removal gastric band","wide local excision breast":"wle breast","laparoscopic tah and bso":"lap tah bso","ankle orif":"orif ankle","plating ankle #":"orif ankle","k wire wrist":"kwire wrist","k wire hand #":"kwire hand","trachy top end":"tracheostomy top end","tracheotomy procedural end":"tracheostomy procedural end","perc trache procedural end":"tracheostomy procedural end","ln bx":"lymph node biopsy","rupturef aaa repair":"ruptured aaa repair","circ":"circumcision","hand debridement":"debridement hand","repair quadriceps":"quadriceps repair","laparascopic adhesiolysis":"lap adhesiolysis","laparoscopy adhesiolysis":"lap adhesiolysis","laparoscopic division of adhesions":"lap adhesiolysis","laparascopy":"laparoscopy","laparoscopic right hemicolectomy":"lap right hemicolectomy","laparoscopic partial gastrectomy":"lap partial gastrectomy","major incisional hernia remair":"incisional hernia repair","i and d perianalabscess":"i and d perianal abscess","perianal abscess i and d":"i and d perianal abscess","cvc":"cvc insertion","central line":"cvc insertion","thyroid lobectomy":"hemithyroidectomy","nasal septoplasty":"septoplasty","fixation # rad ulnar":"orif radius and ulnar","paraumbilical hernia":"paraumbilical hernia repair","periumbilical hernia repair":"paraumbilical hernia repair","ovarian cyst lap removal":"lap ovarian cystectomy","intubtion and chest drain":"intubation and chest drain","spigalian hernia repair":"spigelian hernia repair","fistulaotomy":"fistulotomy","pelvic exeturation haemorrhage":"pelvic exenteration haemorrhage","laparotomy hartmans hysterectomy":"laparotomy hartmanns hysterectomy","salpingooopherectomy":"salpingo-oophorectomy","lap oopherectomy":"lap oophorectomy","trocanter orif hip":"trochanter orif hip","removal gastric band and sleeve gastrec tomy":"removal gastric band and sleeve gastrectomy","metatarsophal jt fusion":"metatarsophalangeal jt fusion","intubation broncheolitis superv":"intubation bronchiolitis superv","exfix ankle fracture":"x fix ankle","tah bso":"open tah bso","lap incisional hernia":"lap incisional hernia repair","nissans fundoplication":"lap fundoplication","wound washout andpop":"wound washout and pop","hysteroscopy, procede to laparoscopy":"laparoscopy hysteroscopy","bilateral wles":"bilateral wle breast","laparotomy ileostomy reversal":"laparotomy reversal of ileostomy","hot laparoscopic cholecystectomy":"lap chole","laparoscopic gastric bypass":"roux en y gastric bypass","open inguinal hernia repair":"inguinal hernia repair","open hernia repair":"inguinal hernia repair","haemorroids":"haemorrhoidectomy","laparoscopy":"diagnostic laparoscopy","im nail femur":"femoral nail","ureteroscopy and laser":"ureteric laser stone fragmentation","renal stone laser removal":"ureteric laser stone fragmentation","hysteroscopy ablation":"endometrial ablation","orif ankle prone":"orif ankle","shoulder relocation":"mua shoulder","lines":"cvc insertion","perc trache":"tracheostomy procedural end","laparoscopic cystectomy":"lap ovarian cystectomy","mtp bunion":"bunion repair","thd":"haemorrhoidectomy"};
const tidyName=op=>{let v=String(op||'').replace(/\s+/g,' ').trim(); for(let i=0;i<4&&OPMAP[normOp(v)];i++) v=OPMAP[normOp(v)]; return v};
const G={ob:'Obstetrics',blk:'Analgesic block or epidural',air:'Intubation and airway (ICU and ED)',line:'Lines, drains and bedside procedures',icu:'ICU admission, transfer and resuscitation',
  eye:'Ophthalmic',mf:'Maxillofacial and dental',ent:'ENT, head and neck',bil:'Cholecystectomy and biliary',bar:'Bariatric',ugi:'Upper GI',her:'Hernia repair',
  col:'Colorectal resection and stoma',ano:'Anorectal',brs:'Breast',gyl:'Gynaecology: laparoscopy and major',gym:'Gynaecology: hysteroscopy and minor',
  uro:'Urology: endoscopic',uro2:'Urology: open and scrotal',vas:'Vascular and amputation',hip:'Hip and femoral fracture surgery',arth:'Joint replacement',
  fx:'Fracture fixation (other)',ort:'Arthroscopy, MUA and other orthopaedic',soft:'Abscess, wound and soft tissue',lap:'Laparotomy, laparoscopy and appendix',gen:'Other general surgery',oth:'Other'};
const GROUPS=Object.keys(G).map(k=>G[k]);
const GRULES=[
 [/lscs|labour|pph|third degree|c section|percreta/,'ob'],
 [/kwire removal|removal (metalwork|hardware)|^mua (?!femur)|relocation/,'ort'],
 [/\bblocks?\b|epidural|analgesia/,'blk'],
 [/intubat|intubt|\bett\b|extubat|trache|trachy|foi\b|bronchoscopy|covid/,'air'],
 [/cvc|central line|^lines$|midline|chest drain|io needle|lumbar puncture|\blp\b/,'line'],
 [/admission|transfer|retrieval|stabili[sz]ation|cpr|arrest|balloon pump|\bpci\b|eccor|\bmri\b|^ct |organ (donation|retrieval)/,'icu'],
 [/cataract|phaco|ozurdex|rectus|vitreous|tear duct|orbit/,'eye'],
 [/dental|teeth|mandib|maxillary|zygoma|tongue|lip lacer|forehead|facial/,'mf'],
 [/tonsil|adenoid|grommet|septoplasty|septal|fess|laryng|pharyng|oesophagoscopy|neck dissection|thyroid|parotid|mastoid|eua ear|nasal|nose|i and d (neck|cheek)|thyroglossal|cervical lymph/,'ent'],
 [/chole|bile duct|gallbladder|liver cyst|biliary/,'bil'],
 [/sleeve|roux|gastric bypass|gastric band/,'bar'],
 [/fundoplication|hellers|gastrectomy|gastropexy|gastrojejun|jejunostomy|\bpeg\b|\bpej\b|\bogd\b|gastric tumour|hiatus/,'ugi'],
 [/hysterectomy|\btah\b|\bbso\b|ooph|oopher|ovarian|sterili|lap and dye|ectopic|myomectomy|endometriosis|laparoscopy hysteroscopy|laparotomy cyst removal|hole bladder|laparoscopic cystectomy/,'gyl'],
 [/hernia/,'her'],
 [/colectomy|anterior resection|hartman|proctectomy|ileostomy|stoma|rectopexy|tamis|ileocolic|colonic|bowel resection|sb resection|exenteration/,'col'],
 [/eua (rectum|anus|anal|seton|haemorr)|haemorr|^seton|fistul|pilonidal|mucopexy|^thd$|perianal|sigmoidoscopy|^manual evacuation$/,'ano'],
 [/breast|\bwles?\b|mastectom|mammop|axillary|lat dorsi/,'brs'],
 [/hysteroscop|erpc|mirena|bartholin|labial|vulval|vagina|loop excision|fentons|eua gynae|endometrial|fibroid|post repair/,'gym'],
 [/cystoscopy|turbt|turp|\btur\b|ureter|stone|urethral|bladder neck|trus|cystolithopaxy|suprapubic/,'uro'],
 [/circumcision|hydrocele|orchidectomy|vasectomy|torsion|frenuloplasty|nephrectomy|prostatectomy/,'uro2'],
 [/\baka\b|\bbka\b|amputation|\baaa\b|evar|carotid|fem pop|artery|angio|vascular bleed/,'vas'],
 [/hemiarthroplasty|\bdhs\b|femoral (nail|plate|fracture)|femur|cannulated hip|trochanter/,'hip'],
 [/\bthr\b|\btkr\b|knee revision|unicompartment|replacement|redo hip/,'arth'],
 [/orif|k ?wire|\bnail\b|x ?fix|exfix|plating|olecranon|fixation|banding/,'fx'],
 [/\bmua\b|relocation|arthroscopy|metalwork|hardware|tendon|\bacj\b|\bacl\b|bunion|fusion|osteotomy|trigger finger|terminalisation|quadriceps|achilles|hip injection|patella|metatarsal|shoulder joint/,'ort'],
 [/laparotomy|laparoscop|laparostomy|appendix|adhesio|\babdo\b/,'lap'],
 [/abscess|i and d|lipoma|debridement|washout|lacerat|wound|lymph node|\bln\b|cyst|skin|dogbite|foreign body|exploration|haematoma|fasciotom|thorn|tissue excision/,'soft'],

];
const GSPEC={'General':'gen','Trauma':'ort','Orthopaedics':'ort','Gynae':'gym','Urology':'uro2','ENT':'ent','Maxillo-facial':'mf','Dental':'mf','Ophthalmics':'eye','Vascular':'vas','Obstetrics':'ob','Intensive Care':'icu','Resuscitation':'icu','Plastics':'soft'};
function autoGroup(c){
  const n=normOp(c.op); if(!n) return '';
  if(c.spec==='Gynae'&&/^(diagnostic )?laparoscopy$|^laparotomy/.test(n)) return G.gyl;
  for(const [re,k] of GRULES) if(re.test(n)) return G[k];
  return G[GSPEC[c.spec]||'oth'];
}
const grp=c=>c.grp||autoGroup(c);

/* ---------- hospital theatre records: read, match, merge ---------- */
const HOSP_FIELDS=[['site','Site'],['theatre','Theatre'],['surgeon','Surgeon'],['proc','Procedure (hospital)'],['tech','Anaesthetic (hospital)'],['cepod','CEPOD'],['ptype','Patient type'],
  ['cons','Consultant anaesthetist'],['anaes','Anaesthetist'],['airway','Airway'],['airwayDetail','Airway detail'],['lines','Invasive lines'],['agent','Maintenance (hospital)'],
  ['tAnRoom','Into anaesthetic room'],['tAn','Anaesthesia start'],['tTh','Into theatre'],['tKts','Knife to skin'],['tEnd','Surgery finished'],['tRec','Into recovery'],
  ['durAn','Anaesthetic minutes'],['durSurg','Surgery minutes'],['durTh','Minutes in theatre'],['recPain','Recovery: pain'],['recPonv','Recovery: PONV'],['recHypo','Recovery: temperature below 36'],['hage','Age (hospital)'],['hk','Hospital record key']];
const HOSP_SHOW={durAn:'Anaesthesia start to into theatre (min)',durSurg:'Knife to skin to surgery finished (min)',durTh:'Into theatre to into recovery (min)'};
const HCOL=k=>'Hosp: '+HOSP_FIELDS.find(f=>f[0]===k)[1];
function hospAgent(mon){ const m=String(mon||'').toLowerCase(), a=(m.match(/(?:agent|n\/a)\s*([^|]*)/g)||[]).join(' ');
  if(/tiva|propofol|proprol|propfol|proprfol|teev|tci|remi/.test(a)&&!/sevo|desf|iso/.test(a)) return 'TIVA';
  if(/sevo|desf|isoflu/.test(a)) return 'Volatile'; return '' }
const tmin=t=>{const m=/^(\d{1,2}):(\d{2})/.exec(t||'');return m?(+m[1])*60+(+m[2]):null};
const dmy=s=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s||'');return m?m[3]+'-'+pad(+m[2])+'-'+pad(+m[1]):''};
function hospMe(names){const m={};names.forEach(n=>{if(n)m[n]=(m[n]||0)+1});return Object.keys(m).sort((a,b)=>m[b]-m[a])[0]||''}
function supFromHosp(cons,anaes,me){ if(!me) return ''; if(cons===me&&(!anaes||anaes===me)) return 'Consultant Solo'; if(cons===me&&anaes&&anaes!==me) return 'Teaching: ST'; if(cons&&cons!==me&&anaes===me) return 'Consultant'; return '' }
function readHospital(text){
  const rows=csvRows(text); if(rows.length<2) throw new Error('The file has no cases.');
  const H={}; rows[0].forEach((h,i)=>H[h.trim().toLowerCase()]=i);
  for(const need of ['date','procedure']) if(H[need]==null) throw new Error('This does not look like a theatre export: it has no "'+need+'" column.');
  const sp=s=>String(s||'').replace(/\s+/g,' ').trim(), yes=v=>/^(true|yes)/i.test(sp(v));
  const out=[];
  for(const r of rows.slice(1)){
    const g=n=>{const i=H[n];return i==null?'':sp(r[i])};
    let d=g('date'),m; if((m=d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) d=m[3]+'-'+pad(+m[2])+'-'+pad(+m[1]); else if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const hm=t=>{const x=/^(\d{1,2}):(\d{2})/.exec(t);return x?pad(+x[1])+':'+x[2]:''};
    const lines=[yes(g('inv_arterial'))&&'Arterial line',yes(g('inv_cvc'))&&'Central line',yes(g('inv_swan'))&&'PA catheter',yes(g('inv_cardiac_output'))&&'Cardiac output monitoring'].filter(Boolean).join(', ');
    const age=g('age'), sex=g('gender'), asa=g('asa');
    const rec={d,proc:g('procedure'),site:g('hospital'),theatre:g('theatre'),surgeon:g('surgeon'),tech:g('anaesthetic'),cepod:g('cepod'),ptype:g('patient_type'),
      cons:g('cons_anaes'),anaes:g('anaes'),airway:g('airway'),airwayDetail:g('airway_raw').replace(/\|/g,', '),lines,agent:hospAgent(g('monitoring_raw')),
      tAnRoom:hm(g('t_enter_anaes_room')),tAn:hm(g('t_anaes_start')),tTh:hm(g('t_enter_theatre')),tKts:hm(g('t_kts')),tEnd:hm(g('t_procedure_finished')),tRec:hm(g('t_enter_recovery')),
      durAn:g('dur_anaesthetic').replace(/\.0$/,''),durSurg:g('dur_surgery').replace(/\.0$/,''),durTh:g('dur_in_theatre').replace(/\.0$/,''),
      recPain:g('rec_pain')?(yes(g('rec_pain'))?'Yes':'No'):'',recPonv:g('rec_ponv')?(yes(g('rec_ponv'))?'Yes':'No'):'',recHypo:g('rec_hypothermia')?(yes(g('rec_hypothermia'))?'Yes':'No'):'',
      hage:age===''||isNaN(+age)?'':String(Math.round(+age)), sex:/^m/i.test(sex)?'M':/^f/i.test(sex)?'F':'', asa:/^[1-6]$/.test(asa)?asa:''};
    {const dod=dmy(g('date_of_death')), known=dmy(g('dod_known_to')), op=Date.parse(d), dd=dod?(Date.parse(dod)-op)/864e5:null;
      rec.mort=dod&&dd>=0&&dd<=30?true:(known&&(Date.parse(known)-op)/864e5>=30)||(dod&&dd>30)?false:null}
    rec.spec=g('specialty'); rec.hk=d+'|'+(rec.tAn||rec.tTh||rec.tAnRoom||rec.tKts)+'|'+normOp(rec.proc).slice(0,40);
    out.push(rec);
  }
  return out;
}
/* operation similarity: expand abbreviations, stem, compare word sets */
const OPWORDS={lap:'laparoscopic',chole:'cholecystectomy',eua:'examination anaesthesia',thr:'total hip replacement',trh:'total hip replacement',tkr:'total knee replacement',
  dhs:'dynamic hip screw',wle:'wide local excision breast',wles:'wide local excision breast',turbt:'transurethral resection bladder tumour',turp:'transurethral resection prostate',
  thd:'transanal haemorrhoidal dearterialisation',erpc:'surgical management miscarriage',smm:'surgical management miscarriage',tah:'total abdominal hysterectomy',bso:'salpingoophorectomy bilateral',
  orif:'orif fixation',mua:'manipulation mua',kwire:'kwire wire',ogd:'oesophagogastroduodenoscopy ogd',peg:'peg gastrostomy',lscs:'caesarean',acj:'acromioclavicular',
  hemi:'hemiarthroplasty',ln:'lymph node',bx:'biopsy',fb:'foreign body',im:'intramedullary nail',nail:'intramedullary nail fixation',reversal:'closure reversal',
  fundoplication:'fundoplication antireflux hiatus',appendix:'appendicectomy',extractions:'extraction tooth',teeth:'tooth',haemorrhoids:'haemorrhoidectomy haemorrhoid',
  i:'',and:'',d:'',of:'',the:'',with:'',to:'',from:'',for:'',procedure:'',primary:'',repair:'repair',xfix:'external fixator',exfix:'external fixator'};
function opWords(s){
  let t=' '+String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ')+' ';
  t=t.replace(/ i and d /g,' incision drainage ').replace(/ k wire /g,' kwire ').replace(/ x fix /g,' xfix ').replace(/ ex fix /g,' xfix ').replace(/ roux en y /g,' roux gastric bypass ');
  const w=new Set(); t.trim().split(' ').forEach(x=>{const e=OPWORDS[x]; (e==null?x:e).split(' ').forEach(y=>{if(y&&y.length>1)w.add(y.length>=5?y.slice(0,5):y)})}); return w;
}
function opSim(a,b){const A=opWords(a),B=opWords(b); if(!A.size||!B.size) return 0; let n=0; A.forEach(x=>{if(B.has(x))n++}); return n/Math.min(A.size,B.size)}
const SPECMAP={'General Surgery':'General','Trauma & Orthopaedics':'Trauma','Obstetrics and Gynaecology':'Gynae','Maxillofacial and Oral Surgery':'Maxillo-facial','Vascular Surgery':'Vascular','Urology':'Urology','ENT':'ENT','Breast Surgery':'General'};
function matchScore(c,r){
  const os=opSim(c.op,r.proc), g1=autoGroup(c), g2=autoGroup({op:r.proc,spec:SPECMAP[r.spec]||c.spec}), sameGroup=g1&&g1===g2;
  const ts=[r.tAnRoom,r.tAn,r.tTh,r.tKts].map(tmin).filter(x=>x!=null), cs=tmin(c.s);
  const dt=cs==null||!ts.length?120:Math.min.apply(null,ts.map(x=>Math.abs(x-cs)));
  let s=45*os+(sameGroup?20:0)+Math.max(0,30-dt/4);
  const sexOK=!(c.sex&&r.sex)||c.sex===r.sex, hasAge=c.age!==''&&c.age!=null&&r.hage!=='', da=hasAge?Math.abs(+c.age-(+r.hage)):null;
  if(c.sex&&r.sex) s+=sexOK?8:-30;
  if(hasAge) s+=da<=5?8:da<=12?2:da<=25?-8:-25;
  const sure=sexOK&&(s>=60||(hasAge&&da<=5&&dt<=30)||((!hasAge||da<=12)&&(os>=0.5||sameGroup)&&dt<=120));
  return {s,os,dt,sameGroup,sure};
}
function matchHospital(cases,recs){
  const byDay={}; cases.forEach(c=>{(byDay[c.d]=byDay[c.d]||[]).push(c)});
  const done=new Set(cases.map(c=>c.h&&c.h.hk).filter(Boolean));
  const pairs=[], newRecs=[], already=[];
  const recDays={}; recs.forEach(r=>{ if(done.has(r.hk)) already.push(r); else (recDays[r.d]=recDays[r.d]||[]).push(r) });
  for(const d in recDays){
    const R=recDays[d], C=(byDay[d]||[]).filter(c=>!(c.h&&c.h.hk)), cand=[];
    R.forEach(r=>C.forEach(c=>{const m=matchScore(c,r); if(m.s>=10) cand.push(Object.assign({c,r},m))}));
    cand.sort((a,b)=>b.s-a.s); const uc=new Set(), ur=new Set();
    cand.forEach(p=>{ if(uc.has(p.c)||ur.has(p.r)) return; uc.add(p.c); ur.add(p.r); pairs.push(p) });
    R.forEach(r=>{if(!ur.has(r)) newRecs.push(r)});
  }
  return {pairs, newRecs, already};
}
/* cases pulled by an older app version keep hospital columns as unknown extras: move them into the hospital record */
function liftHosp(c){ if(!c||!c.x) return c; const ks=Object.keys(c.x).filter(k=>/^hosp: /i.test(k)); if(!ks.length) return c;
  const n=Object.assign({},c), x=Object.assign({},c.x), h=Object.assign({},c.h||{});
  ks.forEach(k=>{const f=HOSP_FIELDS.find(f=>('hosp: '+f[1]).toLowerCase()===k.toLowerCase()); if(f&&x[k]&&!h[f[0]]) h[f[0]]=x[k]; delete x[k]});
  if(Object.keys(h).length) n.h=h; if(Object.keys(x).length) n.x=x; else delete n.x; return n }
function hospDetail(r){const h={}; HOSP_FIELDS.forEach(([k])=>{if(r[k]!=null&&r[k]!=='')h[k]=r[k]}); return h}
function mergeHospital(c,r){
  const n=JSON.parse(JSON.stringify(c)); n.h=hospDetail(r);
  if(!n.asa&&r.asa) n.asa=r.asa; if(!n.sex&&r.sex) n.sex=r.sex; if((n.age===''||n.age==null)&&r.hage!=='') n.age=+r.hage;
  if(isGA(n)&&!maint(n)&&r.agent) n.mt=r.agent;
  if((r.tAn||r.tAnRoom)&&(r.tRec||r.tEnd)){n.s=r.tAn||r.tAnRoom; n.e=r.tRec||r.tEnd}
  return n;
}
const PRI_FROM_CEPOD={Elective:'Routine',Urgent:'Urgent',Emergency:'Emergency',Expedited:'Urgent',Immediate:'Emergency'};
function A1_FROM_HOSP(r){ const t=r.tech.toLowerCase(), air=r.airway.toLowerCase();
  if(/general|^ga/.test(t)) return /tracheal|tracheostomy/.test(air)?'GA ETT IPPV':/supraglottic/.test(air)?'GA LMA IPPV':/face mask/.test(air)?'GA Mask':'GA';
  if(/spinal/.test(t)) return 'Spinal'; if(/sedation/.test(t)) return 'Sedation'; if(/local/.test(t)) return 'LA'; if(/block|epidural/.test(t)) return 'Monitoring only'; return t?r.tech:'' }
function caseFromHospital(r,me){
  const c={id:newId(),d:r.d,s:r.tAn||r.tAnRoom||r.tTh||'',e:r.tRec||r.tEnd||'',sup:supFromHosp(r.cons,r.anaes,me),sex:r.sex,age:r.hage===''?'':+r.hage,asa:r.asa,
    pri:r.ptype==='DayCase'&&(!r.cepod||r.cepod==='Elective')?'Day case':PRI_FROM_CEPOD[r.cepod]||'',spec:SPECMAP[r.spec]||r.spec||'',op:tidyName(r.proc),
    a1:A1_FROM_HOSP(r),mt:'',a2:/spinal/i.test(r.tech)&&/general/i.test(r.tech)?'Spinal':/nerve block|regional/i.test(r.tech)&&/general|spinal/i.test(r.tech)?'Nerve block':/epidural/i.test(r.tech)?'Epidural':'',
    a2s:'',a2t:'',procs:[],notes:'Added from hospital theatre record',inc:'',incd:'',h:hospDetail(r)};
  if(isGA(c)) c.mt=r.agent; return c;
}

/* ---------- storage on this device ---------- */
let stats={mort:{}}, statsDirty=false;
function addMortality(recs){ const m={}; recs.forEach(r=>{ if(r.mort==null) return; const k=r.d.slice(0,7); m[k]=m[k]||[0,0]; m[k][0]++; if(r.mort) m[k][1]++ });
  Object.keys(m).forEach(k=>{ const o=stats.mort[k]; if(!o||m[k][0]>=o[0]) stats.mort[k]=m[k] }); statsDirty=true }
function mergeStats(a,b){ const o={mort:Object.assign({},(b&&b.mort)||{})}; Object.keys((a&&a.mort)||{}).forEach(k=>{ if(!o.mort[k]||a.mort[k][0]>=o.mort[k][0]) o.mort[k]=a.mort[k] }); return o }
function mortality(from,to){ const f=(from||'0000-00').slice(0,7), t=(to||'9999-99').slice(0,7); let n=0,d=0; const ks=Object.keys(stats.mort).filter(k=>k>=f&&k<=t).sort(); ks.forEach(k=>{n+=stats.mort[k][0];d+=stats.mort[k][1]}); return {n,d,from:ks[0],to:ks[ks.length-1]} }
let all=[], dirty={}, meta={sha:'',etag:'',lastSync:0,lastBackup:0,changed:false,replace:false}, cfg=null, cache=null, syncErr='';
const idb=(()=>{let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('anaesthetic-logbook',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  return {get:k=>open().then(d=>new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})),
    set:(k,v)=>open().then(d=>new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)}))}})();
let saveChain=Promise.resolve();
function persist(){ saveChain=saveChain.then(()=>Promise.all([idb.set('cases',all),idb.set('dirty',dirty),idb.set('meta',meta),idb.set('cfg',cfg),idb.set('stats',stats),idb.set('statsDirty',statsDirty)])).catch(()=>toast('Could not save to this phone. Free up space, then save a backup file.')); return saveChain }
function cases(){
  if(cache) return cache;
  cache=all.filter(c=>c.d).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:(a.s<b.s?1:a.s>b.s?-1:0)); optCache=null; return cache;
}
function store(c){
  c.u=Date.now(); const i=all.findIndex(x=>x.id===c.id);
  if(c.deleted){if(i>=0)all.splice(i,1)} else if(i>=0) all[i]=c; else all.push(c);
  dirty[c.id]=c; meta.changed=true; cache=null; persist(); syncLabel(); syncSoon();
}
function syncLabel(){
  const el=$('sync'), n=Object.keys(dirty).length, tot=cases().length.toLocaleString('en-GB')+(cases().length===1?' case':' cases'); el.className='';
  if(!cfg){el.textContent=tot+' · on this phone only'; if(all.length) el.className='warn'}
  else if(syncErr){el.className='warn';el.textContent='Sync problem · see Backup'}
  else if(meta.replace||n){el.className='warn';el.textContent=(meta.replace?'Upload':n+(n===1?' change':' changes'))+' waiting to sync'}
  else el.textContent=tot+' · synced';
  drawBackup();
}

/* ---------- the logbook file (CSV) ---------- */
const HEAD=["Date","Start","End","Supervision","Sex","Age","ASA","Priority","Speciality","Operation","Anaesthetic 1","Anaesthetic 2","Anesthetic 2: Operator Status","Anesthetic 2: Technique","Procedure 1","Procedure 1: Operator Status","Procedure 1: Technique","Procedure 2","Procedure 2: Operator Status","Procedure 2: Technique","Procedure 3","Procedure 3: Operator Status","Procedure 3: Technique","Notes","Incidents","Incident Details"];
const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
function toCsv(L,withIds){
  const extra=Math.max(0,Math.max.apply(null,[3].concat(L.map(c=>(c.procs||[]).length)))-3);
  const head=HEAD.slice(); for(let i=0;i<extra;i++){const n=i+4;head.push('Procedure '+n,'Procedure '+n+': Operator Status','Procedure '+n+': Technique')}
  head.push('Maintenance','Operation Group'); const hasH=L.some(c=>c.h); if(hasH) HOSP_FIELDS.forEach(f=>head.push('Hosp: '+f[1])); const xs=[]; if(withIds){L.forEach(c=>{if(c.x)Object.keys(c.x).forEach(k=>{if(!xs.includes(k)&&!KNOWN.test(k))xs.push(k)})}); xs.forEach(k=>head.push(k)); head.push('ID','Updated')}
  const tm=t=>t?t+':00':'';
  const rows=L.map(c=>{const p=c.procs||[], cell=i=>p[i]?[p[i][0],p[i][1]||'',p[i][2]||'']:['','',''];
    let r=[withIds?c.d:uk(c.d),tm(c.s),tm(c.e||c.s),c.sup,c.sex,c.age===''||c.age==null?'':(+c.age).toFixed(1),c.asa,c.pri,c.spec,c.op,c.a1,c.a2,c.a2s,c.a2t]
      .concat(cell(0),cell(1),cell(2),[c.notes,c.inc,c.incd]); for(let i=0;i<extra;i++) r=r.concat(cell(3+i));
    r.push(maint(c),grp(c)); if(hasH) HOSP_FIELDS.forEach(f=>r.push(c.h&&c.h[f[0]]||'')); if(withIds){xs.forEach(k=>r.push(c.x&&c.x[k]||'')); r.push(c.id,c.u?new Date(c.u).toISOString():'')} return r.map(q).join(',')});
  return [head.map(q).join(',')].concat(rows).join('\r\n')+'\r\n';
}
function csvRows(text){
  const rows=[]; let row=[], cell='', inq=false; text=text.replace(/^﻿/,'');
  for(let i=0;i<text.length;i++){const ch=text[i];
    if(inq){ if(ch==='"'){ if(text[i+1]==='"'){cell+='"';i++} else inq=false } else cell+=ch }
    else if(ch==='"') inq=true; else if(ch===','){row.push(cell);cell=''}
    else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n')i++; row.push(cell);cell=''; if(row.length>1||row[0]!=='')rows.push(row); row=[] }
    else cell+=ch }
  row.push(cell); if(row.length>1||row[0]!=='')rows.push(row); return rows;
}
const KNOWN=/^(date|start|end|supervision|sex|age|asa|priority|speciality|operation|anaesthetic [12]|anesthetic 2: (operator status|technique)|procedure \d+(: (operator status|technique))?|notes|incidents|incident details|maintenance|operation group|id|updated|hosp: .*)$/i;
const newId=()=>'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function readCsv(text){
  const rows=csvRows(text); if(!rows.length) throw new Error('The file is empty.');
  const H={}; rows[0].forEach((h,i)=>H[h.trim().toLowerCase()]=i);
  if(H['date']==null||H['operation']==null) throw new Error('This does not look like a logbook file: it needs Date and Operation columns.');
  const sp=s=>String(s||'').replace(/\s+/g,' ').trim(); let removed=0; const seen=new Set();
  const scrub=s=>{const t=sp(sp(s).replace(/(nhs\s*(no|number)?\.?\s*)?(^|\b)\d{3}[ -]?\d{3}[ -]?\d{4}\b/gi,' ')); if(t!==sp(s))removed++; return t};
  const out=[];
  for(const r of rows.slice(1)){
    const g=n=>{const i=H[n]; return i==null?'':sp(r[i])};
    let d=g('date'), m;
    if((m=d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) d=m[3]+'-'+pad(+m[2])+'-'+pad(+m[1]);
    else if((m=d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/))){const y=+m[3]+(+m[3]>70?1900:2000); d=y+'-'+pad(+m[1])+'-'+pad(+m[2])}
    else if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const tm=t=>{const x=t.match(/^(\d{1,2}):(\d{2})/); return x?pad(+x[1])+':'+x[2]:''};
    const procs=[]; for(let n=1;H['procedure '+n]!=null;n++){const nm=g('procedure '+n); if(nm) procs.push([nm,g('procedure '+n+': operator status'),g('procedure '+n+': technique')])}
    const age=g('age'), a1=g('anaesthetic 1'); let id=g('id'); if(!id||seen.has(id)) id=newId(); seen.add(id);
    const u=Date.parse(g('updated')); const mtv=g('maintenance'), mt=/^(tiva|tci)/i.test(mtv)?'TIVA':/^vol/i.test(mtv)?'Volatile':'';
    let x=null; rows[0].forEach((h,i)=>{const k=h.trim(); if(k&&!KNOWN.test(k)&&sp(r[i])){x=x||{};x[k]=sp(r[i])}});
    out.push({id,d,s:tm(g('start')),e:tm(g('end')),sup:g('supervision'),sex:g('sex'),age:age===''||isNaN(+age)?'':Math.round(+age),asa:g('asa'),pri:g('priority'),spec:g('speciality'),op:g('operation'),
      a1:a1==='spinal'?'Spinal':a1,a2:g('anaesthetic 2'),a2s:g('anesthetic 2: operator status'),a2t:g('anesthetic 2: technique'),procs,notes:scrub(g('notes')),inc:g('incidents'),incd:scrub(g('incident details')),mt,u:isNaN(u)?0:u}); {const o=out[out.length-1], gv=g('operation group'); const hh={}; HOSP_FIELDS.forEach(f=>{const v=g('hosp: '+f[1].toLowerCase()); if(v) hh[f[0]]=v}); if(Object.keys(hh).length) o.h=hh; if(x) o.x=x; if(gv&&GROUPS.includes(gv)&&gv!==autoGroup(o)) o.grp=gv}
  }
  return {cases:out,removed};
}

/* ---------- GitHub sync: the CSV in your private repo is the master copy ---------- */
const b64enc=s=>{const b=new TextEncoder().encode(s);let o='';for(let i=0;i<b.length;i+=0x8000)o+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(o)};
const b64dec=s=>{const bin=atob(s.replace(/\s/g,''));const b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);return new TextDecoder().decode(b)};
function ghError(r){const e=new Error(r.status===401?'GitHub rejected the token. Create a new one and reconnect.':r.status===403?'GitHub refused access. Check the token has Contents read and write on this repo.':r.status===404?'Repo not found, or the token cannot see it.':'GitHub error '+r.status+'.');e.http=r.status;return e}
function ghFetch(c,url,opt){opt=opt||{};return fetch('https://api.github.com/repos/'+encodeURIComponent(c.owner)+'/'+encodeURIComponent(c.repo)+url,{method:opt.method||'GET',cache:'no-store',body:opt.body,
  headers:Object.assign({'Authorization':'Bearer '+c.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},opt.headers||{})})}
const ghPath=c=>'/contents/'+c.path.split('/').map(encodeURIComponent).join('/');
async function ghGet(c,etag){
  const r=await ghFetch(c,ghPath(c),etag?{headers:{'If-None-Match':etag}}:{});
  if(r.status===304) return {unchanged:true}; if(r.status===404) return {missing:true}; if(!r.ok) throw ghError(r);
  const j=await r.json(); let text;
  if(j.content&&j.encoding==='base64') text=b64dec(j.content);
  else {const r2=await ghFetch(c,ghPath(c),{headers:{'Accept':'application/vnd.github.raw+json'}}); if(!r2.ok) throw ghError(r2); text=await r2.text()}
  return {sha:j.sha,text,etag:r.headers.get('ETag')||''};
}
async function ghPut(c,text,sha,n){
  const body={message:typeof n==='string'?n:'Logbook update: '+n+' cases',content:b64enc(text)}; if(sha) body.sha=sha;
  const r=await ghFetch(c,ghPath(c),{method:'PUT',body:JSON.stringify(body)});
  if(r.status===409||r.status===422) return {conflict:true}; if(!r.ok) throw ghError(r);
  return {sha:(await r.json()).content.sha};
}
function applyDirty(list,d){const m=new Map(list.map(c=>[c.id,c])); Object.keys(d).forEach(k=>{if(d[k].deleted)m.delete(k);else m.set(k,d[k])}); return [...m.values()]}
let syncing=false, syncAgain=false, syncT;
function syncSoon(){clearTimeout(syncT); syncT=setTimeout(()=>sync(false),1200)}
async function sync(pull){
  if(!cfg) return false; if(syncing){syncAgain=true;return null} if(navigator.onLine===false){syncLabel();return false}
  syncing=true; let tries=0, failed=false;
  try{
    for(;;){
      const snap=JSON.parse(JSON.stringify(dirty)), replace=meta.replace; let list=all, sha=meta.sha, etag=meta.etag, got=null;
      if(pull||!sha){ got=await ghGet(cfg,replace?'':meta.etag);
        if(got.missing) sha=''; else if(!got.unchanged){ etag=got.etag; if(!replace&&got.sha!==meta.sha) list=applyDirty(readCsv(got.text).cases,snap); sha=got.sha } }
      if(replace||Object.keys(snap).length||(got&&got.missing)){
        const res=await ghPut(cfg,toCsv(list,true),sha,list.length);
        if(res.conflict){ if(++tries>2) throw new Error('GitHub kept rejecting the update. Try Sync now.'); pull=true; meta.sha=''; meta.etag=''; continue }
        sha=res.sha; etag='';
      }
      Object.keys(snap).forEach(k=>{if(JSON.stringify(dirty[k])===JSON.stringify(snap[k])) delete dirty[k]});
      all=applyDirty(list,dirty); meta.sha=sha; meta.etag=etag; meta.replace=false; meta.lastSync=Date.now(); syncErr=''; cache=null; break;
    }
  }catch(e){ failed=true; syncErr=e.http||!(e instanceof TypeError)?e.message:''; }
  if(!failed&&(pull||statsDirty)){ try{ const c=Object.assign({},cfg,{path:cfg.path.replace(/\.csv$/i,'')+'-stats.json'}), got=await ghGet(c,''); let remote={mort:{}}; if(!got.missing){try{remote=JSON.parse(got.text)}catch(e){}}
    const merged=mergeStats(stats,remote); stats=merged; if(statsDirty&&JSON.stringify(merged)!==JSON.stringify(remote)) await ghPut(c,JSON.stringify(merged),got.missing?'':got.sha,'Mortality totals update'); statsDirty=false }catch(e){} }
  syncing=false; persist(); syncLabel(); refresh();
  if(!failed&&(syncAgain||Object.keys(dirty).length)){syncAgain=false;syncSoon()} else syncAgain=false;
  return !failed;
}

/* ---------- backup view ---------- */
const when=t=>t?new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'never';
function drawBackup(){
  if(!$('ghState')) return;
  $('ghForm').hidden=!!cfg||!$('ghChoice').hidden; $('ghOn').hidden=!cfg;
  $('ghState').textContent=cfg?'Connected to '+cfg.owner+'/'+cfg.repo+' ('+cfg.path+'). Last synced: '+when(meta.lastSync)+'.':'Not connected. Cases are stored on this phone only.';
  $('ghErr').hidden=!syncErr; $('ghErr').textContent=syncErr;
  const stale=all.length&&(!meta.lastBackup||(meta.changed&&Date.now()-meta.lastBackup>30*864e5));
  $('bkState').textContent='Last backup file saved: '+when(meta.lastBackup)+'.'; $('bkState').className='note'+(stale?' warn':'');
  const nt=untidy().length; $('tdState').textContent=nt?nt+(nt===1?' case uses':' cases use')+' an operation name that has a standard form (for example "laparoscopic cholecystectomy" becomes "lap chole").':'Operation names are tidy.'; $('tdGo').hidden=!nt; if(!tdArmed) $('tdGo').textContent='Rename '+nt+(nt===1?' case':' cases');
  $('nag').hidden=!(all.length===0||stale);
  $('nagText').textContent=all.length===0?'No cases on this phone yet. Load your logbook file in Backup.':'No backup file saved '+(meta.lastBackup?'in the last 30 days':'yet')+'.';
}
const untidy=()=>all.filter(c=>c.op&&tidyName(c.op)!==c.op); let tdArmed=false;
let pendingCfg=null, pendingRemote=null, pendingRestore=null;
function setupBackup(){
  $('ghConnect').onclick=async()=>{
    const c={owner:$('ghOwner').value.trim(),repo:$('ghRepo').value.trim(),path:($('ghPath').value.trim()||'logbook.csv').replace(/^\/+/,''),token:$('ghToken').value.trim()};
    const err=m=>{$('ghErr').textContent=m;$('ghErr').hidden=false};
    if(!c.owner||!c.repo||!c.token) return err('Fill in the username, repo and token.');
    $('ghConnect').disabled=true; $('ghConnect').textContent='Checking…';
    try{
      const r=await ghFetch(c,''); if(!r.ok) throw ghError(r); const info=await r.json();
      if(!info.private) throw new Error('That repo is public. Use a private repo for your cases.');
      const rem=await ghGet(c,''); $('ghToken').value='';
      if(!rem.missing&&all.length){ const n=readCsv(rem.text).cases.length; pendingCfg=c; pendingRemote=rem;
        $('ghChoiceText').textContent='GitHub already has a logbook with '+n.toLocaleString('en-GB')+' cases, and this phone has '+all.length.toLocaleString('en-GB')+'. Which should be kept?';
        $('ghChoice').hidden=false; $('ghErr').hidden=true; drawBackup() }
      else { cfg=c; meta.sha='';meta.etag=''; meta.replace=!!rem.missing&&all.length>0; if(!rem.missing){all=readCsv(rem.text).cases;dirty={};meta.sha=rem.sha;meta.lastSync=Date.now();cache=null}
        await persist(); toast('Connected'); syncLabel(); refresh(); sync(false) }
    }catch(e){ err(e instanceof TypeError?'Could not reach GitHub. Check your connection.':e.message) }
    $('ghConnect').disabled=false; $('ghConnect').textContent='Connect';
  };
  const choose=useRemote=>{ cfg=pendingCfg; meta.etag='';
    if(useRemote){all=readCsv(pendingRemote.text).cases;dirty={};meta.sha=pendingRemote.sha;meta.replace=false;meta.lastSync=Date.now()} else {dirty={};meta.sha='';meta.replace=true}
    pendingCfg=pendingRemote=null; $('ghChoice').hidden=true; cache=null; persist(); toast('Connected'); syncLabel(); refresh(); sync(false) };
  $('ghUseRemote').onclick=()=>choose(true); $('ghUseLocal').onclick=()=>choose(false);
  $('ghCancel').onclick=()=>{pendingCfg=pendingRemote=null;$('ghChoice').hidden=true;drawBackup()};
  const report=ok=>toast(ok===null?'A sync is already running. Try again in a moment.':ok?'Up to date: '+cases().length.toLocaleString('en-GB')+' cases, '+all.filter(c=>c.h).length+' with a theatre record':(syncErr||'Could not reach GitHub. Check your connection and try again.'));
  $('ghSync').onclick=async()=>{toast('Syncing…');report(await sync(true))};
  $('ghReload').onclick=async()=>{toast('Reloading from GitHub…');meta.sha='';meta.etag='';report(await sync(true))};
  let offArmed=false; $('ghOff').onclick=()=>{ if(!offArmed){offArmed=true;$('ghOff').textContent='Tap again to disconnect';return} offArmed=false;$('ghOff').textContent='Disconnect';
    cfg=null;meta.sha='';meta.etag='';meta.replace=false;dirty={};syncErr='';persist();syncLabel();toast('Disconnected. The token was removed from this phone.') };
  $('bkSave').onclick=async()=>{
    const name='anaesthetic-logbook_'+today()+'.csv', text=toCsv(cases(),true); let ok=false;
    try{ const f=new File([text],name,{type:'text/csv'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});ok=true} }catch(e){ if(e&&e.name==='AbortError') return }
    if(!ok) download(name,text);
    meta.lastBackup=Date.now(); meta.changed=false; persist(); drawBackup(); toast('Backup file saved');
  };
  $('rsFile').onchange=async()=>{ const f=$('rsFile').files[0]; if(!f) return;
    try{ pendingRestore=readCsv(await f.text()); if(!pendingRestore.cases.length) throw new Error('No cases found in that file.');
      $('rsText').textContent='The file has '+pendingRestore.cases.length.toLocaleString('en-GB')+' cases'+(pendingRestore.removed?' ('+pendingRestore.removed+' patient numbers were removed from notes)':'')+'. '+(all.length?'This replaces the '+all.length.toLocaleString('en-GB')+' cases on this phone'+(cfg?' and on GitHub.':'.'):'');
      $('rsConfirm').hidden=false }catch(e){ toast(e.message) } $('rsFile').value='' };
  $('rsYes').onclick=()=>{ all=pendingRestore.cases; pendingRestore=null; dirty={}; meta.changed=true; if(cfg) meta.replace=true; cache=null; $('rsConfirm').hidden=true; persist(); syncLabel(); refresh(); loadForm(blank()); toast('Logbook loaded'); syncSoon() };
  $('tdGo').onclick=()=>{ if(!tdArmed){tdArmed=true;$('tdGo').textContent='Tap again to rename';return} tdArmed=false; const L=untidy(), now=Date.now();
    L.forEach(c=>{const n=Object.assign({},c,{op:tidyName(c.op),u:now}); all[all.indexOf(c)]=n; dirty[n.id]=n}); meta.changed=true; cache=null; persist(); syncLabel(); refresh(); toast(L.length+' cases renamed'); syncSoon() };
  $('rsNo').onclick=()=>{pendingRestore=null;$('rsConfirm').hidden=true};
}
function download(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:name.endsWith('.csv')?'text/csv':name.endsWith('.html')?'text/html':'text/plain'})); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000) }

/* ---------- option lists learned from the logbook, most used recently first ---------- */
let optCache=null;
function opts(){
  if(optCache) return optCache;
  const cut=shiftYears(today(),-3), all=cases();
  const rank=get=>{const m=new Map();for(const c of all){for(const v of get(c)){if(!v)continue;m.set(v,(m.get(v)||0)+1+(c.d>=cut?5:0))}}return [...m].sort((a,b)=>b[1]-a[1]).map(x=>x[0])};
  const ops=new Map();
  for(const c of all){const k=normOp(c.op); if(!k)continue; let o=ops.get(k); if(!o){o={k,label:c.op.replace(/\s+/g,' ').trim(),w:0,spec:{},last:c};ops.set(k,o)} const w=1+(c.d>=cut?5:0); o.w+=w; o.spec[c.spec]=(o.spec[c.spec]||0)+w}
  optCache={sup:rank(c=>[c.sup]),spec:rank(c=>[c.spec]),a1:rank(c=>[c.a1]),a2:rank(c=>[c.a2]),proc:rank(c=>(c.procs||[]).map(p=>p[0])),ops:[...ops.values()].sort((a,b)=>b.w-a.w),opMap:ops};
  return optCache;
}

/* ---------- chip groups ---------- */
function chipGroup(host,o){
  // o: list() -> values, top, get(), set(v), multi, allowNew, label(v)
  const lab=o.label||(v=>v);
  function draw(){
    const list=o.list(), top=o.top||list.length, cur=o.get(), sel=o.multi?cur:[cur];
    const shown=list.slice(0,top); sel.forEach(v=>{if(v&&!shown.includes(v))shown.push(v)});
    host.innerHTML='';
    shown.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='chip'+(sel.includes(v)?' on':'');b.textContent=lab(v);b.setAttribute('aria-pressed',sel.includes(v));
      b.onclick=()=>{o.set(o.multi?(sel.includes(v)?cur.filter(x=>x!==v):cur.concat([v])):(cur===v?'':v));draw()};host.appendChild(b)});
    const rest=list.filter(v=>!shown.includes(v));
    if(rest.length||o.allowNew){
      const s=document.createElement('select');s.className='more';s.setAttribute('aria-label','More options');
      s.innerHTML='<option value="">More…</option>'+rest.map(v=>'<option>'+esc(v)+'</option>').join('')+(o.allowNew?'<option value="__new">Add new…</option>':'');
      s.onchange=()=>{ if(s.value==='__new'){const i=document.createElement('input');i.type='text';i.placeholder='Type and press Enter';i.setAttribute('aria-label','New option');
          const done=()=>{const v=i.value.trim(); if(v) o.set(o.multi?o.get().concat([v]):v); draw()};
          i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();done()}}; i.onblur=done; s.replaceWith(i); i.focus(); return}
        if(s.value){o.set(o.multi?o.get().concat([s.value]):s.value)} draw()};
      host.appendChild(s);
    }
  }
  draw(); return draw;
}

/* ---------- the form ---------- */
let F={}, fillSnapshot=null, redraw=[];
const INCIDENTS=['','Respiratory event','Airway event','Cardiovascular event','Drug or fluid error','Regional complication','Equipment problem','Other'];
function blank(keep){
  const all=cases(), d=(keep&&keep.d)||today();
  const sameDay=all.filter(c=>c.d===d&&c.e).map(c=>c.e).sort();
  return {id:null,d,s:(keep&&keep.e)||sameDay[sameDay.length-1]||'',e:'',sup:(keep&&keep.sup)||(all[0]?all[0].sup:''),sex:'',age:'',asa:'',
    pri:(keep&&keep.pri)||'',spec:(keep&&keep.spec)||'',op:'',a1:'',mt:'',a2:'',a2s:'',a2t:'',procs:[],notes:'',inc:'',incd:'',grp:''};
}
function loadForm(c){
  F=JSON.parse(JSON.stringify(c)); F.procs=F.procs||[]; F.mt=maint(F); fillSnapshot=null;
  $('fDate').value=F.d; syncDates(); $('fStart').value=F.s||''; $('fEnd').value=F.e||''; $('fAge').value=F.age===''||F.age==null?'':F.age; $('fOp').value=F.op||'';
  $('fNotes').value=F.notes||''; $('fInc').value=INCIDENTS.includes(F.inc)?F.inc:''; $('fIncd').value=F.incd||'';
  $('moreDet').open=!!(F.notes||F.inc||F.incd); $('fillNote').hidden=true; $('formErr').hidden=true; idCheck();
  const editing=!!F.id&&!F._copy;
  $('editBanner').hidden=!editing; if(editing) $('editText').textContent='Editing '+(F.op||'case')+', '+niceDate(F.d);
  $('save').textContent=editing?'Save changes':'Save case'; $('del').hidden=!editing; $('del').textContent='Delete'; delArmed=false;
  redraw.forEach(f=>f()); drawOps(); a2vis(); drawHospCard();
}
function drawHospCard(){ const h=F.h; $('hospCard').hidden=!h; if(!h) return;
  $('hospBody').innerHTML=HOSP_FIELDS.filter(f=>f[0]!=='hk'&&h[f[0]]).map(f=>'<div class="kv"><span>'+esc(HOSP_SHOW[f[0]]||f[1])+'</span><b>'+esc(h[f[0]])+'</b></div>').join('') }
function a2vis(){ $('a2extra').hidden=!F.a2; $('mtBox').hidden=!isGA(F); if(!isGA(F)) F.mt='' }
function drawGrp(){ const a=autoGroup({op:$('fOp').value,spec:F.spec}), v=F.grp||a; $('fGrp').innerHTML=(v?'':'<option value="">Set from the operation</option>')+GROUPS.map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('') }
function drawOps(){
  drawGrp();
  const o=opts(), q=normOp($('fOp').value), host=$('gOp'); let list;
  if(q&&!o.opMap.has(q)) list=o.ops.filter(x=>x.k.includes(q)).slice(0,8);
  else if(q) list=[];
  else if(F.spec) list=o.ops.filter(x=>x.spec[F.spec]).sort((a,b)=>b.spec[F.spec]-a.spec[F.spec]).slice(0,10);
  else list=o.ops.slice(0,8);
  host.innerHTML='';
  list.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=x.label;b.onclick=()=>{$('fOp').value=x.label;F.op=x.label;smartFill(x);drawOps()};host.appendChild(b)});
}
function smartFill(x){
  if(F.id&&!F._copy) return; if(F.a1||F.a2||F.procs.length) return;
  const c=x.last; fillSnapshot={spec:F.spec,pri:F.pri};
  F.grp=c.grp||''; F.a1=c.a1||''; F.mt=maint(c); F.a2=c.a2||''; F.a2t=c.a2?c.a2t||'':''; F.a2s=''; F.procs=(c.procs||[]).map(p=>[p[0],'','']);
  if(!F.spec) F.spec=c.spec; if(!F.pri) F.pri=c.pri;
  $('fillText').textContent='Filled in from your last '+x.label+' ('+niceDate(c.d)+'). Change anything that differs.';
  $('fillNote').hidden=false; redraw.forEach(f=>f()); a2vis();
}
function idCheck(){ $('idWarn').hidden=!/(^|\D)\d{3}[ -]?\d{3}[ -]?\d{4}(\D|$)/.test($('fNotes').value+' '+$('fIncd').value) }
let delArmed=false;
function setupForm(){
  $('fInc').innerHTML=INCIDENTS.map(v=>'<option value="'+esc(v)+'">'+(v||'None')+'</option>').join('');
  const g=(id,o)=>redraw.push(chipGroup($(id),o));
  g('gSup',{list:()=>opts().sup,top:4,get:()=>F.sup,set:v=>F.sup=v});
  g('gSex',{list:()=>['M','F'],get:()=>F.sex,set:v=>F.sex=v});
  g('gAsa',{list:()=>['1','2','3','4','5','Donor'],get:()=>String(F.asa||''),set:v=>F.asa=v});
  g('gPri',{list:()=>['Day case','Routine','Urgent','Emergency'],get:()=>F.pri,set:v=>F.pri=v});
  g('gSpec',{list:()=>opts().spec,top:8,allowNew:true,get:()=>F.spec,set:v=>{F.spec=v;drawOps()}});
  g('gA1',{list:()=>opts().a1,top:6,allowNew:true,get:()=>F.a1,set:v=>{F.a1=v;a2vis();redraw.forEach(f=>f!==redrawA1&&f())}}); const redrawA1=redraw[redraw.length-1];
  g('gMt',{list:()=>['TIVA','Volatile'],label:v=>MT[v],get:()=>F.mt,set:v=>F.mt=v});
  g('gA2',{list:()=>opts().a2,top:8,allowNew:true,get:()=>F.a2,set:v=>{F.a2=v;if(!v){F.a2s='';F.a2t=''}a2vis()}});
  g('gA2s',{list:()=>['Solo','Supervised','Observed'],get:()=>F.a2s,set:v=>F.a2s=v});
  g('gA2t',{list:()=>['Ultrasound guided','Anatomical','Nerve simulator'],get:()=>F.a2t,set:v=>F.a2t=v});
  g('gProc',{list:()=>opts().proc,top:8,multi:true,allowNew:true,get:()=>F.procs.map(p=>p[0]),set:v=>{F.procs=v.map(n=>F.procs.find(p=>p[0]===n)||[n,'','']); if(isGA(F)&&!F.mt&&v.some(n=>/^(tci|tiva)$/i.test(n))){F.mt='TIVA';redraw.forEach(f=>f())}}});
  const durs=[[30,'30 min'],[45,'45 min'],[60,'1 h'],[90,'1½ h'],[120,'2 h'],[180,'3 h'],[240,'4 h']];
  durs.forEach(([m,l])=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=l;b.onclick=()=>{if(!$('fStart').value){$('fStart').value='09:00'}$('fEnd').value=addMin($('fStart').value,m)};$('gDur').appendChild(b)});
  $('fOp').oninput=()=>{F.op=$('fOp').value;drawOps()};
  $('fGrp').onchange=()=>{F.grp=$('fGrp').value};
  $('fOp').onchange=()=>{const x=opts().opMap.get(normOp($('fOp').value)); if(x) smartFill(x)};
  $('fNotes').oninput=idCheck; $('fIncd').oninput=idCheck;
  $('fDate').onchange=()=>{ if(!F.id&&!$('fStart').value){const b=blank({d:$('fDate').value});$('fStart').value=b.s} };
  $('fillUndo').onclick=()=>{F.a1='';F.mt='';F.a2='';F.a2s='';F.a2t='';F.procs=[];if(fillSnapshot){F.spec=fillSnapshot.spec;F.pri=fillSnapshot.pri}$('fillNote').hidden=true;redraw.forEach(f=>f());a2vis()};
  $('cancelEdit').onclick=()=>loadForm(blank());
  $('save').onclick=save;
  $('del').onclick=()=>{ if(!delArmed){delArmed=true;$('del').textContent='Tap again to delete';return}
    store({id:F.id,deleted:true}); toast('Case deleted'); loadForm(blank()); refresh() };
}
function save(){
  F.d=$('fDate').value; F.s=$('fStart').value; F.e=$('fEnd').value; F.op=tidyName($('fOp').value); if(F.grp===autoGroup(F)) F.grp='';
  const a=$('fAge').value; F.age=a===''?'':Math.round(+a); F.notes=$('fNotes').value.trim(); F.inc=$('fInc').value; F.incd=$('fIncd').value.trim();
  const miss=[]; if(!F.d)miss.push('date'); if(!F.op)miss.push('operation'); if(!F.a1&&!F.a2)miss.push('anaesthetic technique'); if(isGA(F)&&!F.mt&&(!F.id||F._copy))miss.push('maintenance (TIVA or volatile)');
  if(miss.length){$('formErr').textContent='Add the '+miss.join(', ')+' before saving.';$('formErr').hidden=false;return}
  $('formErr').hidden=true;
  const editing=!!F.id&&!F._copy, c=JSON.parse(JSON.stringify(F)); delete c._copy;
  if(!editing) c.id='n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  store(c); toast(editing?'Changes saved':'Saved: '+c.op);
  loadForm(editing?blank():blank({d:c.d,e:c.e||c.s,sup:c.sup,spec:c.spec,pri:c.pri}));
  document.querySelector('main').scrollTop=0; refresh();
}

/* ---------- cases list ---------- */
let shown=60, flagOnly=false;
const flagged=c=>!c.s||!c.e||c.s===c.e;
function drawList(){
  const q=$('q').value.toLowerCase().trim(), y=$('qYear').value;
  const all=cases().filter(c=>(!y||c.d.startsWith(y))&&(!flagOnly||flagged(c))&&(!q||[c.op,grp(c),c.spec,c.a1,c.a2,c.notes,c.sup,c.pri,(c.procs||[]).map(p=>p[0]).join(' '),c.inc,c.incd].join(' ').toLowerCase().includes(q)));
  $('count').textContent=all.length.toLocaleString('en-GB')+(all.length===1?' case':' cases');
  let h='', day='';
  all.slice(0,shown).forEach(c=>{
    if(c.d!==day){day=c.d;h+='<div class="day">'+esc(niceDate(day))+'</div>'}
    const tech=[c.a1,MT[maint(c)],c.a2].concat((c.procs||[]).map(p=>p[0])).filter(Boolean).join(' · ');
    const cm=caseMins(c), time=flagged(c)||cm==null?'<span class="flag">'+esc(c.s||'no time')+' · no duration</span>':esc(c.s+'–'+c.e+' · '+cm+' min'+(exactTime(c)?'':' (logged)'));
    h+='<button type="button" class="case" data-id="'+esc(c.id)+'"><div class="op">'+esc(c.op||'(no operation)')+'</div><div class="m">'+
      esc([c.age!==''&&c.age!=null?c.age+(c.sex||''):c.sex,c.asa?'ASA '+c.asa:'',c.pri,c.spec,c.sup].filter(Boolean).join(' · '))+'</div><div class="m">'+esc(tech)+'</div><div class="m">'+time+
      (c.h?' · theatre record':'')+(c.notes?' · '+esc(c.notes):'')+(c.inc?' · <span class="flag">'+esc(c.inc)+'</span>':'')+'</div></button>';
  });
  $('list').innerHTML=h||'<div class="note">No cases match.</div>';
  $('moreBtn').hidden=all.length<=shown;
}
function setupList(){
  $('q').oninput=()=>{shown=60;drawList()}; $('qYear').onchange=()=>{shown=60;drawList()};
  $('moreBtn').onclick=()=>{shown+=120;drawList()};
  chipGroup($('gFlag'),{list:()=>['Missing times'],get:()=>flagOnly?'Missing times':'',set:v=>{flagOnly=!!v;shown=60;drawList()}});
  $('list').onclick=e=>{const b=e.target.closest('.case'); if(!b)return; const c=cases().find(x=>x.id===b.dataset.id); if(c){loadForm(c);location.hash='new';document.querySelector('main').scrollTop=0}};
}
function yearOptions(){
  const ys=[...new Set(cases().map(c=>c.d.slice(0,4)))], cur=$('qYear').value;
  $('qYear').innerHTML='<option value="">All</option>'+ys.map(y=>'<option>'+y+'</option>').join(''); $('qYear').value=ys.includes(cur)?cur:'';
}

/* ---------- summary ---------- */
let range='12 months';
function setRange(r){
  range=r; const t=today();
  if(r==='This year'){$('rFrom').value=t.slice(0,4)+'-01-01';$('rTo').value=t}
  else if(r==='12 months'){const d=new Date();d.setFullYear(d.getFullYear()-1);d.setDate(d.getDate()+1);$('rFrom').value=iso(d);$('rTo').value=t}
  else if(r==='5 years'){const d=new Date();d.setFullYear(d.getFullYear()-5);d.setDate(d.getDate()+1);$('rFrom').value=iso(d);$('rTo').value=t}
  else if(r==='Last year'){const y=+t.slice(0,4)-1;$('rFrom').value=y+'-01-01';$('rTo').value=y+'-12-31'}
  else if(r==='All'){const a=cases();$('rFrom').value=a.length?a[a.length-1].d:t;$('rTo').value=a.length&&a[0].d>t?a[0].d:t}
  syncDates(); drawSummary();
}
const inRange=()=>{const f=$('rFrom').value||'0000',t=$('rTo').value||'9999';return cases().filter(c=>c.d>=f&&c.d<=t)};
const ageBand=a=>a===''||a==null?'Not recorded':a<1?'Under 1':a<=5?'1 to 5':a<=15?'6 to 15':a<80?'16 to 79':'80 and over';
function tally(list,get,order){
  const m=new Map(); list.forEach(c=>get(c).forEach(v=>{if(v)m.set(v,(m.get(v)||0)+1)}));
  let r=[...m]; if(order) r.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0])); else r.sort((a,b)=>b[1]-a[1]); return r;
}
function summarise(){
  const L=inRange(), n=L.length; let m=0; L.forEach(c=>{const d=caseMins(c); if(d)m+=d});
  const blocks=L.filter(c=>c.a2), gas=L.filter(isGA), HL=L.filter(c=>c.h), rec=k=>HL.filter(c=>c.h[k]==='Yes'||c.h[k]==='No');
  const S={n,hours:Math.round(m/60),solo:L.filter(c=>c.sup==='Consultant Solo').length,teach:L.filter(c=>/^Teaching/.test(c.sup||'')).length,
    from:$('rFrom').value,to:$('rTo').value,sections:[
    ['Speciality',tally(L,c=>[c.spec])],
    ['Operation group',tally(L,c=>[grp(c)])],
    ['Priority',tally(L,c=>[c.pri],['Day case','Routine','Urgent','Emergency'])],
    ['ASA grade',tally(L,c=>[c.asa?'ASA '+c.asa:'Not recorded'],['ASA 1','ASA 2','ASA 3','ASA 4','ASA 5','ASA Donor','Not recorded'])],
    ['Age',tally(L,c=>[ageBand(c.age)],['Under 1','1 to 5','6 to 15','16 to 79','80 and over','Not recorded'])],
    ['Supervision',tally(L,c=>[c.sup])],
    ['Primary technique',tally(L,c=>[c.a1])],
    ['GA maintenance (of '+gas.length+' general anaesthetics)',tally(gas,c=>[MT[maint(c)]||'Not recorded'],['TIVA / TCI','Volatile','Not recorded']),gas.length],
    ['Regional and neuraxial',tally(L,c=>[c.a2])],
    ['Block operator (of '+blocks.length+' blocks)',tally(blocks,c=>[c.a2s||'Not recorded']),blocks.length],
    ['Procedures and monitoring',tally(L,c=>(c.procs||[]).map(p=>p[0]))],
    ['Most frequent operations',tally(L,c=>[(opts().opMap.get(normOp(c.op))||{label:c.op}).label]).slice(0,15)],
    ['Theatre record (hospital export), '+(HL.length?uk(HL.reduce((a,c)=>c.d<a?c.d:a,'9999'))+' to '+uk(HL.reduce((a,c)=>c.d>a?c.d:a,'0000')):''),(()=>{const lo=HL.reduce((a,c)=>c.d<a?c.d:a,'9999'),hi=HL.reduce((a,c)=>c.d>a?c.d:a,'0000'),W=L.filter(c=>c.d>=lo&&c.d<=hi);return [['Matched to a hospital record',HL.length,W.length],['No hospital record',W.length-HL.length,W.length]]})()],
    ['Site (theatre record)',tally(HL,c=>[c.h.site])],
    ['Airway (theatre record)',tally(HL,c=>[c.h.airway||'Not recorded']),HL.length],
    ['Recovery (theatre record)',[['Pain needing attention',rec('recPain').filter(c=>c.h.recPain==='Yes').length,rec('recPain').length],['Nausea or vomiting',rec('recPonv').filter(c=>c.h.recPonv==='Yes').length,rec('recPonv').length],['Temperature below 36°C',rec('recHypo').filter(c=>c.h.recHypo==='Yes').length,rec('recHypo').length]]],
    ['Cases by year',tally(L,c=>[c.d.slice(0,4)]).sort((a,b)=>a[0]<b[0]?-1:1)]
  ],incidents:L.filter(c=>c.inc||c.incd),tables:summaryTables(L,HL)};
  S.sections=S.sections.filter(s=>!(/theatre record/i.test(s[0])&&!L.some(c=>c.h))&&!(s[0]==='Recovery (theatre record)'&&!s[1].some(r=>r[2]))).map(s=>s[0]==='Recovery (theatre record)'?[s[0]+': % of cases where recorded',s[1].filter(r=>r[2])]:s).filter(s=>s[1].length&&!(s[0]==='Cases by year'&&s[1].length<2));
  return S;
}

const median=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const thMin=h=>{const v=parseFloat(h.durTh); if(!isNaN(v)) return v; const a=tmin(h.tTh||h.tAn), b=tmin(h.tRec||h.tEnd); return a!=null&&b!=null&&b>a?b-a:null};
function summaryTables(L,HL){
  const T=[], gas=L.filter(isGA);
  if(gas.length){ const ys=[...new Set(gas.map(c=>c.d.slice(0,4)))].sort();
    T.push({title:'GA maintenance by year',cols:['Year','General anaesthetics','TIVA / TCI','Volatile','Not recorded','TIVA % of all GAs','TIVA % where recorded'],bar:true,note:'"Where recorded" is shown only for years where at least half of GAs have maintenance recorded. Before theatre records, only TCI use was logged, so earlier years understate volatile use.',
      rows:ys.map(y=>{const g=gas.filter(c=>c.d.startsWith(y)), t=g.filter(c=>maint(c)==='TIVA').length, v=g.filter(c=>maint(c)==='Volatile').length; return [y,g.length,t,v,g.length-t-v,Math.round(100*t/g.length)+'%',(t+v)*2>=g.length?Math.round(100*t/(t+v))+'%':'–']})}) }
  const timed=L.filter(c=>caseMins(c)!=null);
  if(timed.length){
    const q=(a,p)=>{const s=a.slice().sort((x,y)=>x-y),i=(s.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return s[lo]+(s[hi]-s[lo])*(i-lo)};
    const row=(k,cs)=>{const m=cs.map(caseMins);return [k,cs.length,Math.round(q(m,.5)),Math.round(q(m,.25))+'–'+Math.round(q(m,.75)),(m.reduce((a,x)=>a+x,0)/60).toFixed(1)]};
    const grp2=new Map(); timed.forEach(c=>{const k=grp(c)||'Not grouped'; if(!grp2.has(k))grp2.set(k,[]); grp2.get(k).push(c)});
    const ex=timed.filter(exactTime).length, note='Anaesthetic time is anaesthesia start to into recovery from the theatre record for '+ex+' of '+timed.length+' timed cases; the rest use your logged start and end, which are often rounded. Middle half is the 25th to 75th centile.';
    T.push({title:'Anaesthetic time by operation group',cols:['Operation group','Timed cases','Median minutes','Middle half (min)','Total hours'],note,rows:[...grp2].sort((a,b)=>b[1].length-a[1].length).map(([k,cs])=>row(k,cs))});
    const op2=new Map(); timed.forEach(c=>{const k=(opts().opMap.get(normOp(c.op))||{label:c.op}).label; if(!op2.has(k))op2.set(k,[]); op2.get(k).push(c)});
    const ops=[...op2].filter(x=>x[1].length>=5).sort((a,b)=>b[1].length-a[1].length).slice(0,20);
    if(ops.length) T.push({title:'Anaesthetic time by operation (5 or more timed cases)',cols:['Operation','Timed cases','Median minutes','Middle half (min)','Total hours'],rows:ops.map(([k,cs])=>row(k,cs))});
  }
  if(HL.length){
    const by=(f)=>{const m=new Map(); HL.forEach(c=>{const k=f(c)||'Not recorded'; if(!m.has(k))m.set(k,[]); m.get(k).push(c)}); return m};
    let surg=[...by(c=>c.h.surgeon)].sort((a,b)=>b[1].length-a[1].length); if(surg.length>15){const rest=surg.slice(14).reduce((a,x)=>a.concat(x[1]),[]); surg=surg.slice(0,14).concat([['Others ('+(surg.length-14)+' surgeons)',rest]])}
    const mins=cs=>cs.map(c=>thMin(c.h)).filter(x=>x!=null);
    T.push({title:'Surgeons (theatre record)',cols:['Surgeon','Cases','Hours in theatre','Median minutes per case'],rows:surg.map(([k,cs])=>{const m=mins(cs);return [k,cs.length,(m.reduce((a,x)=>a+x,0)/60).toFixed(1),m.length?Math.round(median(m)):'']})});
    const lists=new Map(); HL.forEach(c=>{const k=c.d+'|'+(c.h.site||'')+'|'+(c.h.theatre||''); if(!lists.has(k))lists.set(k,[]); lists.get(k).push(c)});
    const site={}, wd={}, DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    lists.forEach((cs,k)=>{ const s=cs[0].h.site||'Not recorded'; site[s]=site[s]||{lists:0,cases:0,ta:[]}; site[s].lists++; site[s].cases+=cs.length;
      const o=cs.slice().sort((a,b)=>(tmin(a.h.tAnRoom||a.h.tAn||a.h.tTh)||0)-(tmin(b.h.tAnRoom||b.h.tAn||b.h.tTh)||0));
      for(let i=1;i<o.length;i++){const out=tmin(o[i-1].h.tRec), inn=tmin(o[i].h.tTh); if(out!=null&&inn!=null){const g=inn-out; if(g>=-60&&g<=240) site[s].ta.push(Math.max(0,g))}}
      const day=DAYS[(new Date(cs[0].d+'T12:00:00').getDay()+6)%7]; wd[day]=wd[day]||{lists:0,cases:0}; wd[day].lists++; wd[day].cases+=cs.length });
    T.push({title:'Theatre lists by site (theatre record)',cols:['Site','Lists','Cases','Cases per list','Median turnaround (min)'],note:'Turnaround is from one patient into recovery to the next into theatre, on the same list.',
      rows:Object.keys(site).sort((a,b)=>site[b].cases-site[a].cases).map(s=>[s,site[s].lists,site[s].cases,(site[s].cases/site[s].lists).toFixed(1),site[s].ta.length?Math.round(median(site[s].ta)):''])});
    T.push({title:'List days (theatre record)',cols:['Day','Lists','Cases','Cases per list'],rows:DAYS.filter(d=>wd[d]).map(d=>[d,wd[d].lists,wd[d].cases,(wd[d].cases/wd[d].lists).toFixed(1)])});
  }
  return T;
}
function tableHtml(t,screen){
  const sb=screen&&t.bar, bar=r=>{const tot=+r[1]; return '<td class="sb">'+(tot?['sbt','sbv','sbn'].map((k,i)=>'<span class="'+k+'" style="width:'+(100*r[2+i]/tot).toFixed(1)+'%"></span>').join(''):'')+'</td>'};
  let h='<table class="dt"><thead><tr>'+t.cols.map((c,i)=>(sb&&i===1?'<th>Share</th>':'')+'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>';
  h+=t.rows.map(r=>'<tr>'+r.map((v,i)=>(sb&&i===1?bar(r):'')+'<td>'+esc(v)+'</td>').join('')+'</tr>').join('');
  return h+'</tbody></table>';
}
function drawSummary(){
  const S=summarise(), pc=(x,d)=>{d=d||S.n;if(!d||!x)return '0%';const r=Math.round(100*x/d);return r<1?'<1%':r+'%'};
  $('tiles').innerHTML=[[S.n.toLocaleString('en-GB'),'cases'],[S.hours.toLocaleString('en-GB'),'hours with times logged'],[pc(S.solo),'consultant solo ('+S.solo+')'],[pc(S.teach),'teaching ('+S.teach+')']]
    .map(t=>'<div class="tile"><b>'+t[0]+'</b><span>'+t[1]+'</span></div>').join('');
  let h='';
  S.sections.forEach(([title,rows,den])=>{const max=Math.max.apply(null,rows.map(r=>r[1]));
    h+='<div class="card"><h2>'+esc(title)+'</h2><div class="bars">'+rows.map(r=>'<div class="n">'+esc(r[0])+'</div><div class="t" title="'+esc(r[0])+': '+r[1]+'"><i style="width:'+(100*r[1]/max).toFixed(1)+'%"></i></div><div class="v"><b>'+r[1]+'</b> '+pc(r[1],r[2]||den)+'</div>').join('')+'</div></div>'});
  S.tables.forEach(t=>{h+='<div class="card"><h2>'+esc(t.title)+'</h2>'+(t.bar?'<div class="lg"><span class="sbt"></span>TIVA / TCI <span class="sbv"></span>Volatile <span class="sbn"></span>Not recorded</div>':'')+'<div class="tblwrap">'+tableHtml(t,true)+'</div>'+(t.note?'<div class="note">'+esc(t.note)+'</div>':'')+'</div>'});
  if(S.incidents.length) h+='<div class="card"><h2>Incidents and notes of concern</h2>'+S.incidents.map(c=>'<div class="m"><b>'+esc(niceDate(c.d))+'</b> '+esc(c.op)+': '+esc([c.inc,c.incd].filter(Boolean).join(', '))+'</div>').join('')+'</div>';
  $('sections').innerHTML=h||'<div class="note">No cases in this period.</div>';
}
function summaryText(){
  const S=summarise(); let t='Anaesthetic logbook summary\n'+niceDate(S.from)+' to '+niceDate(S.to)+'\n\nCases: '+S.n+'\nHours (cases with times): '+S.hours+'\nConsultant solo: '+S.solo+'\nTeaching: '+S.teach+'\n';
  S.sections.forEach(([title,rows,den])=>{t+='\n'+title+'\n'+rows.map(r=>{const d=r[2]||den||S.n;return '  '+r[0]+': '+r[1]+(d?' ('+Math.round(100*r[1]/d)+'%)':'')}).join('\n')+'\n'});
  S.tables.forEach(tb=>{t+='\n'+tb.title+'\n  '+tb.cols.join(' | ')+'\n'+tb.rows.map(r=>'  '+r.join(' | ')).join('\n')+'\n'});
  {const M=mortality(S.from,S.to); if(M.n) t+='\n30-day mortality (hospital theatre records)\n  '+M.d+(M.d===1?' death':' deaths')+' within 30 days of '+M.n+' operations ('+(100*M.d/M.n).toFixed(1)+'%)\n'}
  if(S.incidents.length) t+='\nIncidents\n'+S.incidents.map(c=>'  '+uk(c.d)+' '+c.op+': '+[c.inc,c.incd].filter(Boolean).join(', ')).join('\n')+'\n';
  return t;
}
function summaryCsv(){
  const S=summarise(); const rows=[['Section','Item','Cases','Percent of cases'],['Period','From '+uk(S.from)+' to '+uk(S.to),S.n,''],['Totals','Hours (cases with times)',S.hours,''],['Totals','Consultant solo',S.solo,''],['Totals','Teaching',S.teach,'']];
  S.sections.forEach(([title,r,den])=>r.forEach(x=>{const d=x[2]||den||S.n;rows.push([title,x[0],x[1],d?Math.round(100*x[1]/d):''])}));
  S.tables.forEach(tb=>{rows.push([tb.title].concat(tb.cols)); tb.rows.forEach(r=>rows.push([tb.title].concat(r)))});
  {const M=mortality(S.from,S.to); if(M.n) rows.push(['30-day mortality (hospital theatre records)','Deaths within 30 days of '+M.n+' operations',M.d,(100*M.d/M.n).toFixed(1)])}
  return rows.map(r=>r.map(q).join(',')).join('\r\n')+'\r\n';
}
function casesCsv(){return toCsv(inRange(),false)}
async function saveFile(name,data){download(name,data);toast('Saved '+name)}
async function copy(text,msg){ try{await navigator.clipboard.writeText(text);toast(msg||'Copied')}catch(e){toast('Copying was blocked. Use the download button.')} }
function setupSummary(){
  chipGroup($('gRange'),{list:()=>['This year','Last year','12 months','5 years','All'],get:()=>range,set:v=>{if(v)setRange(v)}});
  $('rFrom').onchange=$('rTo').onchange=()=>{range='';syncDates();drawSummary()};
  $('rpOpen').onclick=openReport; $('rpClose').onclick=()=>{$('report').hidden=true;document.body.classList.remove('rp')};
  $('rpPrint').onclick=()=>window.print(); $('rpSave').onclick=()=>giveFile('logbook-appraisal-report_'+$('rFrom').value+'_to_'+$('rTo').value+'.html',reportDoc(),'text/html');
  const stamp=()=>($('rFrom').value+'_to_'+$('rTo').value);
  $('dlCsv').onclick=()=>saveFile('anaesthetic-logbook_'+stamp()+'.csv',casesCsv());
  $('dlSum').onclick=()=>saveFile('logbook-summary_'+stamp()+'.csv',summaryCsv());
  $('cpSum').onclick=()=>copy(summaryText(),'Summary copied');
  $('cpCsv').onclick=()=>copy(casesCsv(),'Cases copied as CSV');
}


/* ---------- import hospital export ---------- */
let hpPlan=null;
const hpLine=(d,t,op,sex,age)=>esc(uk(d)+' '+(t||'')+' · '+op+(sex||age!==''&&age!=null?' · '+(sex||'')+(age===''||age==null?'':age):''));
function setupHospImport(){
  $('hpFile').onchange=async()=>{ const f=$('hpFile').files[0]; if(!f) return; $('hpFile').value='';
    try{ const recs=readHospital(await f.text()); if(!recs.length) throw new Error('No cases found in that file.');
      const res=matchHospital(cases(),recs); const sure=res.pairs.filter(p=>p.sure), check=res.pairs.filter(p=>!p.sure);
      hpPlan={sure,check,add:res.newRecs,already:res.already,me:hospMe(recs.map(r=>r.cons).concat(recs.map(r=>r.anaes)))};
      const ds=recs.map(r=>r.d).sort();
      let h='<div>'+recs.length+' theatre records from '+uk(ds[0])+' to '+uk(ds[ds.length-1])+'.</div><ul class="hpsum"><li><b>'+sure.length+'</b> match a case in your logbook.</li>'+
        (check.length?'<li><b>'+check.length+'</b> possible matches to check below.</li>':'')+(res.newRecs.length?'<li><b>'+res.newRecs.length+'</b> are not in your logbook.</li>':'')+(res.already.length?'<li><b>'+res.already.length+'</b> were imported before and are skipped.</li>':'')+'</ul>';
      if(check.length) h+='<h3>Possible matches</h3><div class="note">Tick the pairs that are the same case. Unticked pairs are left alone.</div>'+check.map((p,i)=>'<label class="hprow"><input type="checkbox" data-k="c'+i+'"><span><span class="m">Logbook</span> '+hpLine(p.c.d,p.c.s,p.c.op,p.c.sex,p.c.age)+'<br><span class="m">Hospital</span> '+hpLine(p.r.d,p.r.tAn||p.r.tTh,p.r.proc,p.r.sex,p.r.hage)+'</span></label>').join('');
      if(res.newRecs.length) h+='<h3>Not in your logbook</h3><div class="note">Ticked records are added as new cases. Local anaesthetic cases start unticked.</div>'+res.newRecs.map((r,i)=>'<label class="hprow"><input type="checkbox" data-k="n'+i+'"'+(/local/i.test(r.tech)?'':' checked')+'><span>'+hpLine(r.d,r.tAn||r.tTh,r.proc,r.sex,r.hage)+'<br><span class="m">'+esc(r.tech+(r.anaes&&r.anaes!==r.cons?' · with '+r.anaes:''))+'</span></span></label>').join('');
      $('hpList').innerHTML=h; $('hpConfirm').hidden=false; $('hpGo').textContent='Import'; 
    }catch(e){ toast(e.message||'Could not read that file.') } };
  $('hpNo').onclick=()=>{hpPlan=null;$('hpConfirm').hidden=true;$('hpList').innerHTML=''};
  $('hpGo').onclick=()=>{ if(!hpPlan) return; const ticked=k=>{const b=document.querySelector('#hpList input[data-k="'+k+'"]');return !!(b&&b.checked)};
    const pairs=hpPlan.sure.concat(hpPlan.check.filter((p,i)=>ticked('c'+i))), adds=hpPlan.add.filter((r,i)=>ticked('n'+i)), now=Date.now();
    pairs.forEach(p=>{const i=all.findIndex(x=>x.id===p.c.id); if(i<0) return; const n=mergeHospital(all[i],p.r); n.u=now; all[i]=n; dirty[n.id]=n});
    addMortality(pairs.map(p=>p.r).concat(adds,hpPlan.already));
    adds.forEach(r=>{const n=caseFromHospital(r,hpPlan.me); n.u=now; all.push(n); dirty[n.id]=n});
    meta.changed=true; cache=null; hpPlan=null; $('hpConfirm').hidden=true; $('hpList').innerHTML=''; persist(); syncLabel(); refresh(); syncSoon();
    toast(pairs.length+' cases updated'+(adds.length?', '+adds.length+' added':'')) };
}

/* ---------- appraisal report ---------- */
function reportBody(){
  const S=summarise(), L=inRange().slice().reverse(), pc=(x,d)=>{d=d||S.n;return d?Math.round(100*x/d)+'%':''};
  let h='<h1>Anaesthetic logbook: appraisal report</h1><p class="sub">'+esc(niceDate(S.from))+' to '+esc(niceDate(S.to))+' · generated '+esc(niceDate(today()))+'</p>';
  h+='<table class="tot"><tr><th>Cases</th><th>Hours (cases with times)</th><th>Consultant solo</th><th>Teaching</th></tr><tr><td>'+S.n+'</td><td>'+S.hours+'</td><td>'+S.solo+' ('+pc(S.solo)+')</td><td>'+S.teach+' ('+pc(S.teach)+')</td></tr></table>';
  h+='<h2>Summary</h2><div class="cols">'+S.sections.map(([t,rows,den])=>'<table class="sum"><tr><th>'+esc(t)+'</th><th>Cases</th><th>%</th></tr>'+rows.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+r[1]+'</td><td>'+pc(r[1],r[2]||den)+'</td></tr>').join('')+'</table>').join('')+'</div>';
  {const M=mortality(S.from,S.to); if(M.n) h+='<h2>30-day mortality (hospital theatre records)</h2><p>'+M.d+' death'+(M.d===1?'':'s')+' within 30 days of '+M.n+' operations with at least 30 days of follow-up ('+(100*M.d/M.n).toFixed(1)+'%), from records covering '+esc(M.from.slice(5)+'/'+M.from.slice(0,4))+' to '+esc(M.to.slice(5)+'/'+M.to.slice(0,4))+'. Crude rate, not adjusted for case mix.</p>'}
  if(S.tables.length) h+='<h2>Trends and theatre activity</h2><div class="cols">'+S.tables.map(t=>'<div><b>'+esc(t.title)+'</b>'+tableHtml(t,false)+(t.note?'<div class="tn">'+esc(t.note)+'</div>':'')+'</div>').join('')+'</div>';
  h+='<h2>Incidents</h2>'+(S.incidents.length?'<table class="cases"><tr><th>Date</th><th>Operation</th><th>Incident</th><th>Details</th></tr>'+S.incidents.map(c=>'<tr><td>'+uk(c.d)+'</td><td>'+esc(c.op)+'</td><td>'+esc(c.inc)+'</td><td>'+esc(c.incd)+'</td></tr>').join('')+'</table>':'<p>None recorded in this period.</p>');
  h+='<h2>All cases ('+L.length+')</h2><table class="cases"><thead><tr><th>#</th><th>Date</th><th>Time</th><th>Age</th><th>Sex</th><th>ASA</th><th>Priority</th><th>Speciality</th><th>Operation</th><th>Anaesthetic</th><th>Regional</th><th>Procedures</th><th>Supervision</th><th>Theatre record</th><th>Notes</th></tr></thead><tbody>'+
    L.map((c,i)=>'<tr><td>'+(i+1)+'</td><td>'+uk(c.d)+'</td><td>'+esc(c.s&&c.e&&c.s!==c.e?c.s+'–'+c.e:c.s||'')+(caseMins(c)!=null?'<br>'+caseMins(c)+' min':'')+'</td><td>'+esc(c.age)+'</td><td>'+esc(c.sex)+'</td><td>'+esc(c.asa)+'</td><td>'+esc(c.pri)+'</td><td>'+esc(c.spec)+'</td><td>'+esc(c.op)+'</td><td>'+esc([c.a1,MT[maint(c)]].filter(Boolean).join(', '))+'</td><td>'+esc([c.a2,c.a2s,c.a2t].filter(Boolean).join(', '))+'</td><td>'+esc((c.procs||[]).map(p=>p[0]+(p[1]?' ('+p[1]+')':'')).join(', '))+'</td><td>'+esc(c.sup)+'</td><td>'+esc(c.h?[c.h.site&&c.h.site.split(' ')[0],c.h.surgeon,c.h.airway,c.h.recPonv==='Yes'?'PONV':''].filter(Boolean).join(', '):'')+'</td><td>'+esc([c.notes,c.inc,c.incd].filter(Boolean).join('; '))+'</td></tr>').join('')+'</tbody></table>';
  return h;
}
const REPORT_CSS='.rpt{font:12px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111}.rpt h1{font-size:20px;margin:0 0 2px}.rpt .sub{margin:0 0 12px;color:#444}.rpt h2{font-size:14px;margin:18px 0 6px;border-bottom:1px solid #999;padding-bottom:2px}.rpt table{border-collapse:collapse;margin:0 0 10px}.rpt th,.rpt td{border:1px solid #bbb;padding:2px 5px;text-align:left;vertical-align:top}.rpt th{background:#eee}.rpt .cols{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start}.rpt .sum td:nth-child(n+2),.rpt .tot td{text-align:right;font-variant-numeric:tabular-nums}.rpt .cases{width:100%;font-size:10.5px}.rpt .dt td:nth-child(n+2){text-align:right;font-variant-numeric:tabular-nums}.rpt .dt{margin-top:3px}.rpt .tn{font-size:10.5px;color:#444;max-width:420px}.rpt .cases thead{display:table-header-group}.rpt tr,.rpt .sum,.rpt .tot{break-inside:avoid}.rpt .cases td:nth-child(2),.rpt .cases td:nth-child(3){white-space:nowrap}@page{size:A4 landscape;margin:10mm}';
function reportDoc(){return '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Anaesthetic logbook appraisal report '+uk($('rFrom').value)+' to '+uk($('rTo').value)+'</title><style>body{margin:12px;background:#fff}'+REPORT_CSS+'</style></head><body><div class="rpt">'+reportBody()+'</div></body></html>'}
function openReport(){ $('rpBody').innerHTML='<style>'+REPORT_CSS+'</style><div class="rpt">'+reportBody()+'</div>'; $('report').hidden=false; document.body.classList.add('rp'); $('report').scrollTop=0 }
async function giveFile(name,text,type){
  try{ const f=new File([text],name,{type}); if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return true} }catch(e){ if(e&&e.name==='AbortError') return false }
  download(name,text); return true;
}
function syncDates(){ document.querySelectorAll('.datebox').forEach(b=>{const i=b.querySelector('input'); b.querySelector('span').textContent=i.value?niceDate(i.value):'Choose a date'}) }
function setupDates(){ document.querySelectorAll('.datebox input').forEach(i=>{i.addEventListener('input',syncDates);i.addEventListener('change',syncDates);i.addEventListener('click',()=>{try{i.showPicker&&i.showPicker()}catch(e){}})}); syncDates() }

/* ---------- shell ---------- */
let toastT; function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600)}
const VIEWS=['new','cases','summary','backup'];
function route(){
  const v=VIEWS.includes(location.hash.slice(1))?location.hash.slice(1):'new';
  document.querySelectorAll('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+v));
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===v));
  if(v==='cases'){yearOptions();drawList()} if(v==='summary') drawSummary(); if(v==='backup') drawBackup();
}
function refresh(){ const v=location.hash.slice(1); if(v==='cases'){yearOptions();drawList()} else if(v==='summary') drawSummary(); else if(v!=='backup'&&!F.id){redraw.forEach(f=>f());drawOps()} }
async function start(){
  try{ all=(await idb.get('cases'))||[]; dirty=(await idb.get('dirty'))||{}; meta=Object.assign(meta,(await idb.get('meta'))||{}); cfg=(await idb.get('cfg'))||null; stats=(await idb.get('stats'))||{mort:{}}; statsDirty=!!(await idb.get('statsDirty')); if(meta.v!==2&&meta.v!==3){meta.v=2;meta.sha='';meta.etag=''}
    all=all.map(liftHosp); Object.keys(dirty).forEach(k=>{dirty[k]=liftHosp(dirty[k])});
    if(meta.v===2){ const me=hospMe(all.filter(c=>c.h).map(c=>c.h.cons).concat(all.filter(c=>c.h).map(c=>c.h.anaes))), now=Date.now(); let k=0;
      all=all.map(c=>{ if(!c.h) return c; const n=Object.assign({},c), s=c.h.tAn||c.h.tAnRoom, e=c.h.tRec||c.h.tEnd; if(s&&e){n.s=s;n.e=e} if(!n.sup&&n.notes==='Added from hospital theatre record') n.sup=supFromHosp(c.h.cons,c.h.anaes,me);
        if(n.s!==c.s||n.e!==c.e||n.sup!==c.sup){n.u=now;dirty[n.id]=n;k++;return n} return c });
      meta.v=3; if(k) meta.changed=true; await persist() } }catch(e){ toast('This browser is blocking storage, so cases cannot be kept. Leave private browsing.') }
  F=blank(); setupForm(); setupList(); setupSummary(); setupBackup(); setupHospImport(); setupDates(); loadForm(blank()); setRange('12 months'); route(); syncLabel();
  window.addEventListener('hashchange',route);
  window.addEventListener('online',()=>sync(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cfg&&Date.now()-meta.lastSync>5*60e3)sync(true)});
  if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
  if('serviceWorker' in navigator&&location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
  if(cfg) sync(true);
}
start();
