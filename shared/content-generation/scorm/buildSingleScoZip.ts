import AdmZip from 'adm-zip'

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SCORM_API_SCRIPT = `(function(){
  function findAPI(win){
    var n=0;
    while(win&&n<8){
      if(win.API)return win.API;
      if(win.parent&&win.parent!==win){win=win.parent;n++;continue;}
      break;
    }
    return null;
  }
  var API=findAPI(window);
  window.__sudarReportScore=function(score,max){
    if(!API)return;
    try{
      API.LMSInitialize("");
      if(typeof score==="number"&&typeof max==="number"&&max>0){
        API.LMSSetValue("cmi.core.score.raw",String(score));
        API.LMSSetValue("cmi.core.score.max",String(max));
        API.LMSSetValue("cmi.core.score.min","0");
        API.LMSSetValue("cmi.core.lesson_status",score/max>=0.7?"passed":"failed");
      } else {
        API.LMSSetValue("cmi.core.lesson_status","completed");
      }
      API.LMSCommit("");
      API.LMSFinish("");
    }catch(e){}
  };
})();`

const BASE_CSS = `
:root{color:#e4e4e7;background:#18181b;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.55;}
body{max-width:48rem;margin:0 auto;padding:1.5rem;}
h1{font-size:1.35rem;font-weight:600;margin:0 0 1rem;}
button,.btn{background:#6366f1;color:#fff;border:0;border-radius:0.5rem;padding:0.5rem 1rem;cursor:pointer;margin:0.25rem 0;}
button:hover{background:#4f46e5;}
.quiz-opt{display:block;width:100%;text-align:left;margin:0.35rem 0;padding:0.6rem 0.75rem;border:1px solid #3f3f46;border-radius:0.5rem;background:#27272a;color:#e4e4e7;cursor:pointer;}
.quiz-opt.correct{border-color:#22c55e;background:rgba(34,197,94,0.15);}
.quiz-opt.incorrect{border-color:#ef4444;background:rgba(239,68,68,0.12);}
.card{border:1px solid #3f3f46;border-radius:0.5rem;padding:1rem;margin:0.75rem 0;background:#27272a;}
.flash-front{font-size:1.1rem;font-weight:600;margin-bottom:0.5rem;}
.flash-back{color:#a1a1aa;}
ul.timeline{margin:0.5rem 0;padding-left:1.25rem;}
table.match{width:100%;border-collapse:collapse;}
table.match td,table.match th{border:1px solid #3f3f46;padding:0.35rem 0.5rem;}
.tabs{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;}
.tab-btn{background:#3f3f46;}
.tab-btn.active{background:#6366f1;}
.tab-panel{display:none;}
.tab-panel.active{display:block;}
.feedback{margin-top:0.75rem;font-size:0.9rem;color:#a1a1aa;}
`

