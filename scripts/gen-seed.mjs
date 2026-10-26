// Gera data/planA.json, planB.json, planC.json (sobrescreve).  Uso: npm run seed
import fs from "fs";
import path from "path";
import { buildSeedPlan, SEED_IDS } from "../lib/seed.mjs";

const dir = path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });
for (const id of SEED_IDS) {
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(buildSeedPlan(id), null, 2));
  console.log("gerado data/" + id + ".json");
}
