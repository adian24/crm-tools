import JSZip from "jszip";

const SLD_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide";
const IMG_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
const LAY_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout";
const SLD_CT  = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";

/** Ambil path slide (berurutan) dari presentation.xml + presentation.xml.rels */
function getSlidePaths(presXml: string, presRels: string): string[] {
  const rIds = [...presXml.matchAll(/<p:sldId [^/]*\/>/g)]
    .map(m => m[0].match(/r:id="([^"]+)"/)?.[1])
    .filter(Boolean) as string[];
  const map = new Map<string, string>();
  for (const m of presRels.matchAll(/Id="([^"]+)"[^>]*Type="[^"]*\/slide"[^>]*Target="([^"]+)"/g))
    map.set(m[1], m[2]);
  return rIds.map(r => map.get(r)!).filter(Boolean);
}

/**
 * Gunakan templateBuffer (slide1=cover, slide2=closing) sebagai base PPTX.
 * Content slides dari pptxgenjs (contentBuffer: [blank, ...content..., blank])
 * disisipkan di antara cover dan closing.
 *
 * Karena template dipakai sebagai base ZIP, slide master + layout + theme + font
 * + media template semuanya ikut → background & desain cover/closing tetap utuh.
 */
export async function buildPptxWithTemplate(
  templateBuffer: ArrayBuffer,
  contentBuffer:  ArrayBuffer,
): Promise<ArrayBuffer> {
  const tplZip = await JSZip.loadAsync(templateBuffer);
  const cntZip = await JSZip.loadAsync(contentBuffer);

  // ── Template: ambil slide pertama (cover) dan terakhir (closing) ───────────
  const tplPresXml  = await tplZip.file("ppt/presentation.xml")!.async("string");
  const tplPresRels = await tplZip.file("ppt/_rels/presentation.xml.rels")!.async("string");
  const tplSldIds   = [...tplPresXml.matchAll(/<p:sldId [^/]*\/>/g)].map(m => m[0]);
  const tplPaths    = getSlidePaths(tplPresXml, tplPresRels);
  if (tplPaths.length < 2) throw new Error("Template perlu minimal 2 slide (cover + closing)");

  // ── Content: slide tengah dari pptxgenjs (buang placeholder cover & closing) ─
  const cntPresXml  = await cntZip.file("ppt/presentation.xml")!.async("string");
  const cntPresRels = await cntZip.file("ppt/_rels/presentation.xml.rels")!.async("string");
  const cntPaths    = getSlidePaths(cntPresXml, cntPresRels);
  const contentPaths = cntPaths.slice(1, -1);

  // ── Cari layout yang valid di template (dari rels slide cover) ─────────────
  const coverRelsPath = `ppt/slides/_rels/${tplPaths[0].split("/").pop()!}.rels`;
  const coverRels     = await tplZip.file(coverRelsPath)!.async("string");
  const layoutTarget  = coverRels.match(/Type="[^"]*\/slideLayout"[^>]*Target="([^"]+)"/)?.[1]
    ?? "../slideLayouts/slideLayout1.xml";

  // ── [Content_Types].xml: tambah Default untuk jpeg & jpg jika belum ada ────
  // pptxgenjs menyimpan screenshot sebagai .jpeg — template hanya punya .png
  let ctTypes = await tplZip.file("[Content_Types].xml")!.async("string");
  for (const [ext, ct] of [["jpeg", "image/jpeg"], ["jpg", "image/jpeg"]] as const) {
    if (!ctTypes.includes(`Extension="${ext}"`))
      ctTypes = ctTypes.replace("</Types>", `<Default Extension="${ext}" ContentType="${ct}"/>\n</Types>`);
  }

  // ── Salin content slides ke template ZIP ──────────────────────────────────
  const newSlidePaths: string[] = [];
  const newSlideRIds:  string[] = [];

  for (let i = 0; i < contentPaths.length; i++) {
    const srcPath  = contentPaths[i];            // e.g. "slides/slide2.xml"
    const num      = 200 + i;
    const dstFile  = `slide${num}.xml`;
    const dstPath  = `slides/${dstFile}`;
    const dstRels  = `slides/_rels/${dstFile}.rels`;
    const prefix   = `c${num}_`;

    // Slide XML — langsung salin dari pptxgenjs (shapes semua explicit)
    const slideXml = await cntZip.file(`ppt/${srcPath}`)!.async("string");

    // Rels sumber dari pptxgenjs
    const srcRelsPath = `ppt/slides/_rels/${srcPath.split("/").pop()!}.rels`;
    const srcRels     = await cntZip.file(srcRelsPath)?.async("string") ?? "";

    // Rels tujuan: pakai layout template + salin image refs
    let newRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      `<Relationship Id="rId1" Type="${LAY_REL}" Target="${layoutTarget}"/>`;

    for (const m of srcRels.matchAll(/Id="([^"]+)"[^>]*Type="[^"]*\/image"[^>]*Target="([^"]+)"/g)) {
      const [, rId, target] = m;
      const mediaFile    = target.split("/").pop()!;
      const newMediaFile = `${prefix}${mediaFile}`;
      const data = await cntZip.file(`ppt/media/${mediaFile}`)?.async("uint8array");
      if (data) tplZip.file(`ppt/media/${newMediaFile}`, data);
      newRels += `<Relationship Id="${rId}" Type="${IMG_REL}" Target="../media/${newMediaFile}"/>`;
    }
    newRels += "</Relationships>";

    tplZip.file(`ppt/${dstPath}`, slideXml);
    tplZip.file(`ppt/${dstRels}`, newRels);
    newSlidePaths.push(dstPath);
    newSlideRIds.push(`rId_c${num}`);

    // Override content type untuk slide baru
    const part = `/ppt/${dstPath}`;
    if (!ctTypes.includes(part))
      ctTypes = ctTypes.replace("</Types>", `<Override PartName="${part}" ContentType="${SLD_CT}"/>\n</Types>`);
  }

  tplZip.file("[Content_Types].xml", ctTypes);

  // ── Update presentation.xml.rels: tambah rel untuk slide baru ─────────────
  let updPresRels = tplPresRels;
  for (let i = 0; i < newSlidePaths.length; i++) {
    updPresRels = updPresRels.replace(
      "</Relationships>",
      `<Relationship Id="${newSlideRIds[i]}" Type="${SLD_REL}" Target="${newSlidePaths[i]}"/>\n</Relationships>`,
    );
  }
  tplZip.file("ppt/_rels/presentation.xml.rels", updPresRels);

  // ── Update sldIdLst: cover → content slides → closing ────────────────────
  const maxSldId  = Math.max(256, ...tplSldIds.map(el => parseInt(el.match(/ id="(\d+)"/)?.[1] ?? "0")));
  let nextSldId   = maxSldId + 1;

  const coverEl   = tplSldIds[0];
  const closingEl = tplSldIds[tplSldIds.length - 1];
  const newSldIds = newSlideRIds.map(rId => `<p:sldId id="${nextSldId++}" r:id="${rId}"/>`);

  const newList = [coverEl, ...newSldIds, closingEl].join("\n        ");
  const updPresXml = tplPresXml.replace(
    /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,
    `<p:sldIdLst>\n        ${newList}\n      </p:sldIdLst>`,
  );
  tplZip.file("ppt/presentation.xml", updPresXml);

  return tplZip.generateAsync({ type: "arraybuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
