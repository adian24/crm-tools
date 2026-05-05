import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";
import pptxgen from "pptxgenjs";

// Di Vercel gunakan URL deployment; di local gunakan localhost
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Batas waktu eksekusi Vercel (butuh plan Pro untuk > 60s)
export const maxDuration = 300;

const MONTHS = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Modules that get a single full-page screenshot
const MODULES = [
  { key: "kpi",        url: "/dashboard-manager/kpi",                                      title: "KPI" },
  { key: "struktur",   url: "/dashboard-manager/struktur-divisi-crp",                      title: "Struktur Divisi CRP" },
  { key: "kolaborasi", url: "/dashboard-manager/kolaborasi-crm",                           title: "Kolaborasi CRM" },
  { key: "prm",        url: "/dashboard-manager/pencapaian-prm-referral",                  title: "Pencapaian PRM & Referral" },
  { key: "kunjungan",  url: "/dashboard-manager/laporan-kunjungan",                        title: "Laporan Kunjungan" },
  { key: "engagement", url: "/dashboard-manager/kunjungan-engagement-partnership",         title: "Engagement & Partnership" },
  { key: "nps",        url: "/dashboard-manager/nps",                                      title: "NPS" },
  { key: "flyer",      url: "/dashboard-manager/flyer",                                    title: "Flyer" },
  { key: "complain",   url: "/dashboard-manager/customer-complain",                        title: "Customer Complain" },
  { key: "isu",        url: "/dashboard-manager/isu-kendala",                              title: "Isu & Kendala" },
  { key: "catatan",    url: "/dashboard-manager/catatan-tambahan",                         title: "Catatan Tambahan" },
];

// Chart cards in dashboard-data that get individual screenshots
const DASHBOARD_DATA_CHARTS = [
  { id: "pptx-stats",           title: "Pencapaian CRM – Summary" },
  { id: "pptx-chart-pencapaian", title: "Pencapaian CRM – Target VS Pencapaian" },
  { id: "pptx-chart-kuadran",   title: "Pencapaian CRM – Kuadran Analytics" },
  { id: "pptx-chart-associate", title: "Pencapaian CRM – Associate Category" },
  { id: "pptx-chart-sales",     title: "Pencapaian CRM – Sales Performance" },
  { id: "pptx-chart-tahapan",   title: "Pencapaian CRM – Tahapan Audit" },
  { id: "pptx-chart-standar",   title: "Pencapaian CRM – Chart Standar" },
  { id: "pptx-chart-eacode",    title: "Pencapaian CRM – EA Code Distribution" },
  { id: "pptx-chart-trimming",  title: "Pencapaian CRM – Trimming Value" },
  { id: "pptx-chart-pareto",    title: "Pencapaian CRM – Pareto Alasan" },
  { id: "pptx-chart-tren",      title: "Pencapaian CRM – Tren Penjualan" },
];

const VIEWPORT = { width: 1600, height: 900 };

const HIDE_SIDEBAR_CSS = `
  [data-sidebar="sidebar"],
  [data-sidebar="sidebar-inset"] > * + *,
  aside,
  nav[class*="sidebar"],
  .sidebar {
    display: none !important;
  }
  [data-sidebar="sidebar-inset"] {
    margin-left: 0 !important;
    padding-left: 0 !important;
  }
  main {
    margin-left: 0 !important;
    padding-left: 16px !important;
  }
`;

async function getAuthenticatedContext(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  sessionJson: string,
) {
  const context = await browser.newContext({ viewport: VIEWPORT });

  // Use string form (not function+arg) — more compatible with @sparticuz/chromium.
  // Embeds the value directly so no Playwright argument serialisation is involved.
  await context.addInitScript(
    `window.localStorage.setItem("crm_user", ${JSON.stringify(sessionJson)});`
  );

  return context;
}

