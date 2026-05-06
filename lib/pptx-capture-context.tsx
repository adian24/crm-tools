"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PageItem   = { type: "page";   url: string; title: string; useMonthFilter?: boolean };
type ChartsItem = { type: "charts"; url: string; charts: { id: string; title: string }[] };
type CaptureItem = PageItem | ChartsItem;

interface PptxCaptureCtx {
  startCapture: (month: number, year: number) => Promise<void>;
  isCapturing: boolean;
}

// ---------------------------------------------------------------------------
// Capture sequence — matches slide order
// ---------------------------------------------------------------------------
const CAPTURE_SEQUENCE: CaptureItem[] = [
  { type: "page",   url: "/dashboard-manager/kpi",                                title: "KPI",                       useMonthFilter: true  },
  { type: "page",   url: "/dashboard-manager/struktur-divisi-crp",                title: "Struktur Divisi CRP",       useMonthFilter: false },
  { type: "page",   url: "/dashboard-manager/kolaborasi-crm",                     title: "Kolaborasi CRM",            useMonthFilter: false },
  {
    type: "charts",
    url: "/dashboard-manager/dashboard-data",
    charts: [
      { id: "pptx-stats",            title: "Pencapaian CRM – Summary" },
      { id: "pptx-chart-pencapaian", title: "Pencapaian CRM – Target VS Pencapaian" },
      { id: "pptx-chart-kuadran",    title: "Pencapaian CRM – Kuadran Analytics" },
      { id: "pptx-chart-associate",  title: "Pencapaian CRM – Associate Category" },
      { id: "pptx-chart-sales",      title: "Pencapaian CRM – Sales Performance" },
      { id: "pptx-chart-tahapan",    title: "Pencapaian CRM – Tahapan Audit" },
      { id: "pptx-chart-standar",    title: "Pencapaian CRM – Chart Standar" },
      { id: "pptx-chart-eacode",     title: "Pencapaian CRM – EA Code Distribution" },
      { id: "pptx-chart-trimming",   title: "Pencapaian CRM – Trimming Value" },
      { id: "pptx-chart-pareto",     title: "Pencapaian CRM – Pareto Alasan" },
      { id: "pptx-chart-tren",       title: "Pencapaian CRM – Tren Penjualan" },
    ],
  },
  { type: "page", url: "/dashboard-manager/pencapaian-prm-referral",              title: "Pencapaian PRM & Referral", useMonthFilter: true  },
  { type: "page", url: "/dashboard-manager/laporan-kunjungan",                    title: "Laporan Kunjungan",         useMonthFilter: true  },
  { type: "page", url: "/dashboard-manager/kunjungan-engagement-partnership",     title: "Engagement & Partnership",  useMonthFilter: true  },
  { type: "page", url: "/dashboard-manager/nps",                                  title: "NPS",                       useMonthFilter: true  },
  { type: "page", url: "/dashboard-manager/flyer",                                title: "Flyer",                     useMonthFilter: true  },
  { type: "page", url: "/dashboard-manager/customer-complain",                    title: "Customer Complain",         useMonthFilter: true  },
  { type: "page", url: "/dashboard-manager/isu-kendala",                          title: "Isu & Kendala",             useMonthFilter: true  },
  { type: "page", url: "/dashboard-manager/catatan-tambahan",                     title: "Catatan Tambahan",          useMonthFilter: true  },
];

const TOTAL_STEPS = CAPTURE_SEQUENCE.reduce(
  (n, item) => n + (item.type === "charts" ? item.charts.length : 1),
  0,
);

