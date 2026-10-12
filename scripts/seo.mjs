// Lo que lee Google de yacontesto.com (SEO-1, 12-oct-2026; plan en investigacion/seo/PLAN-SEO.md):
// - título ≤ 60 y descripción ≤ 160 (si no, Google los corta);
// - un solo H1, y que diga «clínica dental»; cuántos encabezados hay (Google debe ver los mismos);
// - la ficha JSON-LD se lee y trae WebSite, Organization y Service, con YaContesto como proveedor (sin
//   personas), el logo de ≥ 112 px y los precios iguales a PRECIO (components/historia/datos.ts);
// - canonical, robots.txt, el sitemap con `lastmod` verdadero (el del aviso = su «Última actualización»),
//   la etiqueta de Search Console, el HTML bajo los 2 MB que lee Googlebot y que no haya noindex.
// Uso: node scripts/seo.mjs                          → contra out/ (después de `npm run build`)
//      node scripts/seo.mjs --url https://yacontesto.com
// Con una vista previa de Vercel (*.vercel.app, o --vista-previa) el noindex es a propósito
// (scripts/vista-previa.mjs): ahí se revisa que SÍ esté, para que no compita con yacontesto.com.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const iUrl = args.indexOf("--url");
const BASE = iUrl >= 0 ? args[iUrl + 1].replace(/\/+$/, "") : null;
const VISTA_PREVIA = args.includes("--vista-previa") || (BASE ? new URL(BASE).hostname.endsWith(".vercel.app") : false);
const SITIO = "https://yacontesto.com";
const VERIFICACION_GOOGLE = "N9BAlc6sneZmJIcs8uKmM3NoGAJZmZOTkguZW7Uh1xY";

const fallas = [];
const revisa = (cond, texto) => {
  if (!cond) fallas.push(texto);
  console.log(`${cond ? "✓" : "✗"} ${texto}`);
};

// Cada recurso, del disco (out/) o de la red. Devuelve el cuerpo y, en la red, el estado y las cabeceras.
async function traer(ruta, binario = false) {
  if (BASE) {
    const r = await fetch(BASE + ruta, { redirect: "follow" });
    const cuerpo = binario ? Buffer.from(await r.arrayBuffer()) : await r.text();
    return { estado: r.status, cabeceras: r.headers, cuerpo };
  }
  const archivo = resolve("out", "." + (ruta.endsWith("/") ? ruta + "index.html" : ruta));
  if (!existsSync(archivo)) return { estado: 404, cabeceras: new Headers(), cuerpo: binario ? Buffer.alloc(0) : "" };
  return { estado: 200, cabeceras: new Headers(), cuerpo: await readFile(archivo, binario ? undefined : "utf8") };
}

const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decodificar = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTIDADES[e] ?? m),
  );
const texto = (html) => decodificar(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const atributos = (etiqueta) => Object.fromEntries([...etiqueta.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [k, decodificar(v)]));
const metas = (html) => (html.match(/<meta\b[^>]*>/g) ?? []).map(atributos);
const largo = (s) => [...s].length;

// PRECIO tal cual está en el código de la página: un objeto literal de números.
const fuentePrecio = await readFile(resolve("components/historia/datos.ts"), "utf8");
const literal = fuentePrecio.match(/export const PRECIO = (\{[\s\S]*?\n\});/)?.[1];
if (!literal) throw new Error("No encontré `export const PRECIO = {…};` en components/historia/datos.ts");
const PRECIO = new Function(`return (${literal});`)();

console.log(`Revisando ${BASE ?? "out/ (local)"}${VISTA_PREVIA ? " — vista previa: el noindex es a propósito" : ""}\n`);

// ── La portada ──
const inicio = await traer("/");
revisa(inicio.estado === 200, `la portada responde 200 (${inicio.estado})`);
const html = inicio.cuerpo;
const bytes = Buffer.byteLength(html);
revisa(bytes < 2 * 1024 * 1024, `el HTML pesa ${(bytes / 1024).toFixed(0)} KB, menos de los 2 MB que lee Googlebot`);

const titulo = texto(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
revisa(titulo && largo(titulo) <= 60, `título de ${largo(titulo)} letras (≤ 60): «${titulo}»`);
const descripcion = metas(html).find((m) => m.name === "description")?.content ?? "";
revisa(descripcion && largo(descripcion) <= 160, `descripción de ${largo(descripcion)} letras (≤ 160)`);

const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => texto(m[1]));
revisa(h1s.length === 1, `un solo H1 (${h1s.length})`);
revisa(/cl[ií]nica dental/i.test(h1s[0] ?? ""), `el H1 dice «clínica dental»: «${h1s[0] ?? ""}»`);
const cuenta = (n) => (html.match(new RegExp(`<h${n}\\b`, "g")) ?? []).length;
const [c1, c2, c3] = [cuenta(1), cuenta(2), cuenta(3)];
console.log(`  encabezados en el HTML: ${c1 + c2 + c3} (H1 ${c1}, H2 ${c2}, H3 ${c3}); Search Console debe ver los mismos`);

const canonical = atributos(html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0] ?? "").href;
revisa(canonical === `${SITIO}/`, `canonical de la portada: ${canonical}`);
revisa(
  metas(html).some((m) => m.name === "google-site-verification" && m.content === VERIFICACION_GOOGLE),
  "la etiqueta de Search Console (google-site-verification) está y trae el código",
);