/** Radix UI Select: click trigger → pilih opsi by text */
async function selectOption(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof getAuthenticatedContext>>["newPage"]>>,
  triggerIndex: number,
  targetText: string,
): Promise<boolean> {
  try {
    const triggers = page.locator('button[role="combobox"]');
    const trigger  = triggers.nth(triggerIndex);
    if (await trigger.count() === 0) return false;

    await trigger.click();
    await page.waitForTimeout(200);

    // Radix portal mounts ke body, cari option by exact text
    const option = page.locator('[role="option"]').filter({ hasText: new RegExp(`^${targetText}$`) });
    if (await option.count() === 0) {
      await page.keyboard.press("Escape");
      return false;
    }
    await option.first().click();
    await page.waitForTimeout(200);
    return true;
  } catch {
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
}

/** Cari index trigger untuk bulan dan tahun dari semua combobox di halaman */
async function findAndSetFilters(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof getAuthenticatedContext>>["newPage"]>>,
  month: number,
  year: number,
) {
  try {
    const triggers = page.locator('button[role="combobox"]');
    const count    = await triggers.count();
    if (count === 0) return;

    for (let i = 0; i < Math.min(count, 8); i++) {
      // Buka dropdown sementara untuk cek isinya
      await triggers.nth(i).click();
      await page.waitForTimeout(200);

      const optionTexts = await page.locator('[role="option"]').allTextContents();
      const texts = optionTexts.map(t => t.trim());

      // Tutup dulu
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);

      const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
      const isMonthSelect = texts.some(t => MONTH_NAMES.includes(t));
      const isYearSelect  = texts.some(t => /^\d{4}$/.test(t));

      if (isMonthSelect) {
        await selectOption(page, i, MONTHS[month]);
      } else if (isYearSelect) {
        await selectOption(page, i, String(year));
      }
    }
  } catch (e) {
    console.warn("Filter set warning:", e);
  }
}

/** Tunggu konten selesai render — TIDAK pakai networkidle karena websocket/polling
 *  dari Supabase Realtime bisa bikin networkidle tidak pernah tercapai. */
async function waitForContent(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof getAuthenticatedContext>>["newPage"]>>,
) {
  // Tunggu JS bundle selesai (load = semua resource awal terdownload)
  await page.waitForLoadState("load").catch(() => {});

  // Tunggu InfinityLoader / auth loader hilang (auth check selesai)
  await page.waitForFunction(() => {
    return document.querySelectorAll('[class*="animate-pulse-ring"]').length === 0;
  }, { timeout: 8000 }).catch(() => {});

  // Buffer untuk API call + chart render
  await page.waitForTimeout(1200);
}

/** Navigate ke url, inject session, retry jika redirect ke /login */
async function gotoAuthenticated(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof getAuthenticatedContext>>["newPage"]>>,
  url: string,
  sessionJson: string,
) {
  // Belt-and-suspenders: page-level init script (string form)
  await page.addInitScript(
    `window.localStorage.setItem("crm_user", ${JSON.stringify(sessionJson)});`
  );

  // waitUntil:"load" — lebih cepat dari networkidle, tidak hang akibat websocket
  await page.goto(url, { waitUntil: "load" });

  // Set localStorage setelah load (sebelum React useEffect sempat redirect)
  await page.evaluate((userJson) => {
    window.localStorage.setItem("crm_user", userJson);
  }, sessionJson);

  await page.waitForTimeout(300);

  // Jika tetap redirect ke /login, inject ulang lalu navigate sekali lagi
  if (page.url().includes("/login")) {
    console.warn(`[pptx] Redirected to /login for ${url}, retrying...`);
    await page.evaluate((userJson) => {
      window.localStorage.setItem("crm_user", userJson);
    }, sessionJson);
    await page.goto(url, { waitUntil: "load" });
    await page.evaluate((userJson) => {
      window.localStorage.setItem("crm_user", userJson);
    }, sessionJson);
    await page.waitForTimeout(300);
  }
}

async function screenshotPage(
  context: Awaited<ReturnType<typeof getAuthenticatedContext>>,
  url: string,
  month: number,
  year: number,
  sessionJson: string,
): Promise<Buffer> {
  const page = await context.newPage();
  try {
    await gotoAuthenticated(page, `${BASE_URL}${url}`, sessionJson);
    await waitForContent(page);

    // Set filter bulan & tahun ke nilai yang dipilih user
    await findAndSetFilters(page, month, year);

    // Tunggu lagi setelah filter berubah (data reload)
    await waitForContent(page);

    // Screenshot hanya main content (tanpa sidebar)
    const mainEl = page.locator("main").first();
    const buffer = await mainEl.screenshot({
      type: "jpeg",
      quality: 90,
    });
    return buffer as unknown as Buffer;
  } finally {
    await page.close();
  }
}

