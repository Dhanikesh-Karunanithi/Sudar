/**
 * Wraps lesson HTML in a SCORM 1.2–launchable page that reports completion to the LMS API.
 */
import { moduleContentJsonToExportHtmlFragment } from '@/lib/export/moduleContentToExportHtmlFragment'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SCORM_COMPLETE_SCRIPT = `(function(){
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
  function complete(){
    if(!API)return;
    try{
      API.LMSInitialize("");
      API.LMSSetValue("cmi.core.lesson_status","completed");
      API.LMSSetValue("cmi.core.lesson_location","");
      API.LMSCommit("");
      API.LMSFinish("");
    }catch(e){}
  }
  if(document.readyState==="complete")complete();
  else window.addEventListener("load",complete);
})();`

const EXPORT_CSS = `
:root{color:#e4e4e7;background:#18181b;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.55;}
body{max-width:48rem;margin:0 auto;padding:1.5rem;}
h1{font-size:1.35rem;font-weight:600;margin:0 0 1rem;}
h2{font-size:1.1rem;margin:1.25rem 0 0.5rem;}
h3{font-size:1rem;margin:0.75rem 0 0.35rem;}
p{margin:0.5rem 0;}
ul{margin:0.35rem 0;padding-left:1.25rem;}
pre,code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.88rem;}
.code-block{border:1px solid #3f3f46;border-radius:0.5rem;margin:0.75rem 0;overflow:hidden;}
.code-lang{background:#27272a;padding:0.35rem 0.75rem;font-size:0.7rem;color:#a1a1aa;}
pre{margin:0;padding:0.75rem;overflow:auto;background:#27272a;}
.callout{border-radius:0.5rem;padding:0.75rem 1rem;margin:0.75rem 0;}
.callout-label{font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.35rem;}
.callout-objective{border:1px solid rgba(139,92,246,0.35);background:rgba(139,92,246,0.08);}
.callout-apply{border:1px solid rgba(6,182,212,0.3);background:rgba(6,182,212,0.06);}
.callout-concept{border:1px solid rgba(255,255,255,0.1);background:rgba(39,39,42,0.6);}
.lesson-open,.lesson-close,.side-card{border-radius:0.5rem;padding:0.75rem 1rem;margin:0.75rem 0;}
.lesson-open{border:1px solid rgba(139,92,246,0.25);background:rgba(139,92,246,0.1);}
.lesson-close{border:1px solid rgba(34,211,238,0.35);background:rgba(34,211,238,0.08);}
.side-card{border:1px solid #3f3f46;background:#27272a;}
.lbl{font-size:0.65rem;font-weight:600;text-transform:uppercase;margin-bottom:0.35rem;color:#a1a1aa;}
.sec{margin:1rem 0;}
.sec-img img{max-width:100%;height:auto;border-radius:0.5rem;}
.ix-aspect{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.5rem;}
.ix-aspect iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
video{max-width:100%;border-radius:0.5rem;}
details.ix-expandable{border:1px solid #3f3f46;border-radius:0.5rem;padding:0.5rem 0.75rem;margin:0.75rem 0;}
.ix-quiz{border:1px solid #3f3f46;border-radius:0.5rem;padding:0.75rem;margin:0.75rem 0;}
.ix-note{font-size:0.8rem;color:#a1a1aa;}
table.ix-cards{width:100%;border-collapse:collapse;font-size:0.9rem;}
table.ix-cards th,table.ix-cards td{border:1px solid #3f3f46;padding:0.35rem 0.5rem;}
.empty{color:#a1a1aa;}
`

export function buildNativeScoHtml(params: {
  courseTitle: string
  moduleTitle: string
  moduleContent: unknown
}): string {
  const inner = moduleContentJsonToExportHtmlFragment(params.moduleContent, params.moduleTitle)
  const title = escapeHtml(params.moduleTitle)
  const ct = escapeHtml(params.courseTitle)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>${EXPORT_CSS}</style>
<script>${SCORM_COMPLETE_SCRIPT}</script>
</head>
<body>
<header><p style="font-size:0.75rem;color:#a1a1aa;margin:0 0 0.25rem;">${ct}</p><h1>${title}</h1></header>
<main>
${inner}
</main>
</body>
</html>`
}