function buildManifest(title: string, href: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="SudarCreateManifest" version="1.1"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-SUDAR">
    <organization identifier="ORG-SUDAR" structure="hierarchical">
      <title>${escXml(title)}</title>
      <item identifier="ITEM-0" identifierref="RES-0" isvisible="true">
        <title>${escXml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-0" type="webcontent" adlcp:scormtype="sco" href="${escXml(href)}">
      <file href="${escXml(href)}"/>
    </resource>
  </resources>
</manifest>`
}

export function buildQuizScoHtml(params: {
  title: string
  questions: { question: string; options: string[]; correct: number; explanation?: string }[]
}): string {
  const qJson = JSON.stringify(params.questions).replace(/</g, '\\u003c')
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escHtml(params.title)}</title><style>${BASE_CSS}</style></head>
<body>
<h1>${escHtml(params.title)}</h1>
<div id="quiz-root"></div>
<script>${SCORM_API_SCRIPT}</script>
<script>
var questions=${qJson};
var idx=0,score=0;
function render(){
  var root=document.getElementById("quiz-root");
  if(idx>=questions.length){
    root.innerHTML="<p>Quiz complete. Score: "+score+"/"+questions.length+"</p>";
    if(window.__sudarReportScore)window.__sudarReportScore(score,questions.length);
    return;
  }
  var q=questions[idx];
  var html="<div class=\\"card\\"><p><strong>Q"+(idx+1)+".</strong> "+q.question+"</p>";
  q.options.forEach(function(opt,i){
    html+="<button type=\\"button\\" class=\\"quiz-opt\\" data-i=\\""+i+"\\">"+opt+"</button>";
  });
  html+="<p class=\\"feedback\\" id=\\"fb\\"></p></div>";
  root.innerHTML=html;
  root.querySelectorAll(".quiz-opt").forEach(function(btn){
    btn.addEventListener("click",function(){
      var chosen=parseInt(btn.getAttribute("data-i"),10);
      var correct=chosen===q.correct;
      if(correct)score++;
      root.querySelectorAll(".quiz-opt").forEach(function(b){
        var bi=parseInt(b.getAttribute("data-i"),10);
        b.disabled=true;
        if(bi===q.correct)b.classList.add("correct");
        else if(bi===chosen)b.classList.add("incorrect");
      });
      document.getElementById("fb").textContent=q.explanation||"";
      setTimeout(function(){idx++;render();},1200);
    });
  });
}
render();
</script>
</body></html>`
}

export function buildFlashcardsScoHtml(params: {
  title: string
  cards: { front: string; back: string }[]
}): string {
  const cardsJson = JSON.stringify(params.cards).replace(/</g, '\\u003c')
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escHtml(params.title)}</title><style>${BASE_CSS}</style></head>
<body>
<h1>${escHtml(params.title)}</h1>
<div id="fc-root" class="card"><div class="flash-front" id="fc-front"></div><div class="flash-back" id="fc-back" style="display:none"></div></div>
<button type="button" class="btn" id="fc-flip">Show answer</button>
<button type="button" class="btn" id="fc-next">Next card</button>
<script>${SCORM_API_SCRIPT}</script>
<script>
var cards=${cardsJson},i=0,showing=false;
function render(){
  document.getElementById("fc-front").textContent=cards[i].front;
  document.getElementById("fc-back").textContent=cards[i].back;
  document.getElementById("fc-back").style.display=showing?"block":"none";
}
document.getElementById("fc-flip").onclick=function(){showing=!showing;render();};
document.getElementById("fc-next").onclick=function(){
  showing=false;i=(i+1)%cards.length;
  if(i===0&&window.__sudarReportScore)window.__sudarReportScore(cards.length,cards.length);
  render();
};
render();
</script>
</body></html>`
}

export function buildInteractiveScoHtml(params: {
  title: string
  elements: { type: string; data?: Record<string, unknown> }[]
}): string {
  const parts: string[] = [`<h1>${escHtml(params.title)}</h1>`]
  params.elements.forEach((el, idx) => {
    const d = el.data ?? {}
    if (el.type === 'timeline' && Array.isArray(d.steps)) {
      const steps = d.steps as { title?: string; description?: string }[]
      parts.push(`<div class="card"><p><strong>Timeline</strong></p><ul class="timeline">${steps.map((s) => `<li><strong>${escHtml(String(s.title ?? 'Step'))}</strong>${s.description ? ` — ${escHtml(String(s.description))}` : ''}</li>`).join('')}</ul></div>`)
    } else if (el.type === 'matching' && Array.isArray(d.pairs)) {
      const pairs = d.pairs as { term?: string; definition?: string }[]
      parts.push(`<div class="card"><p>${escHtml(String(d.instruction ?? 'Match the pairs'))}</p><table class="match"><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>${pairs.map((p) => `<tr><td>${escHtml(String(p.term ?? ''))}</td><td>${escHtml(String(p.definition ?? ''))}</td></tr>`).join('')}</tbody></table></div>`)
    } else if (el.type === 'tabs' && Array.isArray(d.tabs)) {
      const tabs = d.tabs as { label?: string; content?: string }[]
      const tabId = `tabs-${idx}`
      parts.push(`<div class="card" id="${tabId}"><div class="tabs">${tabs.map((t, ti) => `<button type="button" class="tab-btn${ti === 0 ? ' active' : ''}" data-tab="${ti}">${escHtml(String(t.label ?? 'Tab'))}</button>`).join('')}</div>${tabs.map((t, ti) => `<div class="tab-panel${ti === 0 ? ' active' : ''}" data-panel="${ti}">${escHtml(String(t.content ?? ''))}</div>`).join('')}</div>`)
    } else if (el.type === 'flipcard' && Array.isArray(d.cards)) {
      const cards = d.cards as { front?: string; back?: string }[]
      parts.push(`<div class="card"><table class="match"><thead><tr><th>Front</th><th>Back</th></tr></thead><tbody>${cards.map((c) => `<tr><td>${escHtml(String(c.front ?? ''))}</td><td>${escHtml(String(c.back ?? ''))}</td></tr>`).join('')}</tbody></table></div>`)
    } else if (el.type === 'hotspot' && d.imageUrl) {
      parts.push(`<div class="card"><img src="${escHtml(String(d.imageUrl))}" alt="" style="max-width:100%;border-radius:0.5rem"/></div>`)
    }
  })
  parts.push(`<button type="button" class="btn" id="complete-btn">Mark complete</button>`)
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escHtml(params.title)}</title><style>${BASE_CSS}</style></head>
<body>
${parts.join('\n')}
<script>${SCORM_API_SCRIPT}</script>
<script>
document.querySelectorAll(".tab-btn").forEach(function(btn){
  btn.addEventListener("click",function(){
    var root=btn.closest(".card");
    var ti=btn.getAttribute("data-tab");
    root.querySelectorAll(".tab-btn").forEach(function(b){b.classList.remove("active");});
    root.querySelectorAll(".tab-panel").forEach(function(p){p.classList.remove("active");});
    btn.classList.add("active");
    root.querySelector('[data-panel="'+ti+'"]').classList.add("active");
  });
});
document.getElementById("complete-btn").onclick=function(){
  if(window.__sudarReportScore)window.__sudarReportScore(1,1);
};
</script>
</body></html>`
}

export function buildSingleScoZip(params: {
  title: string
  html: string
  scoFileName?: string
}): Buffer {
  const scoName = params.scoFileName ?? 'index.html'
  const zip = new AdmZip()
  zip.addFile(scoName, Buffer.from(params.html, 'utf8'))
  zip.addFile('imsmanifest.xml', Buffer.from(buildManifest(params.title, scoName), 'utf8'))
  return zip.toBuffer()
}

export function buildQuizScormZip(params: {
  title: string
  questions: { question: string; options: string[]; correct: number; explanation?: string }[]
}): Buffer {
  const html = buildQuizScoHtml(params)
  return buildSingleScoZip({ title: params.title, html })
}

export function buildFlashcardsScormZip(params: {
  title: string
  cards: { front: string; back: string }[]
}): Buffer {
  const html = buildFlashcardsScoHtml(params)
  return buildSingleScoZip({ title: params.title, html })
}

export function buildInteractiveScormZip(params: {
  title: string
  elements: { type: string; data?: Record<string, unknown> }[]
}): Buffer {
  const html = buildInteractiveScoHtml(params)
  return buildSingleScoZip({ title: params.title, html })
}
