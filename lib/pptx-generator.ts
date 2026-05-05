"use client";

import pptxgen from "pptxgenjs";

// ── Constants ──────────────────────────────────────────────────────────────
const C = {
  navy:      "1B3A6B",
  blue:      "2563EB",
  lightBlue: "DBEAFE",
  iceBlue:   "EFF6FF",
  altRow:    "F8FAFC",
  border:    "CBD5E1",
  text:      "1E293B",
  gray:      "64748B",
  white:     "FFFFFF",
  green:     "16A34A",
  greenBg:   "DCFCE7",
  red:       "DC2626",
  redBg:     "FEE2E2",
  orange:    "EA580C",
  orangeBg:  "FFEDD5",
  amber:     "D97706",
  amberBg:   "FEF3C7",
  purple:    "7C3AED",
};

const MONTHS = ["","Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"];

const SW = 13.33; // slide width
const SH = 7.5;   // slide height

// ── Shared Helpers ─────────────────────────────────────────────────────────

function addHeader(slide: pptxgen.Slide, title: string) {
  slide.addShape("rect", {
    x: 0, y: 0, w: SW, h: 0.72,
    fill: { color: C.navy },
    line: { color: C.navy, width: 0 },
  });
  slide.addText(title, {
    x: 0.3, y: 0, w: SW - 0.6, h: 0.72,
    fontSize: 20, bold: true, color: C.white, valign: "middle",
  });
}

function addFooter(slide: pptxgen.Slide, month: number, year: number) {
  slide.addShape("rect", {
    x: 0, y: SH - 0.28, w: SW, h: 0.28,
    fill: { color: C.navy },
    line: { color: C.navy, width: 0 },
  });
  slide.addText(`TSI Certification  •  Laporan Bulanan CRM  •  ${MONTHS[month]} ${year}`, {
    x: 0.3, y: SH - 0.28, w: SW - 0.6, h: 0.28,
    fontSize: 7.5, color: C.white, valign: "middle",
  });
}

function noData(slide: pptxgen.Slide) {
  slide.addText("Tidak ada data untuk periode ini.", {
    x: 0.5, y: 2.5, w: SW - 1, h: 0.8,
    fontSize: 13, color: C.gray, align: "center", italic: true,
  });
}

/** Strip HTML tags from a string */
function stripHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function trunc(s: string | undefined | null, len = 60): string {
  const str = String(s ?? "");
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function priorityFill(p: string): string {
  switch (p) {
    case "Critical": return C.red;
    case "High":     return C.orange;
    case "Medium":   return C.amber;
    case "Low":      return C.green;
    default:         return C.gray;
  }
}

/** Standard table header cell */
function th(text: string): pptxgen.TableCell {
  return { text, options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, align: "center" } };
}

/** Standard table data cell */
function td(text: string, alt = false, opts: pptxgen.TableCellProps = {}): pptxgen.TableCell {
  return {
    text: String(text ?? ""),
    options: { color: C.text, fill: { color: alt ? C.altRow : C.white }, fontSize: 9, valign: "middle", ...opts },
  };
}

/** Colored badge cell */
function badge(text: string, fillColor: string, alt = false): pptxgen.TableCell {
  return {
    text,
    options: {
      bold: true, color: C.white, fill: { color: fillColor }, fontSize: 8,
      align: "center", valign: "middle",
    },
  };
}

function sectionTitle(slide: pptxgen.Slide, text: string, y: number) {
  slide.addShape("rect", {
    x: 0.3, y, w: SW - 0.6, h: 0.3,
    fill: { color: C.lightBlue },
    line: { color: C.blue, width: 0.5 },
  });
  slide.addText(text, {
    x: 0.35, y, w: SW - 0.7, h: 0.3,
    fontSize: 10, bold: true, color: C.navy, valign: "middle",
  });
}

// ── Data Interfaces ────────────────────────────────────────────────────────

