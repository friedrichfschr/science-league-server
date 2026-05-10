const { asyncHandler } = require('../../lib/async-handler');
const { registerSchema, loginSchema, tokenQuerySchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.schemas');
const { authService } = require('./auth.service');
const { config } = require('../../config');

function verifySuccessHtml() {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><title>Konto bestätigt</title></head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:60px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
    <tr><td style="background:linear-gradient(135deg,#1c1917,#064e3b);padding:32px 40px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#6ee7b7;">FoodConnectMarkt</p>
      <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#fff;">Konto aktiviert ✓</h1>
    </td></tr>
    <tr><td style="padding:40px;text-align:center;">
      <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">Dein Konto wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.</p>
      <a href="${config.frontendUrl}" style="display:inline-block;margin-top:24px;background:#065f46;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">Zur App →</a>
    </td></tr>
  </table>
</body></html>`;
}

const authController = {
  register: asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);
    res.status(201).json({
      message: 'Konto erstellt. Bitte bestätige deine E-Mail-Adresse.',
      user,
    });
  }),

  verify: asyncHandler(async (req, res) => {
    const { token } = tokenQuerySchema.parse(req.query);
    await authService.verifyEmail(token);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(verifySuccessHtml());
  }),

  login: asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  }),

  logout: asyncHandler(async (_req, res) => {
    // JWT is stateless — client discards the token.
    res.json({ message: 'Erfolgreich abgemeldet.' });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
  }),

  deleteAccount: asyncHandler(async (req, res) => {
    await authService.deleteAccount(req.user.id);
    res.status(204).end();
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    // Always 200 — don't reveal whether account exists
    res.json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.' });
  }),

  // GET /api/auth/reset-password?token=... → render HTML form
  resetPasswordForm: asyncHandler(async (req, res) => {
    const { token } = tokenQuerySchema.parse(req.query);
    const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Passwort zurücksetzen</title>
<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:420px;margin:60px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)}
.hd{background:linear-gradient(135deg,#1c1917,#064e3b);padding:28px 36px}
.hd p{margin:0;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#6ee7b7}
.hd h1{margin:10px 0 0;font-size:22px;font-weight:700;color:#fff}
.bd{padding:32px 36px}
label{display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:6px}
input{width:100%;padding:11px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;outline:none;margin-bottom:16px;font-family:inherit}
input:focus{border-color:#065f46;box-shadow:0 0 0 3px rgba(6,95,70,.1)}
button{width:100%;background:#065f46;color:#fff;border:none;border-radius:999px;padding:13px;font-size:14px;font-weight:600;cursor:pointer}
button:hover{background:#047857}
.msg{margin-top:14px;padding:11px 14px;border-radius:10px;font-size:13px;display:none}
.msg.ok{background:#d1fae5;color:#065f46}.msg.err{background:#fee2e2;color:#dc2626}
</style></head>
<body><div class="wrap">
  <div class="hd"><p>FoodConnectMarkt</p><h1>Neues Passwort vergeben</h1></div>
  <div class="bd">
    <form id="form">
      <label>Neues Passwort</label>
      <input type="password" id="pw" minlength="8" placeholder="Mind. 8 Zeichen" required autocomplete="new-password"/>
      <label>Passwort bestätigen</label>
      <input type="password" id="pw2" minlength="8" placeholder="Wiederholen" required autocomplete="new-password"/>
      <button type="submit">Passwort speichern</button>
    </form>
    <div id="msg" class="msg"></div>
  </div>
</div>
<script>
  document.getElementById('form').addEventListener('submit',async function(e){
    e.preventDefault();
    const pw=document.getElementById('pw').value,pw2=document.getElementById('pw2').value;
    const msg=document.getElementById('msg');
    if(pw!==pw2){show('err','Die Passwörter stimmen nicht überein.');return;}
    const btn=this.querySelector('button');btn.disabled=true;btn.textContent='Wird gespeichert…';
    try{
      const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'${token}',password:pw})});
      const d=await r.json();
      if(r.ok){this.style.display='none';show('ok','Passwort gespeichert! Du kannst dich jetzt einloggen.');}
      else{show('err',d.message||'Fehler.');btn.disabled=false;btn.textContent='Passwort speichern';}
    }catch(err){show('err','Netzwerkfehler.');btn.disabled=false;btn.textContent='Passwort speichern';}
  });
  function show(t,m){const el=document.getElementById('msg');el.className='msg '+t;el.textContent=m;el.style.display='block';}
</script>
</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }),

  // POST /api/auth/reset-password { token, password }
  resetPassword: asyncHandler(async (req, res) => {
    const data = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(data);
    res.json({ message: 'Passwort erfolgreich zurückgesetzt.' });
  }),
};

module.exports = { authController };
