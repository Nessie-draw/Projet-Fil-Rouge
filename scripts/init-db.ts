// scripts/init-db.ts — Initialise les tables PostgreSQL nécessaires au projet
// Usage : npx tsx scripts/init-db.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL manquante dans .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function initDb() {
  console.log("Création des tables...\n");

  // 1. Table admins
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  admins         OK");

  // 2. Table inscriptions
  await sql`
    CREATE TABLE IF NOT EXISTS inscriptions (
      id             TEXT PRIMARY KEY,
      email          TEXT NOT NULL,
      prenom         TEXT NOT NULL,
      nom            TEXT NOT NULL,
      nom_equipe     TEXT NOT NULL,
      nombre_pilote  INTEGER NOT NULL DEFAULT 1,
      coequipier     TEXT,
      nom_robot      TEXT NOT NULL,
      etablissement  TEXT NOT NULL DEFAULT '',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  inscriptions   OK");

  // 3. Table tournament
  await sql`
    CREATE TABLE IF NOT EXISTS tournament (
      id          TEXT PRIMARY KEY,
      data        JSONB NOT NULL,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  tournament     OK");

  console.log("\nBase de données initialisée avec succès.");
}

initDb().catch((err) => {
  console.error("Erreur lors de l'initialisation :", err);
  process.exit(1);
});
