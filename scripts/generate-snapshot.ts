import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSnapshot } from "./gen/build";
import { LA } from "../src/lib/snapshot/la-meta";

const out = buildSnapshot(LA);
const dir = join(process.cwd(), "public", "snapshot", "la");
mkdirSync(dir, { recursive: true });

const write = (name: string, fc: unknown) => {
  const s = JSON.stringify(fc);
  writeFileSync(join(dir, name), s);
  console.log(`${name}  ${(s.length / 1e6).toFixed(2)} MB`);
};

write("hex-r7.json", out.r7);
write("hex-r8.json", out.r8);
write("poi.json", out.poi);
console.log(`r7=${out.r7.features.length} r8=${out.r8.features.length} poi=${out.poi.features.length}`);