export interface PPTXData {
  month: number;
  year: number;
  kpiData?: { year: string; tableState?: string } | null;
  strukturDivisi: Array<{ nama?: string; jabatan?: string; keterangan?: string }>;
  kolaborasiCrm: Array<{ nama?: string; jabatan?: string; jobDesk?: string }>;
  crmTargets: Array<{
    tahun?: number | string; produk?: string; status?: string; namaPerusahaan?: string;
    picCrm?: string; hargaKontrak?: number;
  }>;
  prmReferral: Array<{
    month?: number; year?: number; judul?: string; category?: string;
    target?: number; pencapaian?: number; deskripsi?: string;
  }>;
  visitedTargets: Array<{
    namaPerusahaan?: string; picCrm?: string; tanggalKunjungan?: string;
    statusKunjungan?: string; produk?: string;
  }>;
  engagement: Array<{
    month?: number; year?: number; namaClient?: string; namaPicClient?: string;
    picTsi?: string; tglKunjungan?: string; catatan?: string; tindakLanjut?: string;
  }>;
  npsData: Array<{
    month?: number; year?: number; category?: string;
    detractors?: number; passives?: number; promoters?: number;
    customerRelation?: number; finance?: number; auditor?: number;
    admin?: number; sales?: number; npsDescription?: string; ratingDescription?: string;
  }>;
  flyers: Array<{
    month?: number; year?: number; title?: string; category?: string;
    tanggalTerbit?: string; status?: string; description?: string;
  }>;
  complain: Array<{
    month?: number; year?: number; namaPerusahaan?: string; komplain?: string;
    divisi?: string; priority?: string; status?: string; penyelesaian?: string;
  }>;
  isuKendala: Array<{
    month?: number; year?: number; title?: string; category?: string;
    priority?: string; status?: string;
    points?: Array<{ text: string }>;
    tanggalKejadian?: string; tanggalSelesai?: string;
  }>;
  catatanTambahan: Array<{
    bulan?: number; tahun?: number; judul?: string; isiCatatan?: string; status?: string;
  }>;
}

// ── Slide Builders ─────────────────────────────────────────────────────────

