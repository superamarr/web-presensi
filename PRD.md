# Product Requirement Document (PRD) — Sistem Presensi Digital QR Code

> **Status:** Draft / Ready to Implement[cite: 1]  
> **Target Stack:** Next.js (App Router) / Vite + React + Supabase + Vercel[cite: 1]  
> **UI Concept:** Mobile-First Responsive Design (Tailwind CSS)[cite: 1]  

---

## 1. Ringkasan Eksekutif
Sistem **Presensi Digital Realtime** dirancang untuk memfasilitasi pencatatan kehadiran peserta secara instan pada event, seminar, rapat, maupun kegiatan kelas[cite: 1]. 

Fitur utamanya meliputi:
* **Pendaftaran Peserta Ringkas:** Hanya mencatat Nama dan Asal/Instansi (opsional)[cite: 1].
* **Generator QR Code Unik:** Pembuatan QR Code otomatis per peserta[cite: 1].
* **Dual-Scanner Fleksibel:** Pemindaian presensi melalui Kamera HP maupun alat Barcode/QR Scanner Fisik (USB/Bluetooth)[cite: 1].
* **Live Dashboard:** Pemantauan statistik dan feed kehadiran realtime[cite: 1].
* **Export Laporan:** Unduh rekapitulasi kehadiran format Excel (.xlsx) dan PDF siap cetak dengan layout ringkas dan rapi (tanpa kolom paraf fisik)[cite: 1].

---

## 2. Arsitektur & Tech Stack

| Komponen | Teknologi | Keterangan & Alasan |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) / Vite + React | Performa tinggi, ringan, dan sangat optimal untuk dideploy di Vercel[cite: 1]. |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Memudahkan pembuatan antarmuka *Mobile-First* yang responsif[cite: 1]. |
| **Database & Realtime** | Supabase (PostgreSQL) | Database cloud gratis dengan REST API & Subscriptions Realtime bawaan[cite: 1]. |
| **QR Code Generator** | `qrcode.react` | Render QR Code berbentuk SVG/PNG di browser secara cepat[cite: 1]. |
| **QR Code Scanner** | `html5-qrcode` | Library ringan untuk integrasi kamera HP (facing mode/environment)[cite: 1]. |
| **Export Engine** | `jspdf` + `jspdf-autotable`, `xlsx` | Pembuat laporan cetak PDF formal dan sheet Excel data mentah[cite: 1]. |
| **Deployment** | Vercel | Hosting gratis, otomatisasi Git, serta mendukung SSL/HTTPS bawaan (wajib untuk akses kamera browser)[cite: 1]. |

---

## 3. Skema Database (Supabase PostgreSQL)

```sql
-- 1. Tabel Data Peserta (Nama & Asal)
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  origin TEXT, -- Asal / Instansi / Komunitas (Opsional)
  qr_token TEXT UNIQUE NOT NULL, -- Contoh token: PRSN-8X92K
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Log Presensi (Kehadiran)
CREATE TABLE attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'Hadir'
);

-- 3. Aktifkan Realtime Subscription pada tabel attendances
ALTER PUBLICATION supabase_realtime ADD TABLE attendances;
```[cite: 1]

---

## 4. Alur Kerja Dual-Scanner (Kamera HP & Scanner Fisik)

1. **Scan via Kamera HP:**
   * Menggunakan kamera belakang HP melalui WebRTC library `html5-qrcode`[cite: 1].
   * Kamera memindai frame QR Code → mengekstrak string `qr_token` → mengeksekusi fungsi presensi[cite: 1].

2. **Scan via Scanner Fisik (USB / Bluetooth):**
   * Scanner fisik bekerja seperti keyboard eksternal berkecepatan tinggi[cite: 1].
   * Elemen `<input>` tersembunyi/autofocus pada halaman scanner akan menerima string `qr_token`[cite: 1].
   * Karakter `Enter` otomatis dari scanner fisik akan memicu eksekusi fungsi presensi[cite: 1].

3. **Validasi & Anti-Duplicate:**
   * Server mengecek apakah `qr_token` terdaftar di tabel `participants`[cite: 1].
   * Jika valid, server mengecek apakah peserta sudah pernah absen di tabel `attendances`[cite: 1].
   * **Jika Belum Absen:** Menambah record baru + memainkan suara *Beep Success* + Alert Hijau[cite: 1].
   * **Jika Sudah Absen:** Memainkan suara *Buzzer Error* + Alert Kuning "Sudah Absen"[cite: 1].
   * **Jika Token Tidak Valid:** Memainkan suara *Buzzer Error* + Alert Merah "QR Tidak Valid"[cite: 1].

---

## 5. Modul Export Laporan (PDF & Excel)

Sistem menyediakan fitur pencetakan rekapitulasi data kehadiran yang bersih dan terdigitalisasi[cite: 1].

### A. Format PDF (Laporan Presensi Digital)
* **Header:** Judul "LAPORAN PRESENSI KEHADIRAN", Tanggal Event, Total Peserta, Total Hadir[cite: 1].
* **Layout Tabel:**  
  `NO` | `NAMA PESERTA` | `STATUS`[cite: 1]

### B. Format Excel (.xlsx)
* Berisi *raw data* yang siap diolah kembali[cite: 1].
* **Kolom:** `No`, `Nama Peserta`, `Asal / Instansi`, `Waktu Scan`, `Status Kehadiran`[cite: 1].

---

## 6. Struktur Antarmuka & Wireframe (Mobile-First)

### Screen 1: Halaman Scanner (`/scan`)
* Frame kamera interaktif di area atas[cite: 1].
* Field input autofocus tersembunyi untuk membaca scanner fisik[cite: 1].
* Kartu respon visual hasil scan (Nama Peserta, Asal, Jam Hadir)[cite: 1].

### Screen 2: Data & QR Peserta (`/participants`)
* Form pendaftaran singkat (Input: **Nama** dan **Asal/Instansi**)[cite: 1].
* Daftar peserta dilengkapi preview QR Code[cite: 1].
* Tombol cetak/unduh QR Code/ID Card per peserta[cite: 1].

### Screen 3: Live Dashboard (`/dashboard`)
* Ringkasan Total Peserta Hadir vs Belum Hadir[cite: 1].
* Live Feed Aktivitas Scan Terakhir (ter-update otomatis via Supabase Realtime)[cite: 1].
* Action Bar: Tombol **Export PDF** dan **Export Excel**[cite: 1].

---

## 7. Detail User Flow (Alur Aplikasi)
[ ADMIN / PANITIA ]                   [ PESERTA ]                      [ SISTEM / SUPABASE ]
│                                  │                                    │
├── 1. Input Nama & Asal ──────────┼───────────────────────────────────►│ (Simpan ke DB &
│                                  │                                    │  generate qr_token)
├── 2. Download/Cetak QR Code ────►│ Receive ID Card / QR               │
│                                  │                                    │
├── 3. Buka Halaman Scanner ───────┼────────────────────────────────────┤
│    (Kamera HP / USB Scanner)     │                                    │
│                                  │                                    │
│    4. Scan QR Code ──────────────┼───────────────────────────────────►│ Query Check:
│                                  │                                    │ - Token valid?
│                                  │                                    │ - Sudah absen?
│                                  │                                    │
│◄── 5. Feedback Suara & Visual ───┴────────────────────────────────────┤ (Kirim status &
│    (Beep Success / Error)                                             │  broadcast Realtime)
│                                                                       │
├── 6. Export Laporan (PDF/Excel) ◄─────────────────────────────────────┤
│                                                                       │
└── 7. Dashboard Ter-update Otomatis ◄──────────────────────────────────┘