/** Screenshot setiap chart card di halaman dashboard-data secara individual */
async function screenshotDashboardDataCharts(
  context: Awaited<ReturnType<typeof getAuthenticatedContext>>,
  year: number,
  sessionJson: string,
): Promise<{ title: string; buffer: Buffer }[]> {
  const page = await context.newPage();
  try {
    await gotoAuthenticated(page, `${BASE_URL}/dashboard-manager/dashboard-data`, sessionJson);
    await waitForContent(page);

    // Hide sidebar for clean screenshots
    await page.addStyleTag({ content: HIDE_SIDEBAR_CSS });

    // Set tahun filter (halaman ini tidak punya filter bulan)
    await findAndSetFilters(page, 0, year);
    await waitForContent(page);

    const results: { title: string; buffer: Buffer }[] = [];

    for (const chart of DASHBOARD_DATA_CHARTS) {
      const el = page.locator(`#${chart.id}`).first();
      const elCount = await el.count();
      if (elCount === 0) {
        console.warn(`Element #${chart.id} not found, skipping`);
        continue;
      }

      // Scroll element into view and wait for chart to re-render
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Screenshot hanya elemen chart tersebut
      const buffer = await el.screenshot({ type: "jpeg", quality: 90 });
      results.push({ title: chart.title, buffer: buffer as unknown as Buffer });
      console.log(`Screenshotted chart: ${chart.title}`);
    }

    return results;
  } finally {
    await page.close();
  }
}

function coverSlide(pptx: pptxgen, month: number, year: number) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: "1B3A6B" }, line: { color: "1B3A6B", width: 0 } });
  s.addShape("rect", { x: 0, y: 3.65, w: 13.33, h: 0.07, fill: { color: "2563EB" }, line: { color: "2563EB", width: 0 } });
  s.addText("LAPORAN BULANAN CRM", {
    x: 0.5, y: 1.5, w: 12.33, h: 1.1,
    fontSize: 40, bold: true, color: "FFFFFF", align: "center",
  });
  s.addText(`${MONTHS[month]} ${year}`, {
    x: 0.5, y: 2.75, w: 12.33, h: 0.8,
    fontSize: 28, color: "93C5FD", align: "center",
  });
  s.addText("TSI Certification", {
    x: 0.5, y: 3.9, w: 12.33, h: 0.55,
    fontSize: 16, color: "FFFFFF", align: "center", italic: true,
  });
  s.addShape("rect", { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: "0F2044" }, line: { color: "0F2044", width: 0 } });
  s.addText("Dokumen Internal – Rahasia", {
    x: 0.5, y: 7.0, w: 12.33, h: 0.5,
    fontSize: 9, color: "94A3B8", align: "center", valign: "middle",
  });
}

function screenshotSlide(pptx: pptxgen, title: string, imgBuffer: Buffer, month: number, year: number) {
  const s = pptx.addSlide();
  const base64  = imgBuffer.toString("base64");
  const imgData = `data:image/jpeg;base64,${base64}`;

  const HEADER_H = 0.45;
  const CONTENT_Y = HEADER_H;
  const CONTENT_H = 7.5 - HEADER_H;

  // Header bar biru gelap
  s.addShape("rect", {
    x: 0, y: 0, w: 13.33, h: HEADER_H,
    fill: { color: "1B3A6B" },
    line: { color: "1B3A6B", width: 0 },
  });
  s.addText(title, {
    x: 0.3, y: 0, w: 9.5, h: HEADER_H,
    fontSize: 14, bold: true, color: "FFFFFF", valign: "middle",
  });
  s.addText(`${MONTHS[month]} ${year}`, {
    x: 10.3, y: 0, w: 2.8, h: HEADER_H,
    fontSize: 11, color: "93C5FD", valign: "middle", align: "right",
  });

  s.addImage({
    data: imgData,
    x: 0, y: CONTENT_Y,
    w: 13.33, h: CONTENT_H,
    sizing: { type: "contain", w: 13.33, h: CONTENT_H },
  });
}