function slideCover(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  // Full background
  s.addShape("rect", { x: 0, y: 0, w: SW, h: SH, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
  // Decorative accent line
  s.addShape("rect", { x: 0, y: 3.7, w: SW, h: 0.06, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });
  // Main title
  s.addText("LAPORAN BULANAN CRM", {
    x: 0.5, y: 1.6, w: SW - 1, h: 1.0,
    fontSize: 38, bold: true, color: C.white, align: "center",
  });
  // Month/Year
  s.addText(`${MONTHS[data.month]} ${data.year}`, {
    x: 0.5, y: 2.75, w: SW - 1, h: 0.8,
    fontSize: 28, color: "93C5FD", align: "center",
  });
  // Company
  s.addText("TSI Certification", {
    x: 0.5, y: 4.0, w: SW - 1, h: 0.55,
    fontSize: 16, color: C.white, align: "center", italic: true,
  });
  // Bottom bar
  s.addShape("rect", { x: 0, y: SH - 0.5, w: SW, h: 0.5, fill: { color: "0F2044" }, line: { color: "0F2044", width: 0 } });
  s.addText("Dokumen Internal – Rahasia", {
    x: 0.5, y: SH - 0.5, w: SW - 1, h: 0.5,
    fontSize: 9, color: "94A3B8", align: "center", valign: "middle",
  });
}

function slideKPI(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `KPI – Tahun ${data.year}`);
  addFooter(s, data.month, data.year);

  if (!data.kpiData?.tableState) {
    noData(s);
    return;
  }

  let gridData: string[][] = [];
  try {
    const parsed = JSON.parse(data.kpiData.tableState);
    gridData = parsed.data ?? [];
  } catch {
    noData(s);
    return;
  }

  // Filter out fully empty rows
  const rows = gridData.filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ""));
  if (rows.length === 0) { noData(s); return; }

  const colCount = Math.max(...rows.map(r => r.length));
  const colW = Array(colCount).fill((SW - 0.6) / colCount);

  const tableRows: pptxgen.TableRow[] = rows.slice(0, 30).map((row, ri) => {
    const alt = ri % 2 === 1;
    return Array.from({ length: colCount }, (_, ci) => {
      const val = String(row[ci] ?? "");
      if (ri === 0) return th(val);
      return td(val, alt);
    });
  });

  s.addTable(tableRows, {
    x: 0.3, y: 0.85, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    rowH: 0.27,
    colW,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideStrukturDivisi(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, "Struktur Divisi CRP");
  addFooter(s, data.month, data.year);

  const staff = data.strukturDivisi;
  if (!staff.length) { noData(s); return; }

  const rows: pptxgen.TableRow[] = [
    [th("No"), th("Nama"), th("Jabatan"), th("Keterangan")],
    ...staff.map((p, i) => {
      const alt = i % 2 === 1;
      return [
        td(String(i + 1), alt, { align: "center" }),
        td(p.nama ?? "", alt),
        td(p.jabatan ?? "", alt),
        td(trunc(p.keterangan ?? "", 80), alt),
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 0.85, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [0.45, 2.5, 2.5, 7.08],
    rowH: 0.28,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideKolaborasiCRM(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, "Kolaborasi CRM");
  addFooter(s, data.month, data.year);

  const staff = data.kolaborasiCrm;
  if (!staff.length) { noData(s); return; }

  const rows: pptxgen.TableRow[] = [
    [th("No"), th("Nama"), th("Jabatan"), th("Job Description")],
    ...staff.map((p, i) => {
      const alt = i % 2 === 1;
      return [
        td(String(i + 1), alt, { align: "center" }),
        td(p.nama ?? "", alt),
        td(p.jabatan ?? "", alt),
        td(trunc(stripHtml(p.jobDesk), 100), alt),
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 0.85, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [0.45, 2.3, 2.3, 7.28],
    rowH: 0.28,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slidePencapaianCRM(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Pencapaian CRM – Tahun ${data.year}`);
  addFooter(s, data.month, data.year);

  const targets = data.crmTargets.filter(t => Number(t.tahun) === data.year);
  if (!targets.length) { noData(s); return; }

  // Count by status
  const statusMap: Record<string, number> = {};
  targets.forEach(t => {
    const st = t.status ?? "Tidak Diketahui";
    statusMap[st] = (statusMap[st] ?? 0) + 1;
  });

  // Summary boxes
  const total = targets.length;
  const done  = targets.filter(t => (t.status ?? "").toUpperCase().includes("DONE")).length;
  const closing = targets.filter(t => (t.status ?? "").toUpperCase().includes("CLOSING")).length;
  const prospect = targets.filter(t => (t.status ?? "").toUpperCase().includes("PROSPECT")).length;

  const boxes = [
    { label: "Total Target",   value: total,    fill: C.navy },
    { label: "Done",           value: done,     fill: C.green },
    { label: "Closing",        value: closing,  fill: C.blue },
    { label: "Prospect",       value: prospect, fill: C.amber },
  ];

  boxes.forEach((b, i) => {
    const bx = 0.3 + i * 3.2;
    s.addShape("rect", {
      x: bx, y: 0.85, w: 3.0, h: 0.9,
      fill: { color: b.fill },
      line: { color: b.fill, width: 0 },
      shadow: { type: "outer", angle: 45, blur: 3, offset: 2, color: "000000", opacity: 0.15 },
    });
    s.addText(String(b.value), { x: bx, y: 0.85, w: 3.0, h: 0.55, fontSize: 24, bold: true, color: C.white, align: "center", valign: "bottom" });
    s.addText(b.label,         { x: bx, y: 1.3,  w: 3.0, h: 0.35, fontSize: 9,  color: C.white, align: "center", valign: "top" });
  });

  // Status breakdown table
  sectionTitle(s, "Rekap Status", 1.92);

  const statusRows: pptxgen.TableRow[] = [
    [th("Status"), th("Jumlah"), th("%")],
    ...Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([st, cnt], i) => {
      const pct = ((cnt / total) * 100).toFixed(1);
      const alt = i % 2 === 1;
      return [td(st, alt), td(String(cnt), alt, { align: "center" }), td(`${pct}%`, alt, { align: "center" })];
    }),
  ];

  s.addTable(statusRows, {
    x: 0.3, y: 2.27, w: 6.0,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [3.5, 1.2, 1.3],
    rowH: 0.27,
    autoPage: false,
  });

  // Top companies
  sectionTitle(s, "Perusahaan Target (10 Terbaru)", 1.92);

  const companies = targets.slice(0, 10);
  const compRows: pptxgen.TableRow[] = [
    [th("Perusahaan"), th("PIC CRM"), th("Produk"), th("Status")],
    ...companies.map((t, i) => {
      const alt = i % 2 === 1;
      return [
        td(trunc(t.namaPerusahaan ?? "", 35), alt),
        td(t.picCrm ?? "", alt),
        td(t.produk ?? "", alt),
        td(t.status ?? "", alt, { align: "center" }),
      ];
    }),
  ];

  s.addTable(compRows, {
    x: 6.5, y: 2.27, w: 6.53,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [2.8, 1.5, 1.1, 1.13],
    rowH: 0.27,
    autoPage: false,
  });
}

function slidePRMReferral(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Pencapaian PRM & Referral – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.prmReferral.filter(r => r.month === data.month && r.year === data.year);

  const prm      = filtered.filter(r => r.category === "PRM");
  const referral = filtered.filter(r => r.category === "REFERRAL");

  if (!filtered.length) { noData(s); return; }

  const buildTable = (items: typeof filtered): pptxgen.TableRow[] => [
    [th("Judul"), th("Target"), th("Pencapaian"), th("%"), th("Deskripsi")],
    ...items.map((r, i) => {
      const alt   = i % 2 === 1;
      const pct   = r.target ? ((( r.pencapaian ?? 0) / r.target) * 100).toFixed(1) : "0.0";
      const pctNum = parseFloat(pct);
      const pctColor = pctNum >= 100 ? C.green : pctNum >= 75 ? C.amber : C.red;
      return [
        td(r.judul ?? "", alt),
        td(String(r.target ?? 0), alt, { align: "center" }),
        td(String(r.pencapaian ?? 0), alt, { align: "center" }),
        { text: `${pct}%`, options: { bold: true, color: pctColor, fill: { color: alt ? C.altRow : C.white }, fontSize: 9, align: "center", valign: "middle" } } as pptxgen.TableCell,
        td(trunc(r.deskripsi ?? "", 50), alt),
      ];
    }),
  ];

  if (prm.length) {
    sectionTitle(s, "PRM", 0.85);
    s.addTable(buildTable(prm), {
      x: 0.3, y: 1.2, w: SW - 0.6,
      border: { type: "solid", pt: 0.5, color: C.border },
      fontFace: "Calibri",
      colW: [3.2, 1.0, 1.1, 0.8, 6.43],
      rowH: 0.27,
      autoPage: false,
    });
  }

  const referralY = prm.length ? 0.85 + 0.35 + (prm.length + 1) * 0.27 + 0.3 : 0.85;

  if (referral.length && referralY < SH - 1.5) {
    sectionTitle(s, "Referral", referralY);
    s.addTable(buildTable(referral), {
      x: 0.3, y: referralY + 0.35, w: SW - 0.6,
      border: { type: "solid", pt: 0.5, color: C.border },
      fontFace: "Calibri",
      colW: [3.2, 1.0, 1.1, 0.8, 6.43],
      rowH: 0.27,
      autoPage: false,
    });
  }
}

function slideLaporanKunjungan(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Laporan Kunjungan – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.visitedTargets.filter(t => {
    if (!t.tanggalKunjungan) return false;
    const d = new Date(t.tanggalKunjungan);
    return d.getMonth() + 1 === data.month && d.getFullYear() === data.year;
  });

  if (!filtered.length) { noData(s); return; }

  // Summary box
  const picMap: Record<string, number> = {};
  filtered.forEach(t => { const p = t.picCrm ?? "Tidak Diketahui"; picMap[p] = (picMap[p] ?? 0) + 1; });

  s.addShape("rect", { x: 0.3, y: 0.85, w: 3.0, h: 0.75, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
  s.addText(String(filtered.length), { x: 0.3, y: 0.85, w: 3.0, h: 0.45, fontSize: 22, bold: true, color: C.white, align: "center", valign: "bottom" });
  s.addText("Total Kunjungan", { x: 0.3, y: 1.2, w: 3.0, h: 0.3, fontSize: 9, color: C.white, align: "center" });

  // Kunjungan per PIC summary
  let picY = 0.85;
  Object.entries(picMap).forEach(([pic, cnt], i) => {
    if (i > 4) return;
    const bx = 3.5 + i * 1.9;
    s.addShape("rect", { x: bx, y: picY, w: 1.75, h: 0.75, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });
    s.addText(String(cnt), { x: bx, y: picY, w: 1.75, h: 0.45, fontSize: 18, bold: true, color: C.white, align: "center", valign: "bottom" });
    s.addText(trunc(pic, 15), { x: bx, y: picY + 0.42, w: 1.75, h: 0.3, fontSize: 7.5, color: C.white, align: "center" });
  });

  const rows: pptxgen.TableRow[] = [
    [th("Perusahaan"), th("PIC CRM"), th("Tanggal Kunjungan"), th("Status Kunjungan"), th("Produk")],
    ...filtered.map((t, i) => {
      const alt = i % 2 === 1;
      const tgl = t.tanggalKunjungan ? new Date(t.tanggalKunjungan).toLocaleDateString("id-ID") : "-";
      return [
        td(trunc(t.namaPerusahaan ?? "", 35), alt),
        td(t.picCrm ?? "", alt),
        td(tgl, alt, { align: "center" }),
        td(t.statusKunjungan ?? "-", alt, { align: "center" }),
        td(t.produk ?? "-", alt),
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 1.72, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [3.5, 1.8, 2.0, 2.0, 3.23],
    rowH: 0.27,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideEngagement(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Engagement & Partnership – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.engagement.filter(e => e.month === data.month && e.year === data.year);
  if (!filtered.length) { noData(s); return; }

  const rows: pptxgen.TableRow[] = [
    [th("Nama Client"), th("PIC Client"), th("PIC TSI"), th("Tgl Kunjungan"), th("Catatan"), th("Tindak Lanjut")],
    ...filtered.map((e, i) => {
      const alt = i % 2 === 1;
      const tgl = e.tglKunjungan ? new Date(e.tglKunjungan).toLocaleDateString("id-ID") : "-";
      return [
        td(trunc(e.namaClient ?? "", 25), alt),
        td(trunc(e.namaPicClient ?? "", 20), alt),
        td(e.picTsi ?? "", alt),
        td(tgl, alt, { align: "center" }),
        td(trunc(e.catatan ?? "", 40), alt),
        td(trunc(e.tindakLanjut ?? "", 40), alt),
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 0.85, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [2.0, 1.9, 1.4, 1.5, 3.0, 3.03],
    rowH: 0.27,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideNPS(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `NPS (Net Promoter Score) – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.npsData.filter(n => n.month === data.month && n.year === data.year);
  if (!filtered.length) { noData(s); return; }

  filtered.forEach((nps, idx) => {
    const col = idx === 0 ? 0.3 : SW / 2 + 0.1;
    const w   = SW / 2 - 0.4;
    const yBase = 0.87;

    const pro  = nps.promoters  ?? 0;
    const pas  = nps.passives   ?? 0;
    const det  = nps.detractors ?? 0;
    const total = pro + pas + det;
    const score = total > 0 ? Math.round(((pro - det) / total) * 100) : 0;
    const scoreColor = score >= 50 ? C.green : score >= 0 ? C.amber : C.red;

    // Category label
    s.addShape("rect", { x: col, y: yBase, w, h: 0.3, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });
    s.addText(nps.category ?? "", { x: col, y: yBase, w, h: 0.3, fontSize: 10, bold: true, color: C.white, align: "center", valign: "middle" });

    // NPS Score box
    s.addShape("rect", { x: col, y: yBase + 0.35, w: 1.6, h: 1.0, fill: { color: C.iceBlue }, line: { color: C.blue, width: 0.5 } });
    s.addText("NPS Score", { x: col, y: yBase + 0.35, w: 1.6, h: 0.32, fontSize: 8, color: C.navy, align: "center", valign: "bottom" });
    s.addText(String(score), { x: col, y: yBase + 0.6, w: 1.6, h: 0.55, fontSize: 26, bold: true, color: scoreColor, align: "center", valign: "middle" });

    // Promoters / Passives / Detractors mini boxes
    const ppdData = [
      { label: "Promoters",  val: pro,  fill: C.green  },
      { label: "Passives",   val: pas,  fill: C.amber  },
      { label: "Detractors", val: det,  fill: C.red    },
    ];
    ppdData.forEach((p, pi) => {
      const bx = col + 1.7 + pi * 1.35;
      s.addShape("rect", { x: bx, y: yBase + 0.35, w: 1.2, h: 1.0, fill: { color: p.fill }, line: { color: p.fill, width: 0 } });
      s.addText(String(p.val), { x: bx, y: yBase + 0.35, w: 1.2, h: 0.65, fontSize: 20, bold: true, color: C.white, align: "center", valign: "middle" });
      s.addText(p.label,       { x: bx, y: yBase + 0.87, w: 1.2, h: 0.35, fontSize: 7.5, color: C.white, align: "center" });
    });

    // Ratings table
    const ratings: pptxgen.TableRow[] = [
      [th("Aspek Rating"),         th("Nilai")],
      [td("Customer Relation", false), td(String(nps.customerRelation ?? "-"), false, { align: "center" })],
      [td("Finance",           true),  td(String(nps.finance          ?? "-"), true,  { align: "center" })],
      [td("Auditor",           false), td(String(nps.auditor          ?? "-"), false, { align: "center" })],
      [td("Admin",             true),  td(String(nps.admin            ?? "-"), true,  { align: "center" })],
      [td("Sales",             false), td(String(nps.sales            ?? "-"), false, { align: "center" })],
    ];

    s.addTable(ratings, {
      x: col, y: yBase + 1.5, w: w,
      border: { type: "solid", pt: 0.5, color: C.border },
      fontFace: "Calibri",
      colW: [w * 0.7, w * 0.3],
      rowH: 0.27,
    });

    // Descriptions
    if (nps.npsDescription) {
      s.addText(`Catatan NPS: ${nps.npsDescription}`, {
        x: col, y: yBase + 3.55, w, h: 0.5,
        fontSize: 8, color: C.gray, wrap: true, italic: true,
      });
    }
    if (nps.ratingDescription) {
      s.addText(`Catatan Rating: ${nps.ratingDescription}`, {
        x: col, y: yBase + 3.95, w, h: 0.5,
        fontSize: 8, color: C.gray, wrap: true, italic: true,
      });
    }
  });
}

function slideFlyer(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Flyer – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.flyers.filter(f => f.month === data.month && f.year === data.year);
  if (!filtered.length) { noData(s); return; }

  const rows: pptxgen.TableRow[] = [
    [th("Judul"), th("Kategori"), th("Tanggal Terbit"), th("Status"), th("Deskripsi")],
    ...filtered.map((f, i) => {
      const alt = i % 2 === 1;
      const fillColor = f.status === "active" ? C.green : C.gray;
      const statusText = f.status === "active" ? "Aktif" : "Nonaktif";
      return [
        td(trunc(f.title ?? "", 40), alt),
        td(f.category ?? "", alt, { align: "center" }),
        td(f.tanggalTerbit ? new Date(f.tanggalTerbit).toLocaleDateString("id-ID") : "-", alt, { align: "center" }),
        { text: statusText, options: { bold: true, color: C.white, fill: { color: fillColor }, fontSize: 8, align: "center", valign: "middle" } } as pptxgen.TableCell,
        td(trunc(f.description ?? "", 50), alt),
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 0.85, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [3.5, 1.5, 1.7, 1.0, 4.83],
    rowH: 0.28,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideCustomerComplain(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Customer Complain – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.complain.filter(c => c.month === data.month && c.year === data.year);
  if (!filtered.length) { noData(s); return; }

  // Priority summary boxes
  const priorities = ["Critical", "High", "Medium", "Low"];
  priorities.forEach((p, i) => {
    const cnt = filtered.filter(c => c.priority === p).length;
    const bx  = 0.3 + i * 3.2;
    const fc  = priorityFill(p);
    s.addShape("rect", { x: bx, y: 0.85, w: 3.0, h: 0.65, fill: { color: fc }, line: { color: fc, width: 0 } });
    s.addText(String(cnt), { x: bx, y: 0.85, w: 3.0, h: 0.4, fontSize: 18, bold: true, color: C.white, align: "center", valign: "bottom" });
    s.addText(p,           { x: bx, y: 1.17, w: 3.0, h: 0.28, fontSize: 8.5, color: C.white, align: "center" });
  });

  const rows: pptxgen.TableRow[] = [
    [th("Perusahaan"), th("Komplain"), th("Divisi"), th("Priority"), th("Status"), th("Penyelesaian")],
    ...filtered.sort((a, b) => priorities.indexOf(a.priority ?? "") - priorities.indexOf(b.priority ?? "")).map((c, i) => {
      const alt = i % 2 === 1;
      const pc = priorityFill(c.priority ?? "");
      const sc = c.status === "active" ? C.red : C.green;
      return [
        td(trunc(c.namaPerusahaan ?? "", 28), alt),
        td(trunc(c.komplain ?? "", 40), alt),
        td(c.divisi ?? "", alt, { align: "center" }),
        { text: c.priority ?? "-", options: { bold: true, color: C.white, fill: { color: pc }, fontSize: 8, align: "center", valign: "middle" } } as pptxgen.TableCell,
        { text: c.status === "active" ? "Aktif" : "Selesai", options: { bold: true, color: C.white, fill: { color: sc }, fontSize: 8, align: "center", valign: "middle" } } as pptxgen.TableCell,
        td(trunc(c.penyelesaian ?? "-", 35), alt),
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 1.62, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [2.0, 2.7, 1.5, 1.0, 1.0, 4.33],
    rowH: 0.27,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideIsuKendala(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Isu & Kendala – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.isuKendala.filter(i => i.month === data.month && i.year === data.year);
  if (!filtered.length) { noData(s); return; }

  const priorities = ["Critical", "High", "Medium", "Low"];
  const categories = ["Internal", "Eksternal", "Operasional", "Teknis"];

  // Category summary
  categories.forEach((cat, i) => {
    const cnt = filtered.filter(x => x.category === cat).length;
    const bx  = 0.3 + i * 3.2;
    s.addShape("rect", { x: bx, y: 0.85, w: 3.0, h: 0.65, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
    s.addText(String(cnt), { x: bx, y: 0.85, w: 3.0, h: 0.4, fontSize: 18, bold: true, color: C.white, align: "center", valign: "bottom" });
    s.addText(cat, { x: bx, y: 1.17, w: 3.0, h: 0.28, fontSize: 8.5, color: C.white, align: "center" });
  });

  const rows: pptxgen.TableRow[] = [
    [th("Judul"), th("Kategori"), th("Priority"), th("Status"), th("Poin Utama"), th("Tgl Kejadian")],
    ...filtered.sort((a, b) => priorities.indexOf(a.priority ?? "") - priorities.indexOf(b.priority ?? "")).map((item, i) => {
      const alt  = i % 2 === 1;
      const pc   = priorityFill(item.priority ?? "");
      const sc   = item.status === "active" ? C.red : C.green;
      const poin = (item.points ?? []).slice(0, 2).map(p => `• ${p.text}`).join("\n");
      const tgl  = item.tanggalKejadian ? new Date(item.tanggalKejadian).toLocaleDateString("id-ID") : "-";
      return [
        td(trunc(item.title ?? "", 30), alt),
        td(item.category ?? "-", alt, { align: "center" }),
        { text: item.priority ?? "-", options: { bold: true, color: C.white, fill: { color: pc }, fontSize: 8, align: "center", valign: "middle" } } as pptxgen.TableCell,
        { text: item.status === "active" ? "Aktif" : "Selesai", options: { bold: true, color: C.white, fill: { color: sc }, fontSize: 8, align: "center", valign: "middle" } } as pptxgen.TableCell,
        td(trunc(poin, 60), alt),
        td(tgl, alt, { align: "center" }),
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 1.62, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [2.3, 1.3, 1.0, 1.0, 5.53, 1.4],
    rowH: 0.28,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideCatatanTambahan(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  addHeader(s, `Catatan Tambahan – ${MONTHS[data.month]} ${data.year}`);
  addFooter(s, data.month, data.year);

  const filtered = data.catatanTambahan.filter(c => c.bulan === data.month && c.tahun === data.year);
  if (!filtered.length) { noData(s); return; }

  const rows: pptxgen.TableRow[] = [
    [th("No"), th("Judul"), th("Isi Catatan"), th("Status")],
    ...filtered.map((c, i) => {
      const alt = i % 2 === 1;
      const sc  = c.status === "active" ? C.green : C.gray;
      return [
        td(String(i + 1), alt, { align: "center" }),
        td(trunc(c.judul ?? "", 35), alt),
        td(trunc(c.isiCatatan ?? "", 100), alt),
        { text: c.status === "active" ? "Aktif" : "Arsip", options: { bold: true, color: C.white, fill: { color: sc }, fontSize: 8, align: "center", valign: "middle" } } as pptxgen.TableCell,
      ];
    }),
  ];

  s.addTable(rows, {
    x: 0.3, y: 0.85, w: SW - 0.6,
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: "Calibri",
    colW: [0.45, 2.8, 8.58, 1.0],
    rowH: 0.3,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function slideClosing(pptx: pptxgen, data: PPTXData) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: SW, h: SH, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
  s.addShape("rect", { x: 0, y: 3.5, w: SW, h: 0.06, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });
  s.addText("Terima Kasih", {
    x: 0.5, y: 1.5, w: SW - 1, h: 1.0,
    fontSize: 42, bold: true, color: C.white, align: "center",
  });
  s.addText("Sampai Jumpa Bulan Depan!", {
    x: 0.5, y: 2.65, w: SW - 1, h: 0.7,
    fontSize: 22, color: "93C5FD", align: "center",
  });
  s.addText(`${MONTHS[data.month]} ${data.year}  •  TSI Certification`, {
    x: 0.5, y: 3.75, w: SW - 1, h: 0.5,
    fontSize: 14, color: "CBD5E1", align: "center", italic: true,
  });
  s.addShape("rect", { x: 0, y: SH - 0.5, w: SW, h: 0.5, fill: { color: "0F2044" }, line: { color: "0F2044", width: 0 } });
  s.addText("Dokumen Internal – Rahasia", {
    x: 0.5, y: SH - 0.5, w: SW - 1, h: 0.5,
    fontSize: 9, color: "94A3B8", align: "center", valign: "middle",
  });
}

// ── Main Export ────────────────────────────────────────────────────────────

export async function generateMonthlyPPTX(data: PPTXData): Promise<void> {
  const pptx = new pptxgen();

  pptx.layout  = "LAYOUT_WIDE";
  pptx.title   = `Laporan Bulanan CRM ${MONTHS[data.month]} ${data.year}`;
  pptx.subject = "Laporan CRM Bulanan";
  pptx.author  = "TSI Certification";

  slideCover(pptx, data);
  slideKPI(pptx, data);
  slideStrukturDivisi(pptx, data);
  slideKolaborasiCRM(pptx, data);
  slidePencapaianCRM(pptx, data);
  slidePRMReferral(pptx, data);
  slideLaporanKunjungan(pptx, data);
  slideEngagement(pptx, data);
  slideNPS(pptx, data);
  slideFlyer(pptx, data);
  slideCustomerComplain(pptx, data);
  slideIsuKendala(pptx, data);
  slideCatatanTambahan(pptx, data);
  slideClosing(pptx, data);

  const fileName = `Laporan_CRM_${MONTHS[data.month]}_${data.year}.pptx`;
  await pptx.writeFile({ fileName });
}
