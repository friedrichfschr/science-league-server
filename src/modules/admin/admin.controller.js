const { asyncHandler } = require('../../lib/async-handler');
const { adminService } = require('./admin.service');

function adminPanelHtml() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Newsletter Admin</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#111827}
    .header{background:linear-gradient(135deg,#1c1917,#064e3b);padding:24px 40px}
    .header h1{margin:0;font-size:20px;font-weight:700;color:#fff}
    .header span{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6ee7b7}
    .main{max-width:1100px;margin:32px auto;padding:0 24px 64px}
    #login-section{max-width:400px;margin:80px auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    #login-section h2{margin:0 0 24px;font-size:18px}
    #login-section input{width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;margin-bottom:14px;outline:none}
    #login-error{color:#dc2626;font-size:13px;margin-bottom:10px;display:none}
    #panel-section{display:none}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px}
    .stat-card{background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .stat-card .label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:6px}
    .stat-card .value{font-size:28px;font-weight:700;color:#111827}
    .stat-card.confirmed .value{color:#065f46}
    .stat-card.pending .value{color:#b45309}
    .stat-card.unsub .value{color:#9ca3af}
    .card{background:#fff;border-radius:16px;padding:28px 32px;box-shadow:0 2px 12px rgba(0,0,0,.07);margin-bottom:28px}
    .card h2{margin:0 0 20px;font-size:16px;font-weight:600}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;border-bottom:2px solid #f3f4f6}
    td{padding:10px 12px;border-bottom:1px solid #f9fafb}
    tr:last-child td{border-bottom:none}
    .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600}
    .badge.confirmed{background:#d1fae5;color:#065f46}
    .badge.pending{background:#fef3c7;color:#92400e}
    .badge.unsubscribed{background:#f3f4f6;color:#6b7280}
    .search-bar{width:100%;padding:9px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;margin-bottom:16px;outline:none}
    label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px}
    input[type=text],textarea{width:100%;padding:9px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;font-family:inherit}
    textarea{min-height:160px;resize:vertical}
    .field{margin-bottom:16px}
    .hint{font-size:12px;color:#9ca3af;margin-top:4px}
    button{background:#065f46;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer}
    button:hover{background:#047857}
    button:disabled{background:#9ca3af;cursor:not-allowed}
    .btn-secondary{background:transparent;color:#065f46;border:1.5px solid #065f46}
    .btn-secondary:hover{background:#f0fdf4}
    .msg{padding:12px 16px;border-radius:8px;font-size:13px;margin-top:14px;display:none}
    .msg.success{background:#d1fae5;color:#065f46}
    .msg.error{background:#fee2e2;color:#dc2626}
    #reload-btn{float:right;font-size:12px;padding:6px 14px}
    .tabs{display:flex;gap:8px;margin-bottom:24px}
    .tab{padding:8px 18px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:1.5px solid #e5e7eb;background:#fff;color:#6b7280}
    .tab.active{background:#065f46;color:#fff;border-color:#065f46}
    .section{display:none}
    .section.active{display:block}
  </style>
</head>
<body>
<div class="header">
  <span>FoodConnectMarkt</span>
  <h1>Newsletter Admin</h1>
</div>
<div class="main">
  <div id="login-section">
    <h2>Anmelden</h2>
    <div id="login-error">Falsches Passwort.</div>
    <input type="password" id="password-input" placeholder="Admin-Passwort" autocomplete="current-password"/>
    <button id="login-btn" style="width:100%">Einloggen</button>
  </div>
  <div id="panel-section">
    <div class="stats">
      <div class="stat-card"><div class="label">Gesamt</div><div class="value" id="stat-total">—</div></div>
      <div class="stat-card confirmed"><div class="label">Bestätigt</div><div class="value" id="stat-confirmed">—</div></div>
      <div class="stat-card pending"><div class="label">Ausstehend</div><div class="value" id="stat-pending">—</div></div>
      <div class="stat-card unsub"><div class="label">Abgemeldet</div><div class="value" id="stat-unsub">—</div></div>
    </div>
    <div class="tabs">
      <button class="tab active" onclick="switchTab('subscribers')">Abonnenten</button>
      <button class="tab" onclick="switchTab('send')">Newsletter senden</button>
    </div>
    <div id="tab-subscribers" class="section active">
      <div class="card">
        <h2>Abonnenten <button id="reload-btn" class="btn-secondary" onclick="loadSubscribers()">↺ Aktualisieren</button></h2>
        <input class="search-bar" id="search" type="text" placeholder="Nach E-Mail suchen…" oninput="filterTable()"/>
        <table>
          <thead><tr><th>E-Mail</th><th>Status</th><th>Angemeldet</th><th>Bestätigt</th><th>Abgemeldet</th></tr></thead>
          <tbody id="subscribers-body"></tbody>
        </table>
        <p id="table-empty" style="display:none;color:#9ca3af;font-size:13px;margin:16px 0 0">Keine Einträge gefunden.</p>
      </div>
    </div>
    <div id="tab-send" class="section">
      <div class="card">
        <h2>Newsletter senden</h2>
        <p style="font-size:13px;color:#6b7280;margin:0 0 20px">Wird an alle <strong>bestätigten</strong> Abonnenten geschickt.</p>
        <div class="field"><label>Betreff</label><input type="text" id="subject" placeholder="z.B. Neuigkeiten vom FoodConnectMarkt"/></div>
        <div class="field"><label>Inhalt (HTML)</label><textarea id="body-html" placeholder="<p>Hallo,</p>"></textarea><p class="hint">Abmeldelink wird automatisch eingefügt.</p></div>
        <div class="field"><label>Inhalt (Plaintext)</label><textarea id="body-text" style="min-height:80px" placeholder="Hallo, …"></textarea></div>
        <button id="send-btn" onclick="sendNewsletter()">Newsletter absenden</button>
        <div id="send-msg" class="msg"></div>
      </div>
    </div>
  </div>
</div>
<script>
  let password='',allRows=[];
  document.getElementById('password-input').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
  document.getElementById('login-btn').addEventListener('click',login);
  async function login(){
    const btn=document.getElementById('login-btn');btn.disabled=true;
    password=document.getElementById('password-input').value;
    const ok=await loadSubscribers(true);
    if(ok){document.getElementById('login-section').style.display='none';document.getElementById('panel-section').style.display='block';}
    else{document.getElementById('login-error').style.display='block';}
    btn.disabled=false;
  }
  function switchTab(name){
    document.querySelectorAll('.tab').forEach((t,i)=>{const n=['subscribers','send'];t.classList.toggle('active',n[i]===name);});
    document.querySelectorAll('.section').forEach((s,i)=>{const n=['subscribers','send'];s.classList.toggle('active',n[i]===name);});
  }
  async function loadSubscribers(returnOk=false){
    try{
      const res=await fetch('/api/admin/subscribers',{headers:{'X-Admin-Password':password}});
      if(!res.ok)return returnOk?false:null;
      const data=await res.json();allRows=data.subscribers;renderTable(allRows);updateStats(allRows);return true;
    }catch{return returnOk?false:null;}
  }
  function updateStats(rows){
    document.getElementById('stat-total').textContent=rows.length;
    document.getElementById('stat-confirmed').textContent=rows.filter(r=>r.status==='confirmed').length;
    document.getElementById('stat-pending').textContent=rows.filter(r=>r.status==='pending').length;
    document.getElementById('stat-unsub').textContent=rows.filter(r=>r.status==='unsubscribed').length;
  }
  function renderTable(rows){
    const tbody=document.getElementById('subscribers-body'),empty=document.getElementById('table-empty');
    tbody.innerHTML='';if(!rows.length){empty.style.display='block';return;}empty.style.display='none';
    rows.forEach(r=>{const tr=document.createElement('tr');
      tr.innerHTML='<td>'+esc(r.email)+'</td><td><span class="badge '+r.status+'">'+esc(r.status)+'</span></td><td>'+fmt(r.subscribed_at)+'</td><td>'+fmt(r.confirmed_at)+'</td><td>'+fmt(r.unsubscribed_at)+'</td>';
      tbody.appendChild(tr);});
  }
  function filterTable(){const q=document.getElementById('search').value.toLowerCase();renderTable(q?allRows.filter(r=>r.email.toLowerCase().includes(q)):allRows);}
  async function sendNewsletter(){
    const subject=document.getElementById('subject').value.trim(),html=document.getElementById('body-html').value.trim(),text=document.getElementById('body-text').value.trim();
    const msgEl=document.getElementById('send-msg'),btn=document.getElementById('send-btn');
    if(!subject||!html||!text){showMsg(msgEl,'error','Bitte alle Felder ausfüllen.');return;}
    btn.disabled=true;showMsg(msgEl,'','');
    try{
      const res=await fetch('/api/admin/send',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Password':password},body:JSON.stringify({subject,html,text})});
      const data=await res.json();
      if(res.ok)showMsg(msgEl,'success','Gesendet an '+data.sent+' von '+data.total+' Abonnenten.'+(data.errors?.length?' '+data.errors.length+' Fehler.':''));
      else showMsg(msgEl,'error',data.message||'Fehler beim Senden.');
    }catch(err){showMsg(msgEl,'error','Netzwerkfehler: '+err.message);}
    btn.disabled=false;
  }
  function showMsg(el,type,text){el.className='msg'+(type?' '+type:'');el.textContent=text;el.style.display=text?'block':'none';}
  function fmt(iso){if(!iso)return '<span style="color:#d1d5db">—</span>';return new Date(iso).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'});}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
</script>
</body></html>`;
}

const adminController = {
  panel(_req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(adminPanelHtml());
  },

  listSubscribers: asyncHandler(async (_req, res) => {
    const subscribers = await adminService.listSubscribers();
    res.json({ subscribers });
  }),

  sendBroadcast: asyncHandler(async (req, res) => {
    const { subject, html, text } = req.body || {};
    if (!subject || !html || !text) {
      return res.status(400).json({ message: 'subject, html, and text are required.' });
    }
    const result = await adminService.sendBroadcast({ subject, html, text });
    res.json(result);
  }),
};

module.exports = { adminController };
