// Cifra el itinerario y los documentos para publicarlos en un sitio público.
// Uso: MEUROPA_PASSWORD=... node build.mjs <carpeta-privada> <carpeta-de-documentos>
//   <carpeta-privada>/trip.json   itinerario en claro (nunca se sube al repo)
//   <carpeta-de-documentos>/*     PDF e imágenes, con el nombre que verá el usuario
// Genera: meta.json, data.bin, docs/<id>.bin y la lista de precarga de sw.js.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createHash, randomBytes, webcrypto } from "node:crypto";
import { join, extname } from "node:path";

const [privDir, docsDir] = process.argv.slice(2);
const password = process.env.MEUROPA_PASSWORD;
if (!privDir || !docsDir || !password) {
  console.error("Uso: MEUROPA_PASSWORD=... node build.mjs <carpeta-privada> <carpeta-de-documentos>");
  process.exit(1);
}

const ITERATIONS = 250000;
const subtle = webcrypto.subtle;
let meta;
try { meta = JSON.parse(readFileSync("meta.json", "utf8")); } catch { meta = null; }
// Mantener la sal si ya existe, para que los teléfonos que ya entraron no tengan que volver a poner la contraseña.
const salt = meta?.salt ? Buffer.from(meta.salt, "base64") : randomBytes(16);

const baseKey = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);

async function seal(bytes) {
  const iv = randomBytes(12);
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
  return Buffer.concat([iv, ct]);
}
// Id estable por archivo que no revela su nombre.
const idFor = name => createHash("sha256").update(password + "\0" + name).digest("hex").slice(0, 16);
const MIME = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

const trip = JSON.parse(readFileSync(join(privDir, "trip.json"), "utf8"));
const files = readdirSync(docsDir).filter(f => MIME[extname(f).toLowerCase()]).sort();
const byFile = Object.fromEntries(files.map(f => [f, idFor(f)]));

for (const it of trip.items) if (it.docs) it.docs = it.docs.map(f => {
  if (!byFile[f]) throw new Error(`Documento no encontrado: ${f}`);
  return byFile[f];
});
trip.docs = (trip.docs || []).filter(d => byFile[d.file]).map(d => ({
  id: byFile[d.file], name: d.file, label: d.label, date: d.date, type: MIME[extname(d.file).toLowerCase()],
}));

rmSync("docs", { recursive: true, force: true });
mkdirSync("docs");
for (const f of files) writeFileSync(join("docs", byFile[f] + ".bin"), await seal(readFileSync(join(docsDir, f))));
writeFileSync("data.bin", await seal(new TextEncoder().encode(JSON.stringify(trip))));
writeFileSync("meta.json", JSON.stringify({ salt: salt.toString("base64"), iterations: ITERATIONS }) + "\n");

// Precarga para uso sin internet; la versión cambia con el contenido para que los teléfonos se actualicen.
const precache = ["data.bin", "meta.json", ...files.map(f => `docs/${byFile[f]}.bin`)];
const version = createHash("sha256").update(readFileSync("index.html")).update(readFileSync("data.bin"))
  .update(precache.join()).digest("hex").slice(0, 10);
const sw = readFileSync("sw.js", "utf8")
  .replace(/const CACHE = "[^"]*";/, `const CACHE = "meuropa-${version}";`)
  .replace(/\/\* DATA:start \*\/[\s\S]*?\/\* DATA:end \*\//, `/* DATA:start */ ${JSON.stringify(precache)} /* DATA:end */`);
writeFileSync("sw.js", sw);
console.log(`Listo: ${files.length} documentos, cache meuropa-${version}`);