const MONTHS = [
  "", "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const MONTH_NAMES = MONTHS.slice(1); // ["Januari", ..., "Desember"]

// ---------------------------------------------------------------------------
// Core timing helpers
// ---------------------------------------------------------------------------
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Tunggu hingga DOM tidak berubah selama `stableMs` ms berturut-turut.
 * 1500 ms dipilih karena cukup panjang untuk Supabase API call selesai
 * dan React commit hasil render, tapi tidak terlalu lama.
 * `timeoutMs` sebagai failsafe jika ada realtime polling yang terus mutate DOM.
 */
function waitForDomStable(stableMs = 1500, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve) => {
    let stableTimer: ReturnType<typeof setTimeout>;

    const finish = () => {
      observer.disconnect();
      clearTimeout(hardLimit);
      resolve();
    };

    const hardLimit = setTimeout(finish, timeoutMs);

    const observer = new MutationObserver(() => {
      clearTimeout(stableTimer);
      stableTimer = setTimeout(finish, stableMs);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      // attributes=false: abaikan perubahan attribute dari CSS animation/transition
    });

    // Jika DOM sudah stabil sejak awal, tetap tunggu stableMs penuh
    stableTimer = setTimeout(finish, stableMs);
  });
}

/**
 * Tunggu halaman selesai render setelah navigasi.
 * stableMs 1500 ms = cukup untuk API call Supabase + React re-render commit.
 */
async function waitForContentLoaded(): Promise<void> {
  await sleep(250); // beri React waktu mulai render route baru
  await waitForDomStable(1500, 15_000);
  await sleep(200); // buffer animasi chart frame pertama
}

// ---------------------------------------------------------------------------
// Filter helper — klik Radix UI Select dropdown secara DOM
// ---------------------------------------------------------------------------

/** Tutup dropdown yang sedang terbuka dengan klik luar */
async function closOpenDropdown(): Promise<void> {
  // Radix dismisses on Escape or outside click
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
  await sleep(150);
}

/**
 * Klik combobox trigger, periksa isi option, pilih nilai yang tepat.
 * Return true jika berhasil memilih, false jika trigger bukan month/year select.
 */
async function trySelectCombobox(
  trigger: HTMLElement,
  month: number,
  year: number,
): Promise<boolean> {
  trigger.click();
  await sleep(300); // tunggu Radix portal render options

  const options = Array.from(
    document.querySelectorAll<HTMLElement>('[role="option"]'),
  );

  if (options.length === 0) {
    await closOpenDropdown();
    return false;
  }

  const texts = options.map((o) => o.textContent?.trim() ?? "");

  const isMonthSelect = texts.some((t) => MONTH_NAMES.includes(t));
  const isYearSelect  = texts.some((t) => /^\d{4}$/.test(t));

  if (isMonthSelect && month > 0) {
    const target = options.find((o) => o.textContent?.trim() === MONTHS[month]);
    if (target) { target.click(); await sleep(250); return true; }
  } else if (isYearSelect) {
    const target = options.find((o) => o.textContent?.trim() === String(year));
    if (target) { target.click(); await sleep(250); return true; }
  }

  // Bukan dropdown yang kita cari, atau nilai tidak ditemukan — tutup
  await closOpenDropdown();
  return false;
}

/**
 * Set semua filter bulan/tahun yang ada di halaman saat ini.
 * Scans seluruh combobox, pilih yang sesuai bulan/tahun yang diminta.
 * month=0 berarti skip filter bulan (hanya set tahun).
 */
async function setPageFilters(month: number, year: number): Promise<boolean> {
  const triggers = Array.from(
    document.querySelectorAll<HTMLElement>('button[role="combobox"]'),
  );
  if (triggers.length === 0) return false;

  let changed = false;
  for (const trigger of triggers) {
    const selected = await trySelectCombobox(trigger, month, year);
    if (selected) changed = true;
  }
  return changed;
}

// ---------------------------------------------------------------------------
// Capture helpers
// ---------------------------------------------------------------------------
const captureFilter = (node: Node) =>
  !(node instanceof Element && node.hasAttribute("data-pptx-ignore"));

