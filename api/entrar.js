import { garantirTabela, sql } from "./_db.js";

// A compradora informa o e-mail da compra. Se houver uma compra paga e ainda não usada,
// ela é marcada como usada (de forma atômica) e a pessoa recebe o link do grupo. Uma vez só.
const GRUPO = () => process.env.WHATSAPP_GROUP_URL ?? "https://chat.whatsapp.com/I9i6HlJXOV6FVZ2gfjZsX4";

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const email = String(body.email ?? "").toLowerCase().trim();
  if (!email || !email.includes("@")) return res.status(400).json({ motivo: "email", mensagem: "Digite o e-mail que você usou na compra." });

  const db = sql();
  await garantirTabela(db);
  const usada = await db`UPDATE compras_grupo SET usado_em = now(), atualizado_em = now()
    WHERE pedido = (SELECT pedido FROM compras_grupo WHERE lower(email) = ${email} AND status = 'pago' AND usado_em IS NULL ORDER BY criado_em LIMIT 1)
      AND usado_em IS NULL
    RETURNING pedido`;
  if (usada.length) return res.status(200).json({ url: GRUPO() });

  const compras = await db`SELECT status, usado_em FROM compras_grupo WHERE lower(email) = ${email}`;
  if (!compras.length) return res.status(404).json({ motivo: "nao_encontrado", mensagem: "Não achamos compra com esse e-mail. Confira se digitou igual ao da compra. Se acabou de pagar, espere 1 minuto e tente de novo." });
  if (compras.some((c) => c.status === "pago")) return res.status(410).json({ motivo: "usado", mensagem: "Esse acesso já foi usado. Cada compra libera uma entrada só. Se foi você, abra o grupo pelo seu WhatsApp ou aguarde a aprovação." });
  return res.status(410).json({ motivo: "estornado", mensagem: "Essa compra foi estornada, então o acesso foi cancelado." });
}