// ── Noindex: nunca en producción; siempre en la vista previa ──
const robotsMeta = metas(html).find((m) => m.name === "robots")?.content ?? "";
const robotsCabecera = inicio.cabeceras.get("x-robots-tag") ?? "";
const noindex = /noindex/i.test(robotsMeta) || /noindex/i.test(robotsCabecera);
if (VISTA_PREVIA) revisa(noindex, `la vista previa NO se indexa (cabecera X-Robots-Tag: «${robotsCabecera}»)`);
else revisa(!noindex, `sin noindex (meta robots: «${robotsMeta || "no hay"}»${BASE ? `, X-Robots-Tag: «${robotsCabecera || "no hay"}»` : ""})`);

// ── La ficha JSON-LD ──
const bloques = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
revisa(bloques.length === 1, `un solo bloque JSON-LD (${bloques.length})`);
let grafo = [];
try {
  grafo = JSON.parse(bloques[0] ?? "")["@graph"] ?? [];
} catch (e) {
  revisa(false, `el JSON-LD se lee: ${e.message}`);
}
const deTipo = (t) => grafo.find((n) => n["@type"] === t);
const [sitio, empresa, servicio] = ["WebSite", "Organization", "Service"].map(deTipo);
revisa(sitio && empresa && servicio, `el @graph trae WebSite, Organization y Service (${grafo.map((n) => n["@type"]).join(", ")})`);
revisa(sitio?.name === "YaContesto" && sitio?.url === `${SITIO}/`, `WebSite: «${sitio?.name}», ${sitio?.url}`);
revisa(empresa?.name === "YaContesto" && empresa?.url === `${SITIO}/`, `Organization: «${empresa?.name}», ${empresa?.url}`);
revisa(servicio?.provider?.["@id"] && servicio.provider["@id"] === empresa?.["@id"], `el proveedor del Service es la Organization (${servicio?.provider?.["@id"]})`);
const ficha = bloques[0] ?? "";
revisa(!/"Person"|Diego|Ben[ií]tez/i.test(ficha), "la ficha no trae personas ni el nombre de Diego");
revisa(empresa?.email && empresa?.telephone && empresa?.address?.addressLocality, `contacto: ${empresa?.email}, ${empresa?.telephone}, ${empresa?.address?.addressLocality}, ${empresa?.address?.addressRegion}`);
revisa((empresa?.sameAs ?? []).length >= 3 && empresa.sameAs.every((u) => u.startsWith("https://")), `sameAs: ${(empresa?.sameAs ?? []).length} perfiles`);

// El logo: tiene que existir en el sitio, ser PNG y medir ≥ 112 px.
const urlLogo = typeof empresa?.logo === "string" ? empresa.logo : empresa?.logo?.url;
const rutaLogo = urlLogo?.startsWith(SITIO) ? urlLogo.slice(SITIO.length) : null;
const logo = rutaLogo ? await traer(rutaLogo, true) : { estado: 0, cuerpo: Buffer.alloc(0) };
const esPng = logo.cuerpo.subarray(1, 4).toString() === "PNG";
const [anchoLogo, altoLogo] = esPng ? [logo.cuerpo.readUInt32BE(16), logo.cuerpo.readUInt32BE(20)] : [0, 0];
revisa(logo.estado === 200 && esPng && Math.min(anchoLogo, altoLogo) >= 112, `logo ${urlLogo}: ${logo.estado}, ${esPng ? "PNG" : "no es PNG"} de ${anchoLogo}×${altoLogo}`);

