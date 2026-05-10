const { asyncHandler } = require('../../lib/async-handler');
const { adminService } = require('./admin.service');

// ── Separate JS file served at GET /admin-script.js ───────────────────────────
// Avoids inline-script CSP violations entirely — script-src 'self' allows it.
function adminScriptJs() {
  return `
'use strict';
let pw = '', allUsers = [], allSubs = [], allOrders = [];
const fmt = iso => iso ? new Date(iso).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'}) : '<span style="color:#d1d5db">—</span>';
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const money = n => Number(n).toLocaleString('de-DE',{style:'currency',currency:'EUR'});

function toast(msg, ok=true) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show';
  el.style.background = ok ? '#065f46' : '#dc2626';
  setTimeout(() => el.className = 'toast', 2200);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
document.getElementById('password-input').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
document.getElementById('login-btn').addEventListener('click', login);

async function login() {
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'Pruefe…';
  pw = document.getElementById('password-input').value;
  const [ok] = await Promise.all([loadUsers(true), loadSubscribers(true), loadOrders(true)]);
  if (ok) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('panel-section').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'inline-block';
  } else {
    document.getElementById('login-error').style.display = 'block';
    btn.disabled = false; btn.textContent = 'Einloggen';
  }
}

function logout() {
  pw = '';
  document.getElementById('panel-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('password-input').value = '';
  document.getElementById('login-error').style.display = 'none';
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['users','subscribers','orders','send'];
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', TABS[i] === name));
  document.querySelectorAll('.section').forEach((s,i) => s.classList.toggle('active', TABS[i] === name));
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('s-users').textContent = allUsers.length;
  document.getElementById('s-verified').textContent = allUsers.filter(u => u.email_verified).length;
  document.getElementById('s-unverified').textContent = allUsers.filter(u => !u.email_verified).length;
  document.getElementById('s-subs').textContent = allSubs.length;
  document.getElementById('s-confirmed').textContent = allSubs.filter(s => s.status === 'confirmed').length;
  document.getElementById('s-pending').textContent = allSubs.filter(s => s.status === 'pending').length;
  document.getElementById('s-unsub').textContent = allSubs.filter(s => s.status === 'unsubscribed').length;
  document.getElementById('s-orders').textContent = allOrders.length;
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function loadUsers(returnOk=false) {
  try {
    const r = await fetch('/api/admin/users', { headers: { 'X-Admin-Password': pw } });
    if (!r.ok) return returnOk ? false : null;
    const d = await r.json(); allUsers = d.users; renderUsers(allUsers); updateStats(); return true;
  } catch { return returnOk ? false : null; }
}

function renderUsers(rows) {
  const tbody = document.getElementById('users-body');
  const empty = document.getElementById('users-empty');
  tbody.innerHTML = '';
  if (!rows.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  rows.forEach(u => {
    const tr = document.createElement('tr');
    const roleSelect = document.createElement('select');
    roleSelect.className = 'role-select';
    roleSelect.dataset.uid = u.id;
    ['user','moderator','admin'].forEach(r => {
      const opt = document.createElement('option');
      opt.value = r; opt.textContent = r;
      if (u.role === r) opt.selected = true;
      roleSelect.appendChild(opt);
    });
    roleSelect.addEventListener('change', () => setRole(roleSelect));

    const verifiedBadge = u.email_verified
      ? '<span class="badge verified">✓ Verifiziert</span>'
      : '<span class="badge unverified">✗ Ausstehend</span>';

    tr.innerHTML =
      '<td><strong>' + esc(u.username) + '</strong></td>' +
      '<td>' + esc(u.email) + '</td>' +
      '<td><span class="badge ' + esc(u.role) + '">' + esc(u.role) + '</span></td>' +
      '<td>' + verifiedBadge + '</td>' +
      '<td>' + fmt(u.created_at) + '</td>' +
      '<td></td>';
    tr.lastElementChild.appendChild(roleSelect);
    tbody.appendChild(tr);
  });
}

function filterUsers() {
  const q = document.getElementById('user-search').value.toLowerCase();
  renderUsers(q ? allUsers.filter(u => (u.email + u.username).toLowerCase().includes(q)) : allUsers);
}

async function setRole(sel) {
  const uid = sel.dataset.uid, role = sel.value;
  sel.disabled = true;
  try {
    const r = await fetch('/api/admin/users/' + uid + '/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pw },
      body: JSON.stringify({ role }),
    });
    if (r.ok) {
      toast('Rolle auf "' + role + '" gesetzt.');
      const u = allUsers.find(x => x.id === uid);
      if (u) u.role = role;
      filterUsers();
      updateStats();
    } else {
      const d = await r.json(); toast(d.message || 'Fehler', false);
      const u = allUsers.find(x => x.id === uid);
      if (u) sel.value = u.role;
    }
  } catch { toast('Netzwerkfehler', false); }
  sel.disabled = false;
}

// ── Subscribers ───────────────────────────────────────────────────────────────
async function loadSubscribers(returnOk=false) {
  try {
    const r = await fetch('/api/admin/subscribers', { headers: { 'X-Admin-Password': pw } });
    if (!r.ok) return returnOk ? false : null;
    const d = await r.json(); allSubs = d.subscribers; renderSubs(allSubs); updateStats(); return true;
  } catch { return returnOk ? false : null; }
}

function renderSubs(rows) {
  const tbody = document.getElementById('subscribers-body');
  const empty = document.getElementById('subs-empty');
  tbody.innerHTML = '';
  if (!rows.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc(r.email) + '</td>' +
      '<td><span class="badge ' + esc(r.status) + '">' + esc(r.status) + '</span></td>' +
      '<td>' + fmt(r.subscribed_at) + '</td>' +
      '<td>' + fmt(r.confirmed_at) + '</td>' +
      '<td>' + fmt(r.unsubscribed_at) + '</td>';
    tbody.appendChild(tr);
  });
}

function filterSubs() {
  const q = document.getElementById('sub-search').value.toLowerCase();
  renderSubs(q ? allSubs.filter(r => r.email.toLowerCase().includes(q)) : allSubs);
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function loadOrders(returnOk=false) {
  try {
    const r = await fetch('/api/admin/orders', { headers: { 'X-Admin-Password': pw } });
    if (!r.ok) return returnOk ? false : null;
    const d = await r.json(); allOrders = d.orders; renderOrders(allOrders); updateStats(); return true;
  } catch { return returnOk ? false : null; }
}

function renderOrders(rows) {
  const tbody = document.getElementById('orders-body');
  const empty = document.getElementById('orders-empty');
  tbody.innerHTML = '';
  if (!rows.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  rows.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    const summary = items.map(i => esc(i.name) + ' \xd7' + i.quantity).join(', ');
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="font-family:monospace;font-size:11px;color:#9ca3af">' + esc(o.id.slice(0,8)) + '…</td>' +
      '<td><strong>' + esc(o.user_username) + '</strong><br><span style="font-size:11px;color:#9ca3af">' + esc(o.user_email) + '</span></td>' +
      '<td class="order-items">' + summary + '</td>' +
      '<td style="font-weight:700;white-space:nowrap">' + money(o.total) + '</td>' +
      '<td><span class="badge confirmed">' + esc(o.status) + '</span></td>' +
      '<td style="white-space:nowrap">' + fmt(o.created_at) + '</td>';
    tbody.appendChild(tr);
  });
}

function filterOrders() {
  const q = document.getElementById('order-search').value.toLowerCase();
  renderOrders(q ? allOrders.filter(o =>
    (o.id + o.user_email + o.user_username).toLowerCase().includes(q)
  ) : allOrders);
}

// ── Newsletter send ───────────────────────────────────────────────────────────
async function sendNewsletter() {
  const subject = document.getElementById('subject').value.trim();
  const html    = document.getElementById('body-html').value.trim();
  const text    = document.getElementById('body-text').value.trim();
  const msgEl   = document.getElementById('send-msg');
  const btn     = document.getElementById('send-btn');
  if (!subject || !html || !text) { showMsg(msgEl,'err','Bitte alle Felder ausf\xfcllen.'); return; }
  btn.disabled = true;
  try {
    const r = await fetch('/api/admin/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pw },
      body: JSON.stringify({ subject, html, text }),
    });
    const d = await r.json();
    if (r.ok) showMsg(msgEl,'ok','Gesendet an ' + d.sent + ' von ' + d.total + ' Abonnenten.' + (d.errors && d.errors.length ? ' ' + d.errors.length + ' Fehler.' : ''));
    else showMsg(msgEl,'err', d.message || 'Fehler beim Senden.');
  } catch(err) { showMsg(msgEl,'err','Netzwerkfehler: ' + err.message); }
  btn.disabled = false;
}

function showMsg(el, type, text) {
  el.className = 'msg' + (type ? ' ' + type : '');
  el.textContent = text; el.style.display = text ? 'block' : 'none';
}

// ── Event delegation for tab buttons & search inputs ─────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-tab]');
  if (btn) switchTab(btn.dataset.tab);
  if (e.target.id === 'logout-btn') logout();
  if (e.target.id === 'reload-users') loadUsers();
  if (e.target.id === 'reload-subs') loadSubscribers();
  if (e.target.id === 'reload-orders') loadOrders();
  if (e.target.id === 'send-btn') sendNewsletter();
});
document.addEventListener('input', e => {
  if (e.target.id === 'user-search') filterUsers();
  if (e.target.id === 'sub-search') filterSubs();
  if (e.target.id === 'order-search') filterOrders();
});
`;
}

