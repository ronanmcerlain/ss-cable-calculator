// SS Cable Size Calculator — Silverstone-style PDF calculation report (jsPDF + autotable)
(function(){
const BLUE=[0,61,165], BLUE20=[204,216,237], GREY=[138,141,143], GREY50=[197,198,199], GREY20=[232,232,233], TEXT=[61,61,61];
const PASS=[30,123,52], FAIL=[179,38,30];
const W=210, M=15, BOTTOM=274;
// Embedded fonts are Latin subsets: map maths symbols to plain text
function t(x){
  if(x===null||x===undefined) return '';
  return String(x).replace(/<sub>(.*?)<\/sub>/g,'$1').replace(/<[^>]+>/g,'')
   .replace(/≥/g,'>=').replace(/≤/g,'<=').replace(/√/g,'sqrt').replace(/θ/g,'T').replace(/φ/g,'phi')
   .replace(/Ω/g,'ohm').replace(/→/g,'->').replace(/−/g,'-').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}
const cellsOf=sel=>[...document.querySelectorAll(sel+' tr')].map(tr=>[...tr.children].map(td=>t(td.textContent)));

window.ssPdfReport=function(o,meta){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  doc.addFileToVFS('Michroma.ttf',SS_ASSETS.michroma); doc.addFont('Michroma.ttf','Michroma','normal');
  doc.addFileToVFS('Body.ttf',SS_ASSETS.body400); doc.addFont('Body.ttf','Body','normal');
  doc.addFileToVFS('BodyB.ttf',SS_ASSETS.body700); doc.addFont('BodyB.ttf','Body','bold');
  const p=o.p, c=o.c, s=o.sel;
  const mat=c.mat==='al'?'Al':'Cu';
  const subline=[meta.project,meta.doc].filter(Boolean).join('  |  ')||'Cable sizing to AS/NZS 3008 / AS/NZS 3000';
  let y=0;

  function pageHeader(){
    doc.addImage(SS_ASSETS.logo,'PNG',M,11,50,50*SS_ASSETS.logoRatio);
    doc.setFont('Michroma','normal'); doc.setFontSize(12); doc.setTextColor(...BLUE);
    doc.text('CABLE SIZE CALCULATION',W-M,16,{align:'right'});
    doc.setFont('Body','normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY);
    doc.text(t(subline),W-M,21.5,{align:'right'});
    doc.setDrawColor(...BLUE); doc.setLineWidth(0.6); doc.line(M,26,W-M,26);
    y=33;
  }
  function ensure(h){ if(y+h>BOTTOM){ doc.addPage(); pageHeader(); } }
  function heading(n,txt,minH){
    ensure(16+(minH||0));
    doc.setFont('Michroma','normal'); doc.setFontSize(9.5); doc.setTextColor(...BLUE);
    doc.text((n?n+'  ':'')+t(txt).toUpperCase(),M,y); y+=2;
    doc.setDrawColor(...GREY50); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); y+=4;
  }
  const base={theme:'grid',margin:{left:M,right:M,top:33,bottom:297-BOTTOM},
    styles:{font:'Body',fontStyle:'normal',fontSize:8.5,textColor:TEXT,lineColor:GREY50,lineWidth:0.1,cellPadding:1.6},
    headStyles:{fillColor:BLUE,textColor:[255,255,255],font:'Body',fontStyle:'bold'},
    alternateRowStyles:{fillColor:GREY20},
};
  function table(opts){
    doc.autoTable(Object.assign({},base,opts,{startY:y,
      styles:Object.assign({},base.styles,opts.styles||{}),
      didDrawPage:d=>{ if(d.pageNumber>1) { const yy=y; pageHeader(); y=yy; } }}));
    y=doc.lastAutoTable.finalY+7;
  }
  const resultStyle=d=>{
    if(d.section!=='body') return;
    const v=String(d.cell.raw||'');
    if(/^PASS/.test(v)){ d.cell.styles.textColor=PASS; d.cell.styles.fontStyle='bold'; }
    else if(/FAIL|Current|Volt drop|Short circuit|Earth fault|Loop|Screen|No rating/.test(v) && d.column.index===d.table.columns.length-1){ d.cell.styles.textColor=FAIL; d.cell.styles.fontStyle='bold'; }
  };

  pageHeader();

  // ---- Details ----
  const today=new Date().toLocaleDateString('en-AU');
  table({body:[
      ['Project',meta.project||'',"Document no.",meta.doc||''],
      ['Cable tag',meta.tag||'','Revision',meta.rev||''],
      ['From',meta.from||'','To',meta.to||''],
      ['Prepared by',meta.by||'','Checked by',meta.chk||''],
      ['Date',today,'Calculator','SS Cable Size Calculator v'+SS_VERSION]],
    columnStyles:{0:{fontStyle:'bold',fillColor:GREY20,cellWidth:28},2:{fontStyle:'bold',fillColor:GREY20,cellWidth:28}},
    alternateRowStyles:{}});

  // ---- Result band ----
  ensure(30);
  const ok=s&&s.ok;
  doc.setFillColor(...(ok?BLUE:FAIL)); doc.rect(M,y,W-2*M,24,'F');
  doc.setFont('Michroma','normal'); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
  doc.text('SELECTED CABLE',M+5,y+6);
  doc.setFont('Body','bold'); doc.setFontSize(15);
  const runs=s&&s.n>1?s.n+' × ':'';
  const cableTxt=s?`${runs}${s.size} mm² ${mat}${s.pe?'  +  '+runs+s.pe+' mm² Cu earth':''}`:'No size satisfies all checks';
  doc.text(cableTxt,M+5,y+14);
  doc.setFont('Body','normal'); doc.setFontSize(8.5);
  doc.text(t((c.cls==='lv'?INS[p.ins].l+'  |  ':'')+c.name),M+5,y+20);
  doc.setFont('Michroma','normal'); doc.setFontSize(8);
  doc.text(ok?'ALL CHECKS PASS':'CHECKS FAIL',W-M-5,y+6,{align:'right'});
  if(s&&!s.na){
    doc.setFont('Body','normal'); doc.setFontSize(8.5);
    const kv=[`Ib ${fmt(o.Ib,1)} A`,`Iz ${fmt(s.Iz,0)} A`,`VD ${fmt(s.vdPct,2)} %`];
    doc.text(kv.join('    '),W-M-5,y+14,{align:'right'});
    if(!ok) doc.text('Fails: '+s.fails.join(', '),W-M-5,y+20,{align:'right'});
  }
  y+=31;

  // ---- Inputs ----
  heading('01','Design inputs');
  const sys=p.ph==='dc'?'DC (2-wire)':(p.ph==='3'?'3-phase AC':'1-phase AC');
  const env=INST[p.inst].env;
  const inRows=[
    ['System',`${sys}, ${p.V} V`,'Load',`${p.load} ${p.unit}${p.ph!=='dc'?' at pf '+p.pf:''}`],
    ['Design current Ib',fmt(o.Ib,1)+' A','Route length (one way)',p.L+' m'],
    ['Max. voltage drop',p.vdMax+' %','Voltage drop method',c.cls==='mv'||c.std?(p.vdm==='pf'?'R cos phi + X sin phi':'Impedance Zc'):'Tabled Vc (mV/A.m)'],
    ['Conductor',c.mat==='al'?'Aluminium':'Copper','Parallel runs',p.par==='auto'?'Auto (max '+p.maxSize+' mm² per run)':p.par],
    c.cls==='lv'?['Insulation',INS[p.ins].l+' ('+INS[p.ins].fam+', '+INS[p.ins].tmax+' °C)','','']:null,
    ['Cable type',t(c.name),'Installation',t(INST[p.inst].name)],
    [env==='air'?'Ambient air temp.':'Ground temp.',(env==='air'?p.tAir:p.tGnd)+' °C','Grouping factor',String(p.kGrp)],
    env==='gnd'?['Soil resistivity factor',String(p.kSoil),'Depth of laying factor',String(p.kDepth)]:null,
    ['Other factor',String(p.kOth),o.map.cover?'Covered-tray factor':'Protective device In',o.map.cover?String(p.cover):(p.In>0?p.In+' A':'Not set')],
    ['Protective device',DEV[p.dev].l,'Let-through I²t',p.i2t>0?p.i2t+' A²s':'Not used (If²·t)'],
    o.map.cover?['Protective device In',p.In>0?p.In+' A':'Not set','','']:null,
    p.sc?['Prospective fault current',p.If+' kA','Clearing time',p.t+' s']:null,
    p.sc?['Earth fault current',p.Ief+' kA',c.cls==='lv'&&p.ph!=='dc'&&p.loop?'Device trip current Ia':'',c.cls==='lv'&&p.ph!=='dc'&&p.loop?(p.Ia>0?fmt(p.Ia,0)+' A':'Not set'):'']:null
  ].filter(Boolean);
  table({body:inRows,columnStyles:{0:{fontStyle:'bold',cellWidth:38},2:{fontStyle:'bold',cellWidth:38}}});

  // ---- Checks ----
  const ch=cellsOf('#checks');
  heading('02','Checks',Math.min(ch.length,6)*6.5);
  if(ch.length>1) table({head:[ch[0]],body:ch.slice(1),didParseCell:d=>{ if(d.section==='body'&&d.column.index===3){ if(d.cell.raw==='PASS'){d.cell.styles.textColor=PASS;d.cell.styles.fontStyle='bold';} else if(d.cell.raw==='FAIL'){d.cell.styles.textColor=FAIL;d.cell.styles.fontStyle='bold';} else if(d.cell.raw==='n/a'){d.cell.raw='';d.cell.text=['—'];} } },
    columnStyles:{2:{halign:'right'},3:{cellWidth:16}}});

  // ---- Nearby sizes ----
  const sz=cellsOf('#sizes');
  heading('03','Size comparison',sz.length*6.5);
  const selIdx=[...document.querySelectorAll('#sizes tbody tr')].findIndex(tr=>tr.classList.contains('sel'));
  if(sz.length>1) table({head:[sz[0]],body:sz.slice(1),
    didParseCell:d=>{ if(d.section!=='body')return; if(d.row.index===selIdx){d.cell.styles.fillColor=BLUE20;d.cell.styles.fontStyle='bold';}
      const last=d.column.index===d.table.columns.length-1;
      if(d.cell.raw==='PASS'){d.cell.styles.textColor=PASS;} else if(d.cell.raw==='FAIL'||(last&&d.cell.raw)){d.cell.styles.textColor=FAIL;} },
    columnStyles:{0:{halign:'right'},1:{halign:'right'},2:{halign:'right'},3:{halign:'right'}}});

  // ---- Basis & notes ----
  heading('04','Basis and notes');
  const notes=[...document.querySelectorAll('#basis li')].map(li=>t(li.textContent))
    .concat([...document.querySelectorAll('#warnings .note')].map(n=>'Note: '+t(n.textContent)))
    .concat(['Method: current rating Iz = Itab × k(temp) × k(group)'+(env==='gnd'?' × k(soil) × k(depth)':'')+' × k(other) × runs. Temperature factor sqrt((Tmax - T)/(Tmax - Tref)). Short circuit S >= I sqrt(t) / K, with K from AS/NZS 3008.1.1 Table 5.1 at the estimated operating temperature. Earth size to AS/NZS 3000 Table 5.1. Loop impedance by the AS/NZS 3000 Appendix B simplified method.']);
  doc.setFont('Body','normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
  notes.forEach(n=>{
    const lines=doc.splitTextToSize(n,W-2*M-5);
    ensure(lines.length*4+1.5);
    doc.setFillColor(...BLUE); doc.circle(M+1.2,y-1.1,0.6,'F');
    doc.text(lines,M+4,y); y+=lines.length*4+1.5;
  });

  // ---- Sign-off ----
  ensure(26); y+=3;
  table({head:[['Prepared','Signature','Date','Checked','Signature','Date']],body:[[meta.by||'','','',meta.chk||'','','']],
    styles:{minCellHeight:10}});

  // ---- Footers ----
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){
    doc.setPage(i);
    doc.setDrawColor(...GREY50); doc.setLineWidth(0.3); doc.line(M,281,W-M,281);
    doc.setFont('Body','normal'); doc.setFontSize(7.5); doc.setTextColor(...GREY);
    doc.text('Silverstone  |  08 6365 5416  |  info@sstone.com.au  |  sstone.com.au',M,285.5);
    doc.text('Engineering aid only. Verify against AS/NZS 3008.1.1/1.2 and AS/NZS 3000 before issue.',M,289.5);
    doc.text((meta.doc?meta.doc+(meta.rev?' Rev '+meta.rev:'')+'  |  ':'')+'Page '+i+' of '+n,W-M,285.5,{align:'right'});
  }
  return doc;
};
})();