async function captureMainContent(): Promise<string> {
  const { toJpeg } = await import("html-to-image");

  const scrollEl = document.getElementById("main-scroll-container");
  if (scrollEl) scrollEl.scrollTop = 0;
  await sleep(100);

  const target = (scrollEl ??
    document.querySelector("main") ??
    document.body) as HTMLElement;

  return toJpeg(target, { quality: 0.85, pixelRatio: 1, backgroundColor: "#ffffff", filter: captureFilter });
}

/**
 * Scroll seluruh isi #main-scroll-container dari atas ke bawah perlahan-lahan,
 * lalu kembali ke atas. Ini memastikan semua chart yang menggunakan
 * IntersectionObserver / lazy-render sudah di-mount sebelum kita capture.
 */
async function scrollRevealAll(): Promise<void> {
  const scrollEl = document.getElementById("main-scroll-container");
  if (!scrollEl) return;

  const step = Math.max(scrollEl.clientHeight * 0.6, 400);

  // Scroll ke bawah, pause di setiap posisi
  for (let top = 0; top < scrollEl.scrollHeight; top += step) {
    scrollEl.scrollTop = top;
    await sleep(600);
  }
  // Pastikan sampai paling bawah
  scrollEl.scrollTop = scrollEl.scrollHeight;
  await sleep(600);
  // Kembali ke atas
  scrollEl.scrollTop = 0;
  await sleep(300);
}

/**
 * Cari elemen #id, retry dengan scrolling jika belum di-render.
 * Chart di dashboard-data baru di-mount setelah di-scroll ke area mereka.
 */
async function findElement(id: string): Promise<HTMLElement | null> {
  // Coba langsung dulu
  let el = document.getElementById(id);
  if (el) return el;

  // Belum ketemu — scroll halaman perlahan sambil cari
  const scrollEl = document.getElementById("main-scroll-container");
  if (!scrollEl) return null;

  const step = Math.max(scrollEl.clientHeight * 0.5, 300);
  for (let top = 0; top <= scrollEl.scrollHeight; top += step) {
    scrollEl.scrollTop = top;
    await sleep(400);
    el = document.getElementById(id);
    if (el) return el;
  }

  console.warn(`[pptx-capture] #${id} tidak ditemukan meskipun sudah di-scroll`);
  return null;
}

async function captureChartElement(id: string): Promise<string | null> {
  const { toJpeg } = await import("html-to-image");

  const el = await findElement(id);
  if (!el) return null;

  // Scroll elemen ke tengah viewport agar parent overflow tidak meng-clip
  el.scrollIntoView({ behavior: "instant", block: "center" });
  await sleep(500);

  return toJpeg(el, { quality: 0.85, pixelRatio: 1, backgroundColor: "#ffffff", filter: captureFilter });
}