function adminPanelHtml() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Admin – FoodConnectMarkt</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#111827}
    .header{background:linear-gradient(135deg,#1c1917,#064e3b);padding:20px 32px;display:flex;align-items:center;justify-content:space-between}
    .header-left span{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6ee7b7}
    .header-left h1{margin:4px 0 0;font-size:18px;font-weight:700;color:#fff}
    #logout-btn{font-size:13px;color:#6ee7b7;cursor:pointer;border:1px solid rgba(110,231,183,.3);padding:6px 14px;border-radius:999px;background:none;display:none}
    #logout-btn:hover{background:rgba(110,231,183,.1)}
    .main{max-width:1200px;margin:32px auto;padding:0 24px 64px}
    #login-section{max-width:400px;margin:80px auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    #login-section h2{margin:0 0 6px;font-size:18px;font-weight:700}
    #login-section p{margin:0 0 24px;font-size:13px;color:#6b7280}
    #login-error{color:#dc2626;font-size:13px;margin-bottom:12px;display:none;background:#fee2e2;padding:8px 12px;border-radius:8px}
    #pw-input{width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;margin-bottom:14px;outline:none;font-family:inherit}
    #pw-input:focus{border-color:#065f46;box-shadow:0 0 0 3px rgba(6,95,70,.08)}
    #panel-section{display:none}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:28px}
    .stat-card{background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .stat-card .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px}
    .stat-card .val{font-size:26px;font-weight:700;color:#111}
    .stat-card.green .val{color:#065f46}.stat-card.amber .val{color:#b45309}
    .stat-card.gray .val{color:#9ca3af}.stat-card.blue .val{color:#1d4ed8}
    .card{background:#fff;border-radius:16px;padding:24px 28px;box-shadow:0 2px 12px rgba(0,0,0,.07);margin-bottom:24px}
    .card-title{margin:0 0 18px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:24px}
    .tab{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid #e5e7eb;background:#fff;color:#6b7280;transition:.15s}
    .tab:hover{background:#f9fafb}.tab.active{background:#065f46;color:#fff;border-color:#065f46}
    .section{display:none}.section.active{display:block}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:8px 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;border-bottom:2px solid #f3f4f6;white-space:nowrap}
    td{padding:9px 10px;border-bottom:1px solid #f9fafb;vertical-align:middle}
    tr:last-child td{border-bottom:none}tr:hover td{background:#fafaf9}
    .empty{color:#9ca3af;font-size:13px;padding:20px 0;display:none}
    .badge{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
    .badge.confirmed,.badge.admin{background:#d1fae5;color:#065f46}
    .badge.pending,.badge.moderator{background:#fef3c7;color:#92400e}
    .badge.unsubscribed,.badge.unverified{background:#f3f4f6;color:#6b7280}
    .badge.user{background:#eff6ff;color:#1d4ed8}.badge.verified{background:#d1fae5;color:#065f46}
    .search{width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;margin-bottom:14px;outline:none;font-family:inherit}
    .search:focus{border-color:#065f46;box-shadow:0 0 0 3px rgba(6,95,70,.08)}
    label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px}
    input[type=text],textarea{width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;font-family:inherit}
    input[type=text]:focus,textarea:focus{border-color:#065f46;box-shadow:0 0 0 3px rgba(6,95,70,.08)}
    textarea{min-height:140px;resize:vertical}
    .field{margin-bottom:14px}.hint{font-size:11px;color:#9ca3af;margin-top:3px}
    button{background:#065f46;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s}
    button:hover{background:#047857}button:disabled{background:#9ca3af;cursor:not-allowed}
    .btn-sm{padding:4px 10px;font-size:11px;border-radius:6px}
    .btn-outline{background:transparent;color:#065f46;border:1.5px solid #065f46}
    .btn-outline:hover{background:#f0fdf4}
    .btn-full{width:100%;border-radius:999px;padding:11px}
    select.role-select{font-size:12px;padding:3px 6px;border:1px solid #d1d5db;border-radius:6px;background:#fff;outline:none;cursor:pointer}
    select.role-select:focus{border-color:#065f46}
    .msg{padding:10px 14px;border-radius:8px;font-size:13px;margin-top:12px;display:none}
    .msg.ok{background:#d1fae5;color:#065f46}.msg.err{background:#fee2e2;color:#dc2626}
    .order-items{font-size:12px;color:#6b7280;max-width:260px}
    .toast{position:fixed;bottom:24px;right:24px;background:#1c1917;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;opacity:0;transform:translateY(8px);transition:.25s;pointer-events:none;z-index:999}
    .toast.show{opacity:1;transform:translateY(0)}
  </style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <span>FoodConnectMarkt</span>
    <h1>Admin Panel</h1>
  </div>
  <button id="logout-btn">Abmelden</button>
</div>
<div class="main">
  <div id="login-section">
    <h2>Admin-Anmeldung</h2>
    <p>Gib dein Admin-Passwort ein, um fortzufahren.</p>
    <div id="login-error">Falsches Passwort.</div>
    <input type="password" id="password-input" placeholder="Admin-Passwort" autocomplete="current-password"/>
    <button id="login-btn" class="btn-full" style="border-radius:999px;padding:11px">Einloggen</button>
  </div>

  <div id="panel-section">
    <div class="stats">
      <div class="stat-card"><div class="lbl">Nutzer</div><div class="val" id="s-users">—</div></div>
      <div class="stat-card green"><div class="lbl">Verifiziert</div><div class="val" id="s-verified">—</div></div>
      <div class="stat-card amber"><div class="lbl">Unverif.</div><div class="val" id="s-unverified">—</div></div>
      <div class="stat-card"><div class="lbl">Abonnenten</div><div class="val" id="s-subs">—</div></div>
      <div class="stat-card green"><div class="lbl">Best\xe4tigt</div><div class="val" id="s-confirmed">—</div></div>
      <div class="stat-card amber"><div class="lbl">Ausstehend</div><div class="val" id="s-pending">—</div></div>
      <div class="stat-card gray"><div class="lbl">Abgemeldet</div><div class="val" id="s-unsub">—</div></div>
      <div class="stat-card blue"><div class="lbl">Bestellungen</div><div class="val" id="s-orders">—</div></div>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="users">👥 Benutzer</button>
      <button class="tab" data-tab="subscribers">📧 Newsletter</button>
      <button class="tab" data-tab="orders">🛒 Bestellungen</button>
      <button class="tab" data-tab="send">📨 Newsletter senden</button>
    </div>

    <div id="tab-users" class="section active">
      <div class="card">
        <div class="card-title">Benutzer <button id="reload-users" class="btn-sm btn-outline">↺ Aktualisieren</button></div>
        <input class="search" id="user-search" type="text" placeholder="Nach E-Mail oder Benutzername suchen…"/>
        <table>
          <thead><tr><th>Benutzername</th><th>E-Mail</th><th>Rolle</th><th>E-Mail verifiziert</th><th>Registriert</th><th>Rolle \xe4ndern</th></tr></thead>
          <tbody id="users-body"></tbody>
        </table>
        <p class="empty" id="users-empty">Keine Benutzer gefunden.</p>
      </div>
    </div>

    <div id="tab-subscribers" class="section">
      <div class="card">
        <div class="card-title">Newsletter-Abonnenten <button id="reload-subs" class="btn-sm btn-outline">↺ Aktualisieren</button></div>
        <input class="search" id="sub-search" type="text" placeholder="Nach E-Mail suchen…"/>
        <table>
          <thead><tr><th>E-Mail</th><th>Status</th><th>Angemeldet</th><th>Best\xe4tigt</th><th>Abgemeldet</th></tr></thead>
          <tbody id="subscribers-body"></tbody>
        </table>
        <p class="empty" id="subs-empty">Keine Abonnenten gefunden.</p>
      </div>
    </div>

    <div id="tab-orders" class="section">
      <div class="card">
        <div class="card-title">Bestellungen <button id="reload-orders" class="btn-sm btn-outline">↺ Aktualisieren</button></div>
        <input class="search" id="order-search" type="text" placeholder="Nach Benutzer oder Bestell-ID suchen…"/>
        <table>
          <thead><tr><th>ID</th><th>Benutzer</th><th>Artikel</th><th>Gesamt</th><th>Status</th><th>Datum</th></tr></thead>
          <tbody id="orders-body"></tbody>
        </table>
        <p class="empty" id="orders-empty">Keine Bestellungen gefunden.</p>
      </div>
    </div>

    <div id="tab-send" class="section">
      <div class="card">
        <div class="card-title">Newsletter senden</div>
        <p style="font-size:13px;color:#6b7280;margin:0 0 18px">Wird an alle <strong>best\xe4tigten</strong> Abonnenten geschickt.</p>
        <div class="field"><label>Betreff</label><input type="text" id="subject" placeholder="z.B. Neuigkeiten vom FoodConnectMarkt"/></div>
        <div class="field"><label>Inhalt (HTML)</label><textarea id="body-html" placeholder="&lt;p&gt;Hallo,&lt;/p&gt;"></textarea><p class="hint">Abmeldelink wird automatisch eingef\xfcgt.</p></div>
        <div class="field"><label>Inhalt (Plaintext)</label><textarea id="body-text" style="min-height:80px" placeholder="Hallo, …"></textarea></div>
        <button id="send-btn" class="btn-full">Newsletter absenden</button>
        <div id="send-msg" class="msg"></div>
      </div>
    </div>
  </div>
</div>

<div id="toast" class="toast"></div>
<script src="/admin-script.js"></script>
</body>
</html>`;
}

const adminController = {
  panel(_req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(adminPanelHtml());
  },

  script(_req, res) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(adminScriptJs());
  },

  listSubscribers: asyncHandler(async (_req, res) => {
    const subscribers = await adminService.listSubscribers();
    res.json({ subscribers });
  }),

  listUsers: asyncHandler(async (_req, res) => {
    const users = await adminService.listUsers();
    res.json({ users });
  }),

  setUserRole: asyncHandler(async (req, res) => {
    const { role } = req.body || {};
    const { id } = req.params;
    const result = await adminService.setUserRole({ userId: id, role });
    res.json(result);
  }),

  listOrders: asyncHandler(async (_req, res) => {
    const orders = await adminService.listOrders();
    res.json({ orders });
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
