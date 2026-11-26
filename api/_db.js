import { neon } from "@neondatabase/serverless";

// Compras do Grupo VIP. Cada compra aprovada vira uma linha; o primeiro acesso marca "usado_em".
export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  return neon(process.env.DATABASE_URL);
}

let pronto = false;
export async function garantirTabela(db) {
  if (pronto) return;
  await db`CREATE TABLE IF NOT EXISTS compras_grupo (
    pedido text PRIMARY KEY,
    email text NOT NULL,
    nome text,
    status text NOT NULL,
    usado_em timestamptz,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now()
  )`;
  await db`CREATE INDEX IF NOT EXISTS compras_grupo_email_idx ON compras_grupo (lower(email))`;
  pronto = true;
}
