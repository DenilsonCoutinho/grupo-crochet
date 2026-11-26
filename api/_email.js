import nodemailer from "nodemailer";

function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export async function enviarConvite({ email, nome, link }) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;
  const port = Number(process.env.SMTP_PORT ?? "465");
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !EMAIL_FROM) throw new Error("SMTP não configurado.");
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
  const primeiro = nome?.trim().split(/\s+/)[0];
  const oi = primeiro ? `Oi, ${escapeHtml(primeiro)}!` : "Oi!";
  const sans = "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  return transport.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Seu link de entrada no Grupo VIP de Crocheteiras 🧶",
    text: `${primeiro ? `Oi, ${primeiro}!` : "Oi!"}\n\nSeu pagamento foi aprovado. Abra o link abaixo e toque em "Entrar no grupo":\n\n${link}\n\nImportante: esse link é só seu e o botão funciona uma única vez. Depois de tocar, peça para entrar no grupo e aguarde a aprovação.\n\nTe espero lá! 💛`,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f3e7db;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3e7db;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fbf5ea;border-radius:24px;padding:32px 28px;">
<tr><td style="font-family:${sans};font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#005f46;">Pagamento aprovado 🧶</td></tr>
<tr><td style="padding-top:8px;font-family:${sans};font-size:26px;font-weight:800;color:#292524;line-height:32px;">${oi} Seu lugar no grupo está garantido</td></tr>
<tr><td style="padding-top:12px;font-family:${sans};font-size:16px;line-height:24px;color:#57534d;">Toque no botão para abrir sua página de entrada no <strong>Grupo VIP de Crocheteiras</strong>.</td></tr>
<tr><td style="padding-top:24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background:#1d8a3e;">
<a href="${link}" style="display:block;padding:17px 24px;font-family:${sans};font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">Abrir minha entrada</a>
</td></tr></table></td></tr>
<tr><td style="padding-top:20px;"><div style="font-family:${sans};font-size:14px;line-height:21px;color:#57534d;background:#f0e6da;border-radius:16px;padding:16px 18px;"><strong>Importante:</strong> esse link é só seu e o botão funciona <strong>uma única vez</strong>. Depois de tocar, peça para entrar no grupo e aguarde a aprovação.</div></td></tr>
<tr><td style="padding-top:22px;font-family:${sans};font-size:13px;color:#79716b;text-align:center;">Te espero lá! 💛</td></tr>
</table></td></tr></table></body></html>`,
  });
}