function closingSlide(pptx: pptxgen, month: number, year: number) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: "1B3A6B" }, line: { color: "1B3A6B", width: 0 } });
  s.addShape("rect", { x: 0, y: 3.5,  w: 13.33, h: 0.07, fill: { color: "2563EB" }, line: { color: "2563EB", width: 0 } });
  s.addText("Terima Kasih", {
    x: 0.5, y: 1.5, w: 12.33, h: 1.1,
    fontSize: 42, bold: true, color: "FFFFFF", align: "center",
  });
  s.addText("Sampai Jumpa Bulan Depan!", {
    x: 0.5, y: 2.65, w: 12.33, h: 0.7,
    fontSize: 22, color: "93C5FD", align: "center",
  });
  s.addText(`${MONTHS[month]} ${year}  •  TSI Certification`, {
    x: 0.5, y: 3.75, w: 12.33, h: 0.5,
    fontSize: 14, color: "CBD5E1", align: "center", italic: true,
  });
  s.addShape("rect", { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: "0F2044" }, line: { color: "0F2044", width: 0 } });
  s.addText("Dokumen Internal – Rahasia", {
    x: 0.5, y: 7.0, w: 12.33, h: 0.5,
    fontSize: 9, color: "94A3B8", align: "center", valign: "middle",
  });
}

export async function POST(req: NextRequest) {
  let browser;
  try {
    const { month, year, sessionJson } = await req.json();

    if (!sessionJson) {
      return NextResponse.json({ error: "Session tidak ditemukan. Pastikan Anda sudah login." }, { status: 401 });
    }

    // Launch headless browser — sparticuz di Vercel, playwright default di local
    if (process.env.VERCEL) {
      const chromiumSparticuz = (await import("@sparticuz/chromium")).default;
      browser = await chromium.launch({
        args: chromiumSparticuz.args,
        executablePath: await chromiumSparticuz.executablePath(),
        headless: true,
      });
    } else {
      browser = await chromium.launch({ headless: true });
    }
    const context = await getAuthenticatedContext(browser, sessionJson);

    // Screenshot regular modules (single full-page per module)
    const screenshots: Record<string, Buffer> = {};
    for (const mod of MODULES) {
      console.log(`Screenshotting: ${mod.title}...`);
      screenshots[mod.key] = await screenshotPage(context, mod.url, month, year, sessionJson);
    }

    // Screenshot dashboard-data chart cards individually
    console.log("Screenshotting dashboard-data chart cards...");
    const dashboardCharts = await screenshotDashboardDataCharts(context, year, sessionJson);

    await browser.close();
    browser = undefined;

    // Build PPTX
    const pptx = new pptxgen();
    pptx.layout  = "LAYOUT_WIDE";
    pptx.title   = `Laporan Bulanan CRM ${MONTHS[month]} ${year}`;
    pptx.subject = "Laporan CRM Bulanan";
    pptx.author  = "TSI Certification";

    coverSlide(pptx, month, year);

    // KPI, Struktur, Kolaborasi (before pencapaian)
    for (const key of ["kpi", "struktur", "kolaborasi"]) {
      const mod = MODULES.find(m => m.key === key)!;
      screenshotSlide(pptx, mod.title, screenshots[mod.key], month, year);
    }

    // Pencapaian CRM – one slide per chart card
    for (const chart of dashboardCharts) {
      screenshotSlide(pptx, chart.title, chart.buffer, month, year);
    }

    // Remaining modules after pencapaian
    for (const key of ["prm", "kunjungan", "engagement", "nps", "flyer", "complain", "isu", "catatan"]) {
      const mod = MODULES.find(m => m.key === key)!;
      screenshotSlide(pptx, mod.title, screenshots[mod.key], month, year);
    }

    closingSlide(pptx, month, year);

    const output  = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer;

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Laporan_CRM_${MONTHS[month]}_${year}.pptx"`,
      },
    });
  } catch (err: unknown) {
    if (browser) await browser.close().catch(() => {});
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("generate-pptx error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
