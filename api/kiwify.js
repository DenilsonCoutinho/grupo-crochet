import { garantirTabela, sql } from "./_db.js";

// Webhook da Kiwify: registra compras aprovadas do Grupo VIP e marca reembolsos/chargebacks.
// Configure na Kiwify a URL https://SEU-SITE/api/kiwify?token=<KIWIFY_TOKEN>.
const APROVADO = new Set(["paid", "approved", "complete", "completed"]);
const ESTORNADO = new Set(["refunded", "chargedback", "chargeback", "cancelled", "canceled"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const token = process.env.KIWIFY_TOKEN;
  if (!token || (req.query.token ?? req.headers["x-webhook-secret"]) !== token) return res.status(401).json({ error: "Não autorizado" });

  const ev = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const produto = String(ev.Product?.product_id ?? ev.product_id ?? "");
  const produtoGrupo = process.env.KIWIFY_PRODUCT_ID ?? "e42cab00-e989-11f1-ac70-17fc6be06014";
  if (produtoGrupo && produto && produto !== produtoGrupo) return res.status(200).json({ ok: true, ignorado: "produto" });

  const status = String(ev.order_status ?? ev.status ?? "").toLowerCase();
  const pedido = String(ev.order_id ?? ev.transaction_id ?? "");
  const email = String(ev.Customer?.email ?? ev.customer?.email ?? "").toLowerCase().trim();
  const nome = ev.Customer?.full_name ?? ev.customer?.name ?? null;
  if (!pedido || !email) return res.status(400).json({ error: "Evento sem pedido ou e-mail" });
  if (!APROVADO.has(status) && !ESTORNADO.has(status)) return res.status(200).json({ ok: true, ignorado: "status", status });

  const db = sql();
  await garantirTabela(db);
  const novoStatus = APROVADO.has(status) ? "pago" : "estornado";
  await db`INSERT INTO compras_grupo (pedido, email, nome, status) VALUES (${pedido}, ${email}, ${nome}, ${novoStatus})
    ON CONFLICT (pedido) DO UPDATE SET status = ${novoStatus}, email = ${email}, atualizado_em = now()`;
  return res.status(200).json({ ok: true, status: novoStatus });
}
