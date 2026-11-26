'use strict';
const axes=['EI','NS','FT','PJ'];
const bank=window.FBTI_BANK || [];
const root=document.documentElement;
const app=document.querySelector('#app');
const dialog=document.querySelector('#dialog');
const $=id=>document.getElementById(id);
function read(key){try{return JSON.parse(localStorage.getItem('fbti.v1.'+key))}catch{return null}}
function write(key,value){try{localStorage.setItem('fbti.v1.'+key,JSON.stringify(value))}catch{}}
const darkMatch=matchMedia('(prefers-color-scheme: dark)');
const langSetting=read('language'),themeSetting=read('theme');
let langPref=langs.includes(langSetting)?langSetting:'auto';
let themePref=['light','dark'].includes(themeSetting)?themeSetting:'auto';
function systemLang(){
  for(const item of navigator.languages || [navigator.language]){
    const base=item.toLowerCase().split('-')[0];if(langs.includes(base))return base;
  }return 'en';
}
let lang=langPref==='auto'?systemLang():langPref;
const t=key=>messages[key][lang];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const frogmark='<svg class="brandmark" aria-hidden="true" viewBox="0 0 44 37"><path d="M3 19c0-4 1-7 4-9C9 1 18 1 22 7c5-6 14-5 16 4 4 3 5 7 4 11-1 8-11 12-21 12S3 30 2 23c0-2 0-3 1-4Z" fill="currentColor"/><g fill="#f4f4c8"><ellipse cx="13" cy="12" rx="3" ry="4"/><ellipse cx="31" cy="12" rx="3" ry="4"/></g><g fill="#283c29"><circle cx="13" cy="13" r="1.5"/><circle cx="31" cy="13" r="1.5"/></g><path d="M13 23q8 6 17-1" fill="none" stroke="#f4f4c8" stroke-width="2" stroke-linecap="round"/></svg>';
const paths={
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 down:'<path d="m6 9 6 6 6-6"/>',monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v3m-5 1h10"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
 moon:'<path d="M20 15a8.5 8.5 0 0 1-11-11A9 9 0 1 0 20 15Z"/>',
 spark:'<path d="M10 3q0 7-7 8 7 1 7 9 1-8 8-9-7-1-8-8ZM19 2q0 3-3 4 3 0 3 4 0-4 4-4-4-1-4-4Z"/>',
 book:'<path d="M3 4h5q3 0 4 2 2-2 4-2h5v15h-5q-3 0-4 2-2-2-4-2H3ZM12 6v15"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 stack:'<rect x="6" y="3" width="14" height="15" rx="2"/><path d="M3 7v12q0 2 2 2h11M10 8h6m-6 4h4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 play:'<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke-width="1"/>',
 cross:'<path d="m6 6 12 12M6 18 18 6"/>',home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3Z"/>',
 leaf:'<path d="M4 19c-3-9 4-16 16-15 0 12-6 18-15 15M4 21l11-12"/>'
};
const icon=k=>'<svg aria-hidden="true" class="ico '+k+'" viewBox="0 0 24 24">'+paths[k]+'</svg>';
function shuffled(items){
  const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
}
function makeRun(){
  const indices=bank.map((_,i)=>i);
  // Draw different situations and response sets so a round never repeats the same choices.
  const ids=shuffled(axes.flatMap(axis=>{
    const seen=new Set();
    return shuffled(indices.filter(i=>bank[i].axis===axis)).filter(i=>{
      const responses=bank[i].a.en.join('\n');
      if(seen.has(responses))return false;
      seen.add(responses);return true;
    }).slice(0,5);
  }));
  return {ids,orders:ids.map(()=>shuffled([0,1,2,3])),answers:ids.map(()=>null),pos:0,done:false};
}
function validRun(r){
  return r&&Array.isArray(r.ids)&&r.ids.length===20&&new Set(r.ids).size===20&&
  axes.every(axis=>r.ids.filter(i=>Number.isInteger(i)&&bank[i]?.axis===axis).length===5)&&
  Array.isArray(r.orders)&&r.orders.length===20&&r.orders.every(a=>Array.isArray(a)&&a.length===4&&[0,1,2,3].every(i=>a.includes(i)))&&
  Array.isArray(r.answers)&&r.answers.length===20&&r.answers.every(v=>v===null||[0,1,2,3].includes(v))&&
  Number.isInteger(r.pos)&&r.pos>=0&&r.pos<20&&typeof r.done==='boolean'&&(!r.done||r.answers.every(v=>v!==null));
}
function score(r){
  const votes=Object.fromEntries(axes.map(k=>[k,0]));
  r.ids.forEach((id,i)=>{if(r.answers[i]!==null&&r.answers[i]<2)votes[bank[id].axis]++});
  const type=axes.map(k=>k[votes[k]>=3?0:1]).join('');
  return {votes,type,character:characters.find(c=>c.types.includes(type))};
}
let saved=read('run'),run=validRun(saved)?saved:null;
let modal=null,view='home';
function route(){const hash=location.hash.slice(1);return hash==='index'?'index':hash==='quiz'&&run?(run.done?'result':'quiz'):hash==='result'&&run?.done?'result':'home'}
function go(to){if(dialog.open)dialog.close();if(location.hash==='#'+to){render();window.scrollTo(0,0)}else location.hash=to}
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});
function applyTheme(){
  root.dataset.theme=themePref==='auto'?(darkMatch.matches?'dark':'light'):themePref;
  root.toggleAttribute('data-hopper',view==='result'&&score(run).character.id==='hopper');
  document.querySelector('meta[name="theme-color"]').content=getComputedStyle(root).getPropertyValue('--bg').trim();
}
darkMatch.addEventListener('change',()=>{if(themePref==='auto')applyTheme()});
window.addEventListener('languagechange',()=>{if(langPref==='auto')render()});
const selOpt=(value,label,pref)=>'<option value="'+value+'"'+(value===pref?' selected':'')+'>'+esc(label)+'</option>';
function header(){
  const nav=(k,action,active)=>'<button class="navitem '+(active?'active':'')+'" data-do="'+action+'">'+t(k)+'</button>';
  $('top').innerHTML='<div class="wrap bar"><button class="brand" data-do="home" aria-label="FBTI · '+t('back')+'">'+frogmark+'FBTI</button><nav>'+nav('test','home',view!=='index')+(view==='home'?'':nav('index','index',view==='index'))+nav('rules','rules',false)+'</nav><div class="settings"><label class="selectbox">'+icon('globe')+'<span>'+languageNames[lang]+'</span>'+icon('down')+'<select id="language" aria-label="'+t('language')+'">'+selOpt('auto',t('auto'),langPref)+langs.map(l=>selOpt(l,languageNames[l],langPref)).join('')+'</select></label><label class="selectbox themebox" title="'+t('theme')+'">'+icon(themePref==='dark'?'moon':themePref==='light'?'sun':'monitor')+icon('down')+'<select id="theme" aria-label="'+t('theme')+'">'+['auto','light','dark'].map(k=>selOpt(k,t(k),themePref)).join('')+'</select></label></div></div>';
  $('language').onchange=e=>{langPref=e.target.value;write('language',langPref);render();$('language').focus()};
  $('theme').onchange=e=>{themePref=e.target.value;write('theme',themePref);render();$('theme').focus()};
  $('footer').innerHTML='<div class="footwrap"><span>'+frogmark+'FBTI · '+t('footer')+'</span><button data-do="rules">'+t('rules')+'</button></div>';
}
const btn=(key,action,cls='',ic='')=>'<button class="btn '+cls+'" data-do="'+action+'">'+(ic?icon(ic):'')+t(key)+'</button>';
const pic=(c,cls='',alt='')=>'<img class="'+cls+'" src="art/'+c+'.png" alt="'+esc(alt)+'" draggable="false">';
function cards(items){
  return '<div class="cards">'+items.map(c=>'<button class="card" data-char="'+c.id+'" style="--tint:'+c.tint+'"><span class="artbox"><span class="tag">'+c.types.join(' / ')+'</span>'+pic(c.id)+'</span><div class="cardcopy"><h3>'+t(c.id+'Name')+'</h3><p>'+t(c.id+'Trait')+'</p></div></button>').join('')+'</div>';
}
const star=cls=>'<svg aria-hidden="true" class="spark '+cls+'" viewBox="0 0 32 32"><path d="M16 1q1 12 14 15-13 1-14 15Q14 18 1 16 14 14 16 1Z"/></svg>';
function home(){
 const cta=run?(run.done?'last':'resume'):'start';
 return '<section id="hero"><div class="herocopy"><div class="eyebrow hero-tag">'+icon('spark')+t('tag')+'</div><h1><span>'+t('title1')+'</span><span>'+t('title2')+'</span></h1><p>'+t('intro')+'</p><div class="herobuttons">'+btn(cta,'start','primary','play')+'</div><div class="meta"><span>'+icon('stack')+t('nq')+'</span><span>'+icon('clock')+t('minutes')+'</span><span>'+icon('grid')+t('dims')+'</span></div></div><div class="stage" aria-hidden="true">'+star('s1')+star('s2')+star('s3')+'<svg class="hopline" viewBox="0 0 100 90" fill="none"><path d="M8 4c33-2 69 22 54 37-13 13-31-8-12-12 24-5 47 28 35 50" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 5" stroke-linecap="round"/></svg>'+pic('frog','hero-frog')+pic('hopper','hero-hopper')+'</div></section>';
}
function indexPage(){return '<div class="indexheader"><button class="backlink" data-do="home">'+icon('home')+t('back')+'</button><h1>'+t('index')+'</h1><p>'+t('indexintro')+'</p></div>'+cards(characters)}
function quiz(){
 const pos=run.pos,q=bank[run.ids[pos]],n=pos+1;
 const answers=run.orders[pos].map((a,idx)=>'<button class="option" aria-pressed="'+(run.answers[pos]===a)+'" data-answer="'+a+'"><b>'+String.fromCharCode(65+idx)+'</b>'+esc(q.a[lang][a])+'</button>').join('');
 return '<div class="quizwrap"><button class="backlink" data-do="home">'+icon('home')+t('back')+'</button><section class="quizcard"><div class="qtop"><strong>'+t('question')+' '+String(n).padStart(2,'0')+' / 20</strong><span>'+t('choose')+'</span></div><div class="rail"><i style="width:'+n*5+'%"></i></div><h1 id="qtitle" tabindex="-1">'+esc(q.q[lang])+'</h1><div class="options" role="group" aria-labelledby="qtitle">'+answers+'</div><div class="quizactions"><button class="btn" data-do="prev" '+(!pos?'disabled':'')+'>'+t('prev')+'</button><button class="btn primary" data-do="next" '+(run.answers[pos]===null?'disabled':'')+'>'+t(n===20?'finish':'next')+'</button></div></section></div>';
}
function result(){
  const {character:c,type,votes}=score(run);
  return '<div class="result"><button class="backlink" data-do="home">'+icon('home')+t('back')+'</button><section class="resultpanel"><div class="resultart">'+pic(c.id,'',t(c.id+'Name'))+'</div><div class="resultcopy"><div class="eyebrow">'+icon('spark')+t('result')+'</div><h1>'+t(c.id+'Name')+'</h1><strong class="resultcode">'+type+'</strong><p>'+t(c.id+'Bio')+'</p></div></section><div class="breakdown"><h2>'+t('breakdown')+'</h2><p>'+t('score')+'</p>'+axes.map(k=>{const p=votes[k]*20;return '<div class="dim"><div class="splitline"><span><b>'+k[0]+'</b> · '+t(k[0])+' '+p+'%</span><span>'+(100-p)+'% '+t(k[1])+' · <b>'+k[1]+'</b></span></div><div class="rail"><i style="width:'+p+'%"></i></div></div>'}).join('')+'</div><div class="herobuttons">'+btn('again','again','primary','play')+btn('index','index','','book')+'</div></div>';
}
function render(){
 view=route();lang=langPref==='auto'?systemLang():langPref;root.lang=lang;
 document.title=lang==='zh'?t('tag'):'FBTI · '+t('tag');applyTheme();header();
 app.innerHTML=view==='home'?home():view==='index'?indexPage():view==='quiz'?quiz():result();
 if(dialog.open&&modal)showDialog(modal);
}
function showDialog(id){
 modal=id;let html='<button class="close" data-do="close" aria-label="'+t('close')+'">'+icon('cross')+'</button>';
 if(id==='rules'){
   html+='<div class="details"><h2 id="dialog-title">'+t('rules')+'</h2><p>'+t('sampling')+'</p><h3>'+t('breakdown')+'</h3><p>'+t('scoring')+'</p><h3>'+t('mapping')+'</h3>'+characters.map(c=>'<div class="maprow"><span>'+t(c.id+'Name')+'</span><b>'+c.types.join(' / ')+'</b></div>').join('')+'</div>';
 }else{
   const c=characters.find(x=>x.id===id);if(!c)return;
   html+='<div class="portrait" style="--tint:'+c.tint+'">'+pic(id)+'</div><div class="modalbody"><div class="eyebrow">'+t(c.id+'Trait')+'</div><h2 id="dialog-title">'+t(id+'Name')+(lang!=='zh'?' <small lang="zh">'+messages[id+'Name'].zh+'</small>':'')+'</h2><b class="resultcode">'+c.types.join(' / ')+'</b><p>'+t(id+'Bio')+'</p></div>';
 }
 dialog.innerHTML=html;dialog.setAttribute('aria-labelledby','dialog-title');if(!dialog.open)dialog.showModal();
}
dialog.addEventListener('close',()=>{modal=null});
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.char){showDialog(b.dataset.char);return}
 if(b.hasAttribute('data-answer')&&view==='quiz'){
   run.answers[run.pos]=Number(b.dataset.answer);write('run',run);
   document.querySelectorAll('.option').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));
   document.querySelector('[data-do="next"]').disabled=false;return;
 }
 switch(b.dataset.do){
 case 'home':case 'index':go(b.dataset.do);break;
 case 'rules':showDialog('rules');break;
 case 'close':dialog.close();break;
 case 'start':if(!run){run=makeRun();write('run',run)}go(run.done?'result':'quiz');break;
 case 'again':run=makeRun();write('run',run);go('quiz');break;
 case 'prev':if(view==='quiz'&&run.pos>0){run.pos--;write('run',run);render();$('qtitle').focus()}break;
 case 'next':
  if(view!=='quiz'||run.answers[run.pos]===null)break;
  if(run.pos===19){run.done=true;write('run',run);go('result')}
  else{run.pos++;write('run',run);render();$('qtitle').focus()}
  break;
 }
});
render();