// ---------------------------------------------------------------------------
// PPTX builder
// ---------------------------------------------------------------------------
async function buildAndDownload(
  slides: { title: string; dataUrl: string }[],
  month: number,
  year: number,
) {
  const label    = `${MONTHS[month]} ${year}`;
  const HEADER_H = 0.45;
  const CONTENT_H = 7.5 - HEADER_H;

  // ── 1. Fetch cover & closing sebagai PNG data URL ─────────────────────────
  async function fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf  = await res.arrayBuffer();
      const mime = res.headers.get("content-type") ?? "image/jpeg";
      const b64  = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return `data:${mime};base64,${b64}`;
    } catch {
      return null;
    }
  }

  const [coverPng, closingPng] = await Promise.all([
    fetchImageAsDataUrl("/templateppt/cover.jpeg"),
    fetchImageAsDataUrl("/templateppt/closing.jpeg"),
  ]);

  // ── 2. Build PPTX dengan pptxgenjs ────────────────────────────────────────
  const { default: pptxgen } = await import("pptxgenjs");
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";

  // Cover — pakai JPEG template jika ada, fallback ke solid shape
  const cover = pptx.addSlide();
  if (coverPng) {
    cover.addImage({ data: coverPng, x: 0, y: 0, w: 13.33, h: 7.5 });
    // Overlay teks "Business Review [Bulan] [Tahun]" di area kiri tengah
    cover.addText("Business Review", {
      x: 0.35, y: 2.8, w: 5.5, h: 0.65,
      fontSize: 28, bold: true, color: "1B3A6B", align: "left",
      fontFace: "Calibri",
    });
    cover.addText(label, {
      x: 0.35, y: 3.4, w: 5.5, h: 0.55,
      fontSize: 22, bold: false, color: "1B3A6B", align: "left",
      fontFace: "Calibri",
    });
  } else {
    cover.addShape("rect", { x: 0, y: 0,    w: 13.33, h: 7.5,  fill: { color: "1B3A6B" }, line: { color: "1B3A6B", width: 0 } });
    cover.addShape("rect", { x: 0, y: 3.65, w: 13.33, h: 0.07, fill: { color: "2563EB" }, line: { color: "2563EB", width: 0 } });
    cover.addText("LAPORAN BULANAN CRM", { x: 0.5, y: 1.5,  w: 12.33, h: 1.1,  fontSize: 40, bold: true,   color: "FFFFFF", align: "center" });
    cover.addText(label,                  { x: 0.5, y: 2.75, w: 12.33, h: 0.8,  fontSize: 28,               color: "93C5FD", align: "center" });
    cover.addText("TSI Certification",    { x: 0.5, y: 3.9,  w: 12.33, h: 0.55, fontSize: 16, italic: true, color: "FFFFFF", align: "center" });
  }

  // Content slides
  for (const { title, dataUrl } of slides) {
    const s = pptx.addSlide();
    s.addShape("rect", { x: 0, y: 0, w: 13.33, h: HEADER_H, fill: { color: "1B3A6B" }, line: { color: "1B3A6B", width: 0 } });
    s.addText(title, { x: 0.3,  y: 0, w: 9.5,  h: HEADER_H, fontSize: 14, bold: true, color: "FFFFFF", valign: "middle" });
    s.addText(label, { x: 10.3, y: 0, w: 2.8,  h: HEADER_H, fontSize: 11,             color: "93C5FD", valign: "middle", align: "right" });
    s.addImage({ data: dataUrl, x: 0, y: HEADER_H, w: 13.33, h: CONTENT_H,
      sizing: { type: "contain", w: 13.33, h: CONTENT_H } });
  }

  // Closing — pakai PNG template jika ada, fallback ke solid shape
  const closing = pptx.addSlide();
  if (closingPng) {
    closing.addImage({ data: closingPng, x: 0, y: 0, w: 13.33, h: 7.5 });
  } else {
    closing.addShape("rect", { x: 0, y: 0,   w: 13.33, h: 7.5,  fill: { color: "1B3A6B" }, line: { color: "1B3A6B", width: 0 } });
    closing.addShape("rect", { x: 0, y: 3.5, w: 13.33, h: 0.07, fill: { color: "2563EB" }, line: { color: "2563EB", width: 0 } });
    closing.addText("Terima Kasih",              { x: 0.5, y: 1.5,  w: 12.33, h: 1.1, fontSize: 42, bold: true,   color: "FFFFFF", align: "center" });
    closing.addText("Sampai Jumpa Bulan Depan!", { x: 0.5, y: 2.65, w: 12.33, h: 0.7, fontSize: 22,               color: "93C5FD", align: "center" });
    closing.addText(`${label}  •  TSI Certification`, { x: 0.5, y: 3.75, w: 12.33, h: 0.5, fontSize: 14, italic: true, color: "CBD5E1", align: "center" });
  }

  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer;

  // ── 3. Download ────────────────────────────────────────────────────────────
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href,
    download: `Laporan_CRM_${MONTHS[month]}_${year}.pptx`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const PptxCaptureContext = createContext<PptxCaptureCtx>({
  startCapture: async () => {},
  isCapturing: false,
});

