'use strict';
const KEY='gym_v1';
const D=['Extra','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const SH=['Extra','Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
/* Rutina inicial: clave = día de la semana (1 Lun, 2 Mar, 3 Mié, 5 Vie). Se usa mientras no haya un día anterior con datos. */
const RAW={
1:`Press banca con barra 4x6-8
Press inclinado mancuernas 3x8-10
Aperturas en máquina 3x12-15
Press máquina convergente 3x10-12
Fondos tríceps 4x6-8
Extensión de tríceps en polea 3x10-12
Patadas de tríceps con mancuerna 3x12-15`,
2:`Dominadas 4x6-8
Remo T en máquina 4x8-10
Jalón al pecho agarre medio 3x10-12
Face pull (pull over a la cara) 3x12-15
Pull-over en polea alta 3x12-15
Curl barra Z 4x6-8
Curl inclinado mancuernas 3x8-10
Curl martillo mancuernas 3x10-12`,
3:`Sentadilla libre 4x6-8
Extensión de cuádriceps en máquina 3x10-12
Abductores en máquina 3x12-15
Gemelos de pie 4x10-15
Press militar mancuernas 4x6-8
Elevaciones laterales mancuerna 3x12-15
Pájaros posteriores 3x12-15`,
5:`Curl barra Z pesado de pie 4x6-8
Curl predicador a una mano 3x8-10
Curl en polea baja 2x12-15
Extensión tríceps unilateral polea 3x12-15
Extensión por encima de la cabeza mancuerna 3x12-15
Antebrazo: curl muñeca con barra 2xFallo
Antebrazo: curl inverso con barra 2xFallo
Crunch en polea 3x15-20
Elevación de piernas colgado 3xFallo`};
const TPL={};
for(const k in RAW)TPL[k]=RAW[k].split('\n').map(l=>{const m=l.trim().match(/^(.*?) (\d+x\S+)$/);return{n:m[1],t:m[2]}});
const $=s=>document.querySelector(s);
let S=load(),open=-1,tab='hoy',hf='all';

function load(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&v.s?v:{s:{}}}catch(e){return{s:{}}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const pad=n=>String(n).padStart(2,'0');
const dk=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>dk(new Date());
const wd=()=>new Date().getDay()||7;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const newSet=()=>({w:'',r:'',f:''});
const has=s=>s.ex.some(e=>(s.dow===0&&e.n)||e.sets.some(x=>x.w||x.r||x.f)||e.nt||e.wu.some(Boolean));

/* sesión de referencia: último día anterior con el mismo día de la semana y con datos */
function ref(dow,before){
  if(!dow)return null;
  const k=Object.keys(S.s).filter(k=>k<before&&S.s[k].dow===dow&&has(S.s[k])).sort().pop();
  return k?S.s[k]:null;
}
function build(dow){
  const r=ref(dow,today());
  if(r)return{dow,ex:r.ex.map((e,i)=>({n:e.n,t:e.t||'',nt:'',ri:i,sets:e.sets.map(newSet),wu:['','','']}))};
  return{dow,ex:(TPL[dow]||[]).map(e=>({n:e.n,t:e.t,nt:'',ri:-1,sets:[newSet(),newSet()],wu:['','','']}))};
}
function cur(){const t=today();const c=S.s[t];if(!c||(c.dow&&!c.ex.length)){S.s[t]=build(wd());save()}return S.s[t]}

const fw=v=>/^\d+([.,]\d+)?$/.test(v)?v+'kg':v;
const fr=v=>v+' rep';
function cell(v,pv,f,empty){
  if(v)return`<span>${esc(f(v))}</span>`;
  if(pv)return`<span class="d">${esc(f(pv))}</span>`;
  return`<span class="d">${empty}</span>`;
}
/* resumen de un ejercicio (pv = ejercicio de referencia o null) */
function summary(e,re){
  let h=e.t?`<div class="g sm">${esc(e.t)}</div>`:'';
  e.sets.forEach((x,i)=>{const y=(re&&re.sets[i])||{};
    h+=`<div class="r">${cell(x.w,y.w,fw,'x')}${cell(x.r,y.r,fr,'-')}${cell(x.f,y.f,fr,'-')}</div>`});
  h+='<div class="sep"></div><div class="r" style="grid-template-columns:1fr 1fr 1fr">';
  e.wu.forEach((v,j)=>{h+=cell(v,re&&re.wu[j],fw,'x')});
  h+='</div>';
  const nt=e.nt||(re&&re.nt)||'';
  if(nt)h+=`<div class="note ${e.nt?'g':'d'}">${esc(nt).replace(/\n/g,'<br>')}</div>`;
  return h;
}

function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  $('#app').innerHTML=tab==='hoy'?hoy():tab==='hist'?hist():datos();
}

function hoy(){
  const s=cur(),r=ref(s.dow,today());
  let h=`<h1>${s.dow?D[s.dow]:'Día extra'}</h1><p class="g">${today()}</p>`;
  h+='<div class="chips">'+[1,2,3,4,5,6,7,0].map(d=>`<button class="chip${s.dow===d?' on':''}" data-day="${d}">${SH[d]}</button>`).join('')+'</div>';
  s.ex.forEach((e,i)=>{
    const re=r&&r.ex[e.ri];
    if(open!==i){
      h+=`<div class="card" data-t="${i}"><div class="top"><b>${esc(e.n)||'Sin nombre'}</b>${summary(e,re)}</div></div>`;
      return;
    }
    const inp=(k,j,ph)=>`<input data-k="${k}" data-j="${j}" value="${esc(e.sets[j][k])}" placeholder="${esc((re&&re.sets[j]&&re.sets[j][k])||ph)}" ${k==='w'?'':'inputmode="numeric"'}>`;
    h+=`<div class="card on" data-i="${i}"><input class="nm" data-f="n" value="${esc(e.n)}" placeholder="Nombre del ejercicio"><input class="tg" data-f="t" value="${esc(e.t)}" placeholder="Repeticiones ideales (ej. 4x6-8)">`;
    h+='<div class="lbl">Peso o grado | Repeticiones | Sin ayuda</div>';
    e.sets.forEach((x,j)=>{h+=`<div class="er">${inp('w',j,'kg o º')}${inp('r',j,'rep')}${inp('f',j,'rep')}<button data-ds="${j}">-</button></div>`});
    h+='<button class="add" data-add>+</button><div class="sep" style="margin:16px 0 0"></div><div class="lbl">Calentamiento</div><div class="wr">';
    e.wu.forEach((v,j)=>{h+=`<input data-wu="${j}" value="${esc(v)}" placeholder="${esc((re&&re.wu[j])||'x')}">`});
    h+=`</div><div class="lbl">Apuntes</div><textarea data-nt rows="2" placeholder="${esc((re&&re.nt)||'Apuntes del día')}">${esc(e.nt)}</textarea><div class="row2"><button data-t="-1">Cerrar</button><button data-del>Eliminar ejercicio</button></div></div>`;
  });
  return h+'<button class="btn-red full" data-newex style="margin-top:14px">+ Ejercicio</button>';
}

function hist(){
  let h='<h1>Historial</h1><div class="chips">';
  h+=`<button class="chip${hf==='all'?' on':''}" data-h="all">Todos</button>`;
  [1,2,3,4,5,6,7,0].forEach(d=>{h+=`<button class="chip${hf===String(d)?' on':''}" data-h="${d}">${SH[d]}</button>`});
  h+='</div>';
  const ks=Object.keys(S.s).filter(k=>has(S.s[k])&&(hf==='all'||String(S.s[k].dow)===hf)).sort().reverse();
  if(!ks.length)return h+'<p class="g">No hay días guardados para este filtro.</p>';
  ks.forEach(k=>{
    const s=S.s[k];
    h+=`<h2 class="hist-h"><span>${s.dow?D[s.dow]:'Extra'}</span><span class="g" style="font-size:15px;font-weight:400">${k}</span></h2>`;
    s.ex.forEach(e=>{h+=`<div class="card"><div class="top"><b>${esc(e.n)||'Sin nombre'}</b>${summary(e,null)}</div></div>`});
  });
  return h;
}

function datos(){
  return`<h1>Datos</h1><p class="g">Los datos se guardan en este navegador. Exporta el CSV para abrirlo en Excel e impórtalo para cargar cambios externos.</p>
  <button class="btn-red full" data-exp style="margin-top:16px">Exportar CSV</button>
  <button class="full" data-imp>Importar CSV</button>
  <p class="g" style="margin-top:16px">Importar sustituye los días que aparezcan en el archivo y mantiene el resto.</p>`;
}

/* ---------- CSV ---------- */
const q=v=>{v=String(v==null?'':v);return/[;,"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function toCSV(){
  const rows=[['fecha','dia','ejercicio_n','ejercicio','serie','peso','reps','reps_sin_ayuda','cal1','cal2','cal3','apuntes','objetivo']];
  Object.keys(S.s).filter(k=>has(S.s[k])).sort().forEach(k=>{
    const s=S.s[k];
    s.ex.forEach((e,i)=>{
      const base=[k,D[s.dow],i+1,e.n],wu=[...e.wu,e.nt||'',e.t||''];
      if(!e.sets.length)rows.push([...base,'','','','',...wu]);
      e.sets.forEach((x,j)=>rows.push([...base,j+1,x.w,x.r,x.f,...wu]));
    });
  });
  return'\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n');
}
function parseCSV(t,sep){
  const out=[];let r=[],c='',inq=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(inq){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else inq=false}else c+=ch}
    else if(ch==='"')inq=true;
    else if(ch===sep){r.push(c);c=''}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';out.push(r);r=[]}
    else c+=ch;
  }
  if(c||r.length){r.push(c);out.push(r)}
  return out.filter(x=>x.some(v=>v.trim()));
}
function normDate(v){
  v=v.trim();let m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if(m)return`${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m?`${m[1]}-${pad(+m[2])}-${pad(+m[3])}`:null;
}
const dayIdx=v=>{const n=String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().slice(0,3);const i=['lun','mar','mie','jue','vie','sab','dom'].indexOf(n);return i+1};
function importCSV(text){
  text=text.replace(/^\ufeff/,'');
  const sep=(text.split(/\r?\n/)[0].match(/;/g)||[]).length?';':',';
  const rows=parseCSV(text,sep).slice(1),days={};
  rows.forEach(r=>{
    const date=normDate(r[0]||'');if(!date)return;
    const d=days[date]||(days[date]={dow:dayIdx(r[1]),ex:{}});
    const n=+r[2]||1;
    const e=d.ex[n]||(d.ex[n]={n:(r[3]||'').trim(),t:(r[12]||'').trim(),nt:r[11]||'',ri:n-1,sets:[],wu:[r[8]||'',r[9]||'',r[10]||'']});
    if(String(r[4]||'').trim()!=='')e.sets.push({w:(r[5]||'').trim(),r:(r[6]||'').trim(),f:(r[7]||'').trim()});
  });
  const ks=Object.keys(days);
  ks.forEach(k=>{const d=days[k];S.s[k]={dow:d.dow,ex:Object.keys(d.ex).map(Number).sort((a,b)=>a-b).map(n=>d.ex[n])}});
  save();open=-1;render();
  alert(ks.length?`Importados ${ks.length} días.`:'No se encontraron datos válidos en el CSV.');
}

/* ---------- eventos ---------- */
document.addEventListener('click',ev=>{
  const t=ev.target,g=a=>t.closest('['+a+']');
  let el;
  if((el=g('data-tab'))){tab=el.dataset.tab;open=-1;render();return}
  if(tab==='hist'&&(el=g('data-h'))){hf=el.dataset.h;render();return}
  if(tab==='datos'){
    if(g('data-exp')){
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([toCSV()],{type:'text/csv;charset=utf-8'}));
      a.download='gimnasio.csv';document.body.appendChild(a);a.click();a.remove();
    }
    if(g('data-imp'))$('#file').click();
    return;
  }
  if(tab!=='hoy')return;
  const s=cur(),card=t.closest('.card'),i=card?+(card.dataset.i??card.dataset.t):-1;
  if((el=g('data-day'))){
    const d=+el.dataset.day;
    if(d!==s.dow&&(!has(s)||confirm('Se cambiará el día y se perderá lo escrito hoy. ¿Continuar?'))){S.s[today()]=build(d);open=-1;save();render()}
    return;
  }
  if(g('data-newex')){s.ex.push({n:'',t:'',nt:'',ri:-1,sets:[newSet()],wu:['','','']});open=s.ex.length-1;save();render();return}
  if((el=t.closest('button[data-t]'))){open=+el.dataset.t;render();return}
  if(g('data-add')){s.ex[i].sets.push(newSet());save();render();return}
  if((el=g('data-ds'))){s.ex[i].sets.splice(+el.dataset.ds,1);save();render();return}
  if(g('data-del')){if(confirm('¿Eliminar este ejercicio?')){s.ex.splice(i,1);open=-1;save();render()}return}
  if(card&&card.dataset.t!==undefined&&!t.closest('input')){open=i;render()}
});
document.addEventListener('input',ev=>{
  const t=ev.target,card=t.closest('.card');
  if(tab!=='hoy'||!card)return;
  const e=cur().ex[+card.dataset.i];if(!e)return;
  if(t.dataset.f==='n')e.n=t.value;
  else if(t.dataset.f==='t')e.t=t.value;
  else if(t.dataset.k)e.sets[+t.dataset.j][t.dataset.k]=t.value;
  else if(t.dataset.wu!==undefined)e.wu[+t.dataset.wu]=t.value;
  else if(t.dataset.nt!==undefined)e.nt=t.value;
  save();
});
$('#file').addEventListener('change',ev=>{
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>importCSV(String(rd.result));
  rd.readAsText(f);ev.target.value='';
});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();

/* =====================================================================
RESUMEN PARA MODELOS DE IA (contexto de funcionamiento)
=====================================================================
OBJETIVO: sustituto de libreta para anotar series de gimnasio. Móvil primero
(vertical, ~1280x2772 px), negro puro OLED, acentos morado #400096, texto blanco o
gris (#8a8a8a secundario, #5c5c5c "gris oscuro" para datos del día anterior).
Sin degradados ni emojis. Sin dependencias ni build: HTML + CSS + JS plano.

ARCHIVOS: index.html (contenedor #app, barra inferior #nav con 3 pestañas, input
file oculto), style.css, app.js (toda la lógica), manifest.json (PWA, icono SVG
embebido), sw.js (caché de los 5 archivos, red primero y caché de respaldo).

MODELO DE DATOS (localStorage, clave "gym_v1"):
  S = { s: { "YYYY-MM-DD": { dow, ex:[ {n, ri, sets:[{w,r,f}], wu:[a,b,c]} ] } } }
  dow: 1=Lunes ... 7=Domingo, 0=día extra.
  n: nombre; ri: índice del ejercicio en la sesión de referencia (-1 si es nuevo);
  sets: w=peso o grado (texto libre: "25", "7º"), r=repeticiones, f=repeticiones
  sin ayuda; wu: 3 pesos de calentamiento (vacío = "x").
  Todo se guarda como texto. Los valores numéricos de peso se muestran con "kg".

LÓGICA DE DÍAS:
  - cur(): devuelve/crea la sesión de hoy con dow = día real (domingo=7).
  - ref(dow, fecha): última sesión ANTERIOR a hoy con el mismo dow que tenga
    datos (has()). Las sesiones vacías se ignoran.
  - build(dow): copia nombres y número de series de la referencia, con valores
    vacíos. Los datos de la referencia NO se copian: se muestran como placeholder
    gris oscuro (resumen y inputs) hasta que se escribe algo encima. Así el día
    anterior nunca se modifica.
  - Todos los días se muestran chips para "falsear" otro día (Lun-Dom,
    coge los ejercicios de ese día de la semana) o "Extra" (vacío, se crea sobre
    la marcha). Cambiar de día reemplaza la sesión de hoy (pide confirmación si
    ya hay datos). Si se quisiera limitarlos a ciertos días, envolver el bloque de chips
    en hoy() con una condición sobre wd().

RUTINA INICIAL: constante RAW/TPL al inicio. Claves por día de la semana (1 Lun,
  2 Mar, 3 Mié, 5 Vie; la rutina "día 4" va en viernes). Cada línea "Nombre SxREPS"
  se parsea a {n, t:objetivo}. build() la usa con 2 series por ejercicio solo si no
  existe un día anterior con datos; en cuanto lo hay, manda el día anterior.
  Campo e.t = objetivo (texto gris bajo el nombre), e.nt = apuntes del día
  (textarea bajo el calentamiento; el apunte del día anterior se ve en gris oscuro).

INTERFAZ:
  - Hoy: tarjetas por ejercicio. Cerrada: nombre, filas "peso | rep | rep sin
    ayuda" y línea de calentamiento (x = vacío). Al tocar se abre (variable
    global "open" = índice abierto): input de nombre, filas editables con botón
    "-" para quitar serie, botón "+" para añadir serie, 3 inputs de calentamiento,
    "Cerrar" y "Eliminar ejercicio". Botón "+ Ejercicio" al final.
  - Historial: visor de las sesiones guardadas, más recientes primero, filtro por
    día de la semana (y Extra). Solo lectura.
  - Datos: Exportar CSV e Importar CSV.
  - Los inputs actualizan el estado y llaman a save() sin re-renderizar (para no
    perder el foco). Los cambios estructurales llaman a render() completo.
  - Delegación de eventos: un único listener click y uno input sobre document,
    usando atributos data-* (data-t, data-i, data-k, data-j, data-wu, data-day...).

CSV: separador ";" con BOM UTF-8 (Excel en español). Columnas: fecha, dia,
  ejercicio_n, ejercicio, serie, peso, reps, reps_sin_ayuda, cal1, cal2, cal3, apuntes, objetivo.
  Una fila por serie; el calentamiento se repite en cada fila del ejercicio.
  Además: apuntes y objetivo (p. ej. 4x6-8) al final de cada fila. Solo se exportan días con datos. Importar detecta ";" o ",", acepta fechas
  AAAA-MM-DD o DD/MM/AAAA (Excel las convierte), reconstruye ejercicios por
  ejercicio_n, y sustituye únicamente las fechas presentes en el archivo.

PARA MODIFICAR: nuevos campos por serie -> añadir a newSet(), summary(), inputs en
hoy(), handler "input", toCSV() e importCSV(). Cambiar estética -> variables CSS
:root en style.css. Subir versión de caché en sw.js (const C) al cambiar archivos.
Para servir: necesita HTTPS o localhost para PWA/service worker (localStorage
funciona también abriendo index.html directamente).
===================================================================== */
