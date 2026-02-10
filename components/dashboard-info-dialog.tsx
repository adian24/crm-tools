"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  PieChart,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Info,
  SlidersHorizontal
} from 'lucide-react';

interface DashboardInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DashboardInfoDialog = ({ open, onOpenChange }: DashboardInfoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[92vh] sm:max-h-[92vh] p-4 gap-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:max-w-5xl flex flex-col overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Panduan Dashboard Pencapaian</DialogTitle>
              <DialogDescription>
                Penjelasan lengkap tentang chart dan metrik yang ditampilkan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Apa itu Dashboard Pencapaian?</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Dashboard ini menampilkan data target CRM (Customer Relationship Management) yang berisi informasi
                  lengkap tentang target perusahaan, status pencapaian, distribusi standar, dan analisis performa
                  sales & associate secara real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Summary Cards (Kartu Ringkasan) - Kondisi & Perhitungan
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-4">
              {/* Contract Base Target */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-1">Target Kontrak (Contract Base 90%)</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Nilai target kontrak yang harus dicapai (90% dari total nilai kontrak)
                    </p>
                    <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-purple-300 dark:border-purple-700">
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        <strong>Source Fields:</strong> <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">hargaTerupdate</code> (harga final kontrak)
                      </p>
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                        <strong>Filter Conditions:</strong>
                      </p>
                      <ul className="text-xs font-mono text-slate-700 dark:text-slate-300 ml-4 list-disc">
                        <li><code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">filterTahun</code> (tahun target)</li>
                        <li><code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">filterStatusSertifikatTerbit</code> (status sertifikat: Terbit/Non-Terbit/All)</li>
                        <li><code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">filterPicCrm</code> (PIC CRM)</li>
                        <li><code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">filterKategoriProduk</code> (ISO/SUSTAIN/SEMUA)</li>
                      </ul>
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-2">
                        <strong>Formula:</strong>
                      </p>
                      <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1">
                        <p className="text-xs font-mono text-slate-800 dark:text-slate-200">
                          totalNilaiKontrak = SUM(hargaTerupdate)<br/>
                          dengan filter di atas
                        </p>
                        <p className="text-xs font-mono text-purple-700 dark:text-purple-300 mt-2 font-bold">
                          Target = totalNilaiKontrak × 0.9 (90%)
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                        💡 <strong>Kenapa 90%?</strong> Target realistis yang ditetapkan adalah 90% dari total nilai kontrak yang tersedia, memberikan ruang 10% untuk toleransi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Projects */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Total Projects (Perusahaan)</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Jumlah <strong>perusahaan UNIK</strong> (satu perusahaan bisa punya banyak standar)
                    </p>
                    <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-slate-300 dark:border-slate-600">
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        <strong>Kondisi:</strong> Kelompokkan berdasarkan nama perusahaan, lalu hitung jumlah grupnya.
                      </p>
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                        <strong>Formula:</strong> COUNT(DISTINCT namaPerusahaan)
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                        💡 Contoh: Jika "PT ABC" punya 5 standar (ISO 9001, 14001, 45001, 27001, 37001), itu dihitung sebagai 1 project.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Status Breakdown with Values */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status Distribution (Breakdown per Status - Count & Value)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Setiap status menampilkan <strong>Count</strong> (jumlah target) dan <strong>Value</strong> (total nilai dalam rupiah).<br/>
                  <strong>Percentage</strong> dihitung berdasarkan Total Nilai Kontrak.
                </p>

                {/* WAITING */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">WAITING</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Target baru, belum diproses sama sekali</p>
                  <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-blue-300 dark:border-blue-700">
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      <strong>Count Formula:</strong> COUNT(status = 'WAITING' + statusSertifikat filter + tahun filter)
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Value Formula:</strong> SUM(hargaKontrak) WHERE status = 'WAITING' + statusSertifikat filter + tahun filter
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Percentage:</strong> (Value ÷ totalNilaiKontrak) × 100%
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 Menggunakan <code>hargaKontrak</code> (harga awal), bukan hargaTerupdate
                    </p>
                  </div>
                </div>

                {/* PROSES */}
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100">PROSES</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Sedang dalam pengerjaan/negosiasi</p>
                  <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-purple-300 dark:border-purple-700">
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      <strong>Count Formula:</strong> COUNT(status = 'PROSES' + statusSertifikat filter + tahun filter)
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Value Formula:</strong> SUM(hargaKontrak) WHERE status = 'PROSES' + statusSertifikat filter + tahun filter
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Percentage:</strong> (Value ÷ totalNilaiKontrak) × 100%
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      💡 Menggunakan <code>hargaKontrak</code> (harga awal), bukan hargaTerupdate
                    </p>
                  </div>
                </div>

                {/* DONE */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border-2 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">DONE (Pencapaian)</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Sudah deal/kontrak tercapai ✅</p>
                  <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-emerald-300 dark:border-emerald-700">
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      <strong>Count Formula:</strong> COUNT(status = 'DONE' + statusSertifikat filter + tahun filter + bulanTtdNotif terisi)
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Value Formula:</strong> SUM(hargaTerupdate) WHERE status = 'DONE' + bulanTtdNotif is not empty + statusSertifikat filter + tahun dari bulanTtdNotif sesuai filter
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Percentage:</strong> (Value ÷ (totalNilaiKontrak × 0.9)) × 100% ✨
                    </p>
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-300 dark:border-amber-700">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <strong>⚠️ Wajib Diisi:</strong> Untuk status DONE, field berikut WAJIB diisi:
                      </p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 ml-4 list-disc">
                        <li><strong>bulanTtdNotif</strong> (Bulan TTD Notif) - Tanggal kontrak ditandatangani</li>
                        <li><strong>hargaTerupdate</strong> (Harga Terupdate) - Nilai final kontrak</li>
                      </ul>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                      💡 HANYA DONE yang menggunakan <code>hargaTerupdate</code> dan menghitung percentage terhadap TARGET (90%)
                    </p>
                  </div>
                </div>

                {/* SUSPEND */}
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <p className="text-sm font-bold text-orange-900 dark:text-orange-100">SUSPEND</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Ditangguhkan (pause dulu)</p>
                  <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-orange-300 dark:border-orange-700">
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      <strong>Count Formula:</strong> COUNT(status = 'SUSPEND' + statusSertifikat filter + tahun filter)
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Value Formula:</strong> SUM(hargaKontrak) WHERE status = 'SUSPEND' + statusSertifikat filter + tahun filter
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Percentage:</strong> (Value ÷ totalNilaiKontrak) × 100%
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-300 dark:border-blue-700">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>💡 Rekomendasi:</strong> Sebaiknya isi <strong>alasan</strong> untuk dokumentasi kenapa ditangguhkan.
                      </p>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      💡 Menggunakan <code>hargaKontrak</code> (harga awal)
                    </p>
                  </div>
                </div>

                {/* LOSS */}
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <p className="text-sm font-bold text-red-900 dark:text-red-100">LOSS</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Gagal/deal fell off (client tidak jadi)</p>
                  <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-red-300 dark:border-red-700">
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      <strong>Count Formula:</strong> COUNT(status = 'LOSS' + statusSertifikat filter + tahun filter)
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Value Formula:</strong> SUM(hargaKontrak) WHERE status = 'LOSS' + statusSertifikat filter + tahun filter
                    </p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Percentage:</strong> (Value ÷ totalNilaiKontrak) × 100%
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-300 dark:border-blue-700">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>💡 Rekomendasi:</strong> Sebaiknya isi <strong>alasan</strong> untuk analisis root cause kegagalan.
                      </p>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      💡 Menggunakan <code>hargaKontrak</code> (harga awal)
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Table */}
              <div className="mt-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">📊 Quick Reference - Summary Table (Count & Value)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-600">
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Kondisi</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Field untuk Value</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Wajib Isi</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Arti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="py-2 px-3"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>WAITING</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">status = 'WAITING'</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400"><code>hargaKontrak</code></td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">-</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Target baru</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2"></span>PROSES</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">status = 'PROSES'</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400"><code>hargaKontrak</code></td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">-</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Sedang dikerjakan</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>DONE</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">status = 'DONE' + <code>bulanTtdNotif</code> terisi</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-semibold"><code>hargaTerupdate</code> ✨</td>
                        <td className="py-2 px-3 text-red-600 dark:text-red-400 font-semibold">bulanTtdNotif + hargaTerupdate</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">✅ Deal berhasil</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2"></span>SUSPEND</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">status = 'SUSPEND'</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400"><code>hargaKontrak</code></td>
                        <td className="py-2 px-3 text-blue-600 dark:text-blue-400">alasan (rekomendasi)</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">⏸️ Ditangguhkan</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>LOSS</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">status = 'LOSS'</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400"><code>hargaKontrak</code></td>
                        <td className="py-2 px-3 text-blue-600 dark:text-blue-400">alasan (rekomendasi)</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">❌ Deal gagal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-2">💰 Perbedaan hargaKontrak vs hargaTerupdate:</p>
                  <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <li>• <strong>hargaKontrak</strong>: Harga awal/estimasi saat target dibuat. Digunakan untuk WAITING, PROSES, SUSPEND, LOSS.</li>
                    <li>• <strong>hargaTerupdate</strong>: Harga final/real setelah deal. HANYA diisi untuk status DONE dan digunakan untuk menghitung pencapaian.</li>
                    <li>• <strong>Kenapa?</strong> Harga bisa berubah saat negosiasi. DONE menggunakan harga final yang lebih akurat.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Calculations & Formulas */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Perhitungan Tambahan & Detail Metrik
            </h3>
            <div className="space-y-4">
              {/* Achievement Percentage */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">🎯 Persentase Pencapaian (Achievement %)</p>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-md p-3 border border-emerald-300 dark:border-emerald-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Persentase pencapaian dihitung berbeda tergantung status yang dipilih:
                  </p>
                  <ul className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• <strong>DONE/All:</strong> (SUM(hargaTerupdate) ÷ (totalNilaiKontrak × 0.9)) × 100%</li>
                    <li>• <strong>PROSES/SUSPEND/LOSS/WAITING:</strong> (SUM(hargaKontrak) ÷ totalNilaiKontrak) × 100%</li>
                  </ul>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    💡 DONE dibandingkan dengan TARGET (90%), sedangkan status lain dibandingkan dengan total nilai kontrak (100%)
                  </p>
                </div>
              </div>

              {/* Monthly Charts */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">📅 Chart Bulanan (Monthly Charts)</p>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3 border border-blue-300 dark:border-blue-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Chart bulanan mengelompokkan data berdasarkan bulan dan menghitung:
                  </p>
                  <ul className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• <strong>Count:</strong> Jumlah target per bulan</li>
                    <li>• <strong>Value:</strong> Total nilai kontrak per bulan</li>
                    <li>• <strong>Target Line:</strong> 90% dari total nilai kontrak per bulan</li>
                  </ul>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    💡 Data dikelompokkan berdasarkan <code>bulanExpDate</code> (untuk non-DONE) atau <code>bulanTtdNotif</code> (untuk DONE)
                  </p>
                </div>
              </div>

              {/* PIC CRM Performance */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">👥 Performa PIC CRM (DHA vs MRC)</p>
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-md p-3 border border-purple-300 dark:border-purple-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Setiap PIC memiliki kartu performa yang menampilkan:
                  </p>
                  <ul className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• <strong>Total Target:</strong> COUNT semua data PIC tersebut</li>
                    <li>• <strong>Target Value:</strong> SUM(hargaKontrak) semua data PIC tersebut</li>
                    <li>• <strong>DONE:</strong> COUNT(status = 'DONE') + SUM(hargaTerupdate)</li>
                    <li>• <strong>PROSES/SUSPEND/LOSS/WAITING:</strong> COUNT + SUM(hargaKontrak)</li>
                    <li>• <strong>Achievement %:</strong> (DONE Value ÷ (Target Value × 0.9)) × 100%</li>
                    <li>• <strong>Visits:</strong> Actual visits ÷ Target visits (count/2)</li>
                  </ul>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    💡 Target kunjungan = 50% dari total target (dibulatkan)
                  </p>
                </div>
              </div>

              {/* Trimming vs Loss */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">📈 Trimming vs Loss Value</p>
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-md p-3 border border-orange-300 dark:border-orange-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Chart TR menampilkan perbedaan antara harga kontrak dan harga terupdate:
                  </p>
                  <ul className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• <strong>Trimming:</strong> SUM(hargaTerupdate - hargaKontrak) WHERE hargaTerupdate {'>'} hargaKontrak</li>
                    <li>• <strong>Loss:</strong> SUM(hargaKontrak - hargaTerupdate) WHERE hargaTerupdate {'<'} hargaKontrak</li>
                  </ul>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    💡 Trimming = keuntungan tambahan dari negosiasi harga lebih tinggi<br/>
                    💡 Loss = penurunan harga dari negosiasi (deal lebih rendah dari estimasi)
                  </p>
                </div>
              </div>

              {/* Kuadran Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">💎 Distribusi Kuadran (GOLD/SILVER/BRONZE)</p>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-md p-3 border border-yellow-300 dark:border-yellow-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Kuadran mengkategorikan client berdasarkan potensi revenue:
                  </p>
                  <ul className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• <strong>Count:</strong> COUNT(category = 'GOLD'/'SILVER'/'BRONZE')</li>
                    <li>• <strong>Value:</strong> SUM(hargaKontrak) per category</li>
                    <li>• <strong>Unique Companies:</strong> COUNT(DISTINCT namaPerusahaan) per category</li>
                  </ul>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                    💡 GOLD = prioritas tertinggi, SILVER = prioritas tinggi, BRONZE = prioritas menengah
                  </p>
                </div>
              </div>

              {/* Associate Performance */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">🤝 Performa Associate (Direct vs Associate)</p>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-md p-3 border border-green-300 dark:border-green-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Associate dikelompokkan berdasarkan <code>namaAssociate</code>:
                  </p>
                  <ul className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• <strong>Direct:</strong> namaAssociate = 'Direct' (internal team)</li>
                    <li>• <strong>Associate:</strong> namaAssociate != 'Direct' (partner/associate)</li>
                    <li>• <strong>Count:</strong> Jumlah target per tipe associate</li>
                    <li>• <strong>Value:</strong> SUM(hargaTerupdate untuk DONE, hargaKontrak untuk lainnya)</li>
                    <li>• <strong>Unique Companies:</strong> COUNT(DISTINCT namaPerusahaan) per tipe</li>
                  </ul>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    💡 Membantu membandingkan performa internal team vs external associates
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Chart Pencapaian & Distribusi
            </h3>
            <div className="space-y-4">
              {/* Chart 1 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">1. CRM Data Overview Chart</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Menampilkan distribusi target berdasarkan:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li><strong>Status:</strong> Berapa banyak target di setiap status (WAITING/PROSES/DONE/SUSPEND/LOSS)</li>
                  <li><strong>Produk:</strong> Distribusi ISO vs SUSTAIN</li>
                  <li><strong>PIC CRM:</strong> Performa per PIC (DHA/MRC)</li>
                </ul>
              </div>

              {/* Chart 2 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">2. Pencapaian Monthly Chart (Tren Bulanan)</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Menampilkan tren pencapaian dari bulan ke bulan:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li><strong>Count:</strong> Jumlah target per bulan</li>
                  <li><strong>Value:</strong> Total nilai kontrak per bulan (dalam juta/rupiah)</li>
                  <li>Dapat difilter berdasarkan <strong>Tahun</strong> dan <strong>Bulan Exp Date</strong></li>
                  <li>Membandingkan performa antar bulan untuk melihat tren kenaikan/penurunan</li>
                </ul>
              </div>

              {/* Chart 3 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">3. Kuadran Distribution Chart</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Distribusi target berdasarkan kategori kuadran:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li><strong>GOLD:</strong> Target prioritas tertinggi</li>
                  <li><strong>SILVER:</strong> Target prioritas tinggi</li>
                  <li><strong>BRONZE:</strong> Target prioritas menengah</li>
                  <li>Membandingkan jumlah dan nilai per kuadran untuk melihat potensi revenue</li>
                </ul>
              </div>

              {/* Chart 4 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">4. Associate Performance Chart</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Analisis performa associate (Direct vs Associate):
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li><strong>Direct:</strong> Target yang ditangani langsung oleh internal team</li>
                  <li><strong>Associate:</strong> Target yang ditangani oleh partner/associate luar</li>
                  <li>Membandingkan jumlah target dan nilai revenue antara Direct vs Associate</li>
                  <li>Tren performa associate dari bulan ke bulan</li>
                </ul>
              </div>

              {/* Chart 5 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">5. Standar Distribution Chart</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Top standar yang paling banyak dicari oleh client:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Menampilkan standar dengan jumlah target terbanyak</li>
                  <li>Misal: ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, dll</li>
                  <li>Berdasarkan kode standar dari master data</li>
                  <li>Membantu memahami standar apa yang paling populer di pasar</li>
                </ul>
              </div>

              {/* Chart 6 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">6. EA Code Distribution Chart</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Distribusi berdasarkan EA Code (Economic Activity Code):
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>EA Code mengklasifikasikan jenis industri/sektor usaha client</li>
                  <li>Menampilkan sektor industri mana yang paling banyak targetnya</li>
                  <li>Misal: Manufacture, Construction, Trade, dll</li>
                  <li>Membantu memahami segment industri yang prospektif</li>
                </ul>
              </div>

              {/* Chart 7 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">7. TR (Trimming/Loss) Chart</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Analisis perbedaan harga kontrak vs harga terupdate:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li><strong>Trimming:</strong> Harga terupdate &gt; Harga kontrak (kenaikan harga)</li>
                  <li><strong>Loss:</strong> Harga terupdate &lt; Harga kontrak (penurunan harga)</li>
                  <li>Menampilkan total trimming dan loss dalam nilai rupiah</li>
                  <li>Memantau apakah negosiasi harga menguntungkan atau merugikan</li>
                </ul>
              </div>

              {/* Chart 8 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">8. Pareto Alasan Chart</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Diagram Pareto untuk distribusi alasan loss/suspend:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Menampilkan alasan yang paling sering terjadi</li>
                  <li>Misal: "Harga terlalu mahal", "Competitor lebih murah", "Timing tidak sesuai", dll</li>
                  <li>Membantu identifikasi <strong>root cause</strong> utama kegagalan deal</li>
                  <li>Dapat difilter hanya untuk status LOSS atau SUSPEND</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-orange-600" />
              Filter & Tips Penggunaan
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">📅 Filter Tanggal</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Filter berdasarkan <strong>Bulan Exp Date</strong> (bulan jatuh tempo sertifikat) atau <strong>Bulan TTD Notif</strong>
                  (bulan kontrak ditandatangani). Default: tahun berjalan.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">👥 Filter PIC & Sales</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Filter untuk melihat performa PIC CRM atau Sales tertentu. Dapat digabungkan dengan filter lain.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">🏷️ Filter Kategori</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Filter berdasarkan kategori produk (ISO/SUSTAIN), kategori client (GOLD/SILVER/BRONZE), atau kategori associate (Direct/Associate).
                </p>
              </div>

              <Separator />

              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">💡 Tips Penting</p>
                <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Gunakan kombinasi filter untuk analisis yang lebih spesifik</li>
                  <li>• Chart akan otomatis update saat filter berubah</li>
                  <li>• Nilai "Value" dalam juta rupiah (dibulatkan)</li>
                  <li>• Status DONE wajib ada Bulan TTD Notif dan Harga Terupdate</li>
                  <li>• Status LOSS/SUSPEND sebaiknya ada Alasan untuk tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-900 dark:text-green-100">
                <p className="font-semibold mb-1">Status Validasi Data</p>
                <p className="text-green-700 dark:text-green-300 text-xs">
                  Status DONE memerlukan <strong>Bulan TTD Notif</strong> dan <strong>Harga Terupdate</strong> yang wajib diisi.
                  Status LOSS/SUSPEND sebaiknya diisi <strong>Alasan</strong> untuk dokumentasi yang baik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardInfoDialog;
