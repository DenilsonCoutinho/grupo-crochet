import { randomBytes } from "node:crypto";
import { garantirTabela, siteUrl, sql } from "./_db.js";
import { enviarConvite } from "./_email.js";

// Webhook da Kiwify (produto Grupo VIP): compra aprovada cria o convite com um código único e manda por e-mail.
// Reembolso/chargeback cancela o convite. URL: https://SEU-SITE/api/kiwify?token=<KIWIFY_TOKEN>
const APROVADO = new Set(["paid", "approved", "complete", "completed"]);
const ESTORNADO = new Set(["refunded", "chargedback", "chargeback", "cancelled", "canceled"]);

function novoCodigo() {
  const alfabeto = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(12), (b) => alfabeto[b % alfabeto.length]).join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const token = process.env.KIWIFY_TOKEN;
  if (!token || (req.query.token ?? req.headers["x-webhook-secret"]) !== token) return res.status(401).json({ error: "Não autorizado" });

  const ev = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const produto = String(ev.Product?.product_id ?? ev.product_id ?? "");
  const produtoGrupo = process.env.KIWIFY_PRODUCT_ID ?? "e42cab00-e989-11f1-ac70-17fc6be06014";
  if (produto && produto !== produtoGrupo) return res.status(200).json({ ok: true, ignorado: "produto" });

  const status = String(ev.order_status ?? ev.status ?? "").toLowerCase();
  const pedido = String(ev.order_id ?? ev.transaction_id ?? "");
  const email = String(ev.Customer?.email ?? ev.customer?.email ?? "").toLowerCase().trim();
  const nome = ev.Customer?.full_name ?? ev.customer?.name ?? null;
  if (!pedido || !email) return res.status(400).json({ error: "Evento sem pedido ou e-mail" });

  const db = sql();
  await garantirTabela(db);

  if (ESTORNADO.has(status)) {
    await db`UPDATE convites_grupo SET status = 'estornado', atualizado_em = now() WHERE pedido = ${pedido}`;
    return res.status(200).json({ ok: true, convite: "cancelado" });
  }
  if (!APROVADO.has(status)) return res.status(200).json({ ok: true, ignorado: "status", status });

  const codigo = novoCodigo();
  const criado = await db`INSERT INTO convites_grupo (id, pedido, email, nome, status) VALUES (${codigo}, ${pedido}, ${email}, ${nome}, 'pago')
    ON CONFLICT (pedido) DO NOTHING RETURNING id`;
  if (!criado.length) return res.status(200).json({ ok: true, convite: "já existia" });

  try {
    await enviarConvite({ email, nome, link: `${siteUrl()}/entrar/${codigo}` });
  } catch (error) {
    console.error("Falha ao enviar convite", error);
    return res.status(200).json({ ok: true, convite: "criado", email: "falhou" });
  }
  return res.status(200).json({ ok: true, convite: "enviado" });
}