export function usePptxCapture() {
  return useContext(PptxCaptureContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function PptxCaptureProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCapturing, setIsCapturing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [step, setStep]     = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const startCapture = useCallback(
    async (month: number, year: number) => {
      setIsCapturing(true);
      setStep(0);

      try {
        const slides: { title: string; dataUrl: string }[] = [];
        let current = 0;

        for (const item of CAPTURE_SEQUENCE) {
          const pageLabel = item.type === "charts" ? "Pencapaian CRM" : item.title;
          setProgressText(`Membuka: ${pageLabel}...`);

          // --- Navigasi ---
          if (window.location.pathname !== item.url) {
            router.push(item.url);
          }

          // --- Tunggu halaman + data awal selesai load ---
          await waitForContentLoaded();

          // --- Set filter bulan / tahun ---
          const useMonth = item.type === "page" ? (item.useMonthFilter ?? true) : true;
          const filterMonth = useMonth ? month : 0;

          setProgressText(`Set filter ${MONTHS[month]} ${year}: ${pageLabel}...`);
          const filterChanged = await setPageFilters(filterMonth, year);

          if (filterChanged) {
            // Ada filter berubah → tunggu data reload setelah filter
            setProgressText(`Menunggu data ${MONTHS[month]} ${year}: ${pageLabel}...`);
            await waitForDomStable(1500, 10_000);
            await sleep(200);
          }

          // --- Screenshot ---
          if (item.type === "page") {
            setProgressText(`Screenshot: ${item.title}`);
            const dataUrl = await captureMainContent();
            slides.push({ title: item.title, dataUrl });
            current++;
            setStep(current);

          } else {
            // Dashboard-data: scroll seluruh halaman dulu agar semua chart
            // yang pakai IntersectionObserver / lazy-render sudah di-mount.
            setProgressText(`Scroll reveal semua chart: ${pageLabel}...`);
            await scrollRevealAll();
            await waitForDomStable(1500, 8_000);

            for (const chart of item.charts) {
              setProgressText(`Screenshot: ${chart.title}`);
              const dataUrl = await captureChartElement(chart.id);
              if (dataUrl) slides.push({ title: chart.title, dataUrl });
              current++;
              setStep(current);
            }
          }
        }

        setProgressText("Menyusun file PowerPoint...");
        await buildAndDownload(slides, month, year);
        toast.success(`Laporan CRM ${MONTHS[month]} ${year} berhasil didownload!`);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Gagal generate PPTX: ${msg}`);
        console.error("[pptx-capture]", err);

      } finally {
        router.push("/dashboard-manager/generate-pptx");
        setIsCapturing(false);
        setProgressText("");
        setStep(0);
      }
    },
    [router],
  );

  const pct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <PptxCaptureContext.Provider value={{ startCapture, isCapturing }}>
      {children}

      {mounted && isCapturing &&
        createPortal(
          <div
            data-pptx-ignore
            style={{
              position: "fixed", inset: 0, zIndex: 99999,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
            }}
          >
            <div style={{
              background: "white", borderRadius: 16, padding: "32px 36px",
              minWidth: 340, maxWidth: 420, boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              fontFamily: "inherit",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                    <line x1="9" y1="11" x2="15" y2="11"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>Generating PowerPoint</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6B7280", marginTop: 2 }}>Harap jangan tutup tab ini</p>
                </div>
              </div>

              <div style={{ background: "#E5E7EB", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 12 }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg,#2563EB,#7C3AED)",
                  width: `${pct}%`, transition: "width 0.3s ease",
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{step} / {TOTAL_STEPS} screenshot</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB" }}>{pct}%</span>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: "#374151", minHeight: 18, textAlign: "center" }}>
                {progressText}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </PptxCaptureContext.Provider>
  );
}
