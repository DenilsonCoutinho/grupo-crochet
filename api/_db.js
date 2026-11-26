import { neon } from "@neondatabase/serverless";

// Convites do Grupo VIP: um por compra aprovada. O primeiro clique no botão marca "usado_em".
export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  return neon(process.env.DATABASE_URL);
}

let pronto = false;
export async function garantirTabela(db) {
  if (pronto) return;
  await db`CREATE TABLE IF NOT EXISTS convites_grupo (
    id text PRIMARY KEY,
    pedido text NOT NULL UNIQUE,
    email text NOT NULL,
    nome text,
    status text NOT NULL,
    usado_em timestamptz,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now()
  )`;
  pronto = true;
}

export function grupoUrl() {
  return process.env.WHATSAPP_GROUP_URL ?? "https://chat.whatsapp.com/I9i6HlJXOV6FVZ2gfjZsX4";
}

export function siteUrl() {
  return (process.env.SITE_URL ?? "https://comunidadecrochekai.vercel.app").replace(/\/$/, "");
}
