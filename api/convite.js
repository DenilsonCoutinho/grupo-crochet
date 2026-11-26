import { garantirTabela, grupoUrl, sql } from "./_db.js";

// GET  /api/convite?id=...  → estado do convite (para a página já abrir com o botão desativado se foi usado).
// POST /api/convite {id}    → usa o convite: marca como usado (uma vez só, de forma atômica) e devolve o link do grupo.
export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const id = String((req.method === "POST" ? body.id : req.query.id) ?? "").trim();
  if (!/^[a-z0-9]{8,32}$/.test(id)) return res.status(404).json({ estado: "invalido" });

  const db = sql();
  await garantirTabela(db);

  if (req.method === "POST") {
    const usado = await db`UPDATE convites_grupo SET usado_em = now(), atualizado_em = now()
      WHERE id = ${id} AND status = 'pago' AND usado_em IS NULL RETURNING id`;
    if (usado.length) return res.status(200).json({ estado: "liberado", url: grupoUrl() });
  } else if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET ou POST" });
  }

  const [c] = await db`SELECT nome, status, usado_em FROM convites_grupo WHERE id = ${id}`;
  if (!c) return res.status(404).json({ estado: "invalido" });
  const primeiroNome = c.nome?.trim().split(/\s+/)[0] ?? null;
  if (c.status !== "pago") return res.status(200).json({ estado: "estornado", nome: primeiroNome });
  if (c.usado_em) return res.status(200).json({ estado: "usado", nome: primeiroNome });
  return res.status(200).json({ estado: "disponivel", nome: primeiroNome });
}