// Los precios: los mismos de la página.
const ofertas = servicio?.offers ?? [];
const precios = ofertas.map((o) => o.price);
const esperados = [PRECIO.instalacionFundador, PRECIO.escalones.base, PRECIO.escalones.segundo];
revisa(JSON.stringify(precios) === JSON.stringify(esperados), `precios de la ficha ${precios.join(", ")} = PRECIO ${esperados.join(", ")}`);
revisa(ofertas.length > 0 && ofertas.every((o) => o.priceCurrency === "MXN"), `las ${ofertas.length} ofertas, en MXN`);
const fmt = (n) => n.toLocaleString("es-MX");
revisa(texto(html).includes(`$${fmt(PRECIO.instalacionFundador)}`), `la página muestra la instalación de $${fmt(PRECIO.instalacionFundador)} que dice la ficha`);

// ── El aviso de privacidad ──
const aviso = await traer("/privacidad/");
revisa(aviso.estado === 200, `/privacidad/ responde 200 (${aviso.estado})`);
const canonicalAviso = atributos(aviso.cuerpo.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0] ?? "").href;
revisa(canonicalAviso === `${SITIO}/privacidad/`, `canonical del aviso: ${canonicalAviso}`);
const noindexAviso = metas(aviso.cuerpo).some((m) => m.name === "robots" && /noindex/i.test(m.content));
if (!VISTA_PREVIA) revisa(!noindexAviso, "el aviso sin noindex");
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fechaAviso = texto(aviso.cuerpo).match(/Última actualización: (\d{1,2}) de (\w+) de (\d{4})/);
const isoAviso = fechaAviso ? `${fechaAviso[3]}-${String(MESES.indexOf(fechaAviso[2]) + 1).padStart(2, "0")}-${fechaAviso[1].padStart(2, "0")}` : null;

// ── robots.txt y sitemap ──
const robots = await traer("/robots.txt");
if (VISTA_PREVIA) revisa(/Disallow: \//.test(robots.cuerpo), "robots.txt de la vista previa: Disallow (a propósito)");
else {
  revisa(robots.estado === 200 && /Allow: \//.test(robots.cuerpo) && !/Disallow: \/\s*$/m.test(robots.cuerpo), "robots.txt deja entrar a todo");
  revisa(robots.cuerpo.includes(`Sitemap: ${SITIO}/sitemap.xml`), "robots.txt apunta al sitemap");
}
const sitemap = await traer("/sitemap.xml");
revisa(sitemap.estado === 200, `sitemap.xml responde 200 (${sitemap.estado})`);
const urls = [...sitemap.cuerpo.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, u]) => ({
  loc: u.match(/<loc>(.*?)<\/loc>/)?.[1],
  lastmod: u.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
}));
const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
revisa(urls.length >= 2, `el sitemap trae ${urls.length} páginas`);
for (const { loc, lastmod } of urls) {
  const valida = /^\d{4}-\d{2}-\d{2}/.test(lastmod ?? "") && !Number.isNaN(Date.parse(lastmod)) && lastmod.slice(0, 10) <= hoy;
  revisa(loc?.startsWith(`${SITIO}/`) && valida, `sitemap: ${loc} con lastmod ${lastmod ?? "—"}`);
}
const lastmodAviso = urls.find((u) => u.loc === `${SITIO}/privacidad/`)?.lastmod;
revisa(isoAviso && lastmodAviso?.slice(0, 10) === isoAviso, `el lastmod del aviso (${lastmodAviso}) es su «Última actualización» (${isoAviso})`);

// ── Una dirección que no existe da 404 (solo en la red; en local no hay servidor) ──
if (BASE) {
  const r = await fetch(`${BASE}/no-existe-${Date.now()}/`);
  revisa(r.status === 404, `una dirección que no existe da 404 (${r.status})`);
}

console.log(fallas.length ? `\n${fallas.length} falla(s)` : "\nTodo en orden");
process.exitCode = fallas.length ? 1 : 0;
