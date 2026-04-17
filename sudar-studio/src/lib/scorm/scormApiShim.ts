// ---------------------------------------------------------------------------
// SCORM 1.2 API shim — injected into every SCO launch HTML file before upload.
// The SCO (or its frameset) calls window.API.LMSInitialize etc.; this shim
// satisfies those calls and relays tracking data to the parent frame via
// postMessage so CourseViewer can auto-complete the module on finish.
// ---------------------------------------------------------------------------
export const SCORM_API_SHIM = `<script id="sudar-scorm-shim">(function(){
  var d={};
  function post(m){try{window.parent.postMessage(m,'*');}catch(e){}}
  var API={
    LMSInitialize:function(s){post({type:'scorm_initialize'});return'true';},
    LMSFinish:function(s){
      post({type:'scorm_finish',lesson_status:d['cmi.core.lesson_status']||'completed',data:d});
      return'true';
    },
    LMSGetValue:function(n){return d[n]||'';},
    LMSSetValue:function(n,v){
      d[n]=v;
      post({type:'scorm_set_value',name:n,value:v});
      if(n==='cmi.core.lesson_status'&&(v==='completed'||v==='passed'||v==='failed')){
        post({type:'scorm_finish',lesson_status:v,data:d});
      }
      return'true';
    },
    LMSCommit:function(s){return'true';},
    LMSGetLastError:function(){return'0';},
    LMSGetErrorString:function(n){return'';},
    LMSGetDiagnostic:function(n){return'';}
  };
  window.API=API;
  try{if(window.parent&&window.parent!==window)window.parent.API=API;}catch(e){}
  try{if(window.top&&window.top!==window)window.top.API=API;}catch(e){}
})();</script>`

export function injectScormShim(html: string): string {
  if (html.includes('id="sudar-scorm-shim"')) return html
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/(<head[^>]*>)/i, `$1\n${SCORM_API_SHIM}`)
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/(<html[^>]*>)/i, `$1\n<head>${SCORM_API_SHIM}</head>`)
  }
  return SCORM_API_SHIM + html
}
