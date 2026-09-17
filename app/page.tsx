import Link from "next/link";
import { ScanLine, Users, LayoutDashboard, QrCode } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-blue-100 text-center space-y-3">
        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto">
          <QrCode className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900">Presensi Digital QR Code</h1>
        <p className="text-blue-600/70">Realtime • Dual Scanner (Kamera + USB) • Export PDF/Excel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/scan", title: "Scan Kehadiran", desc: "Kamera HP & Scanner Fisik", icon: ScanLine, bg: "bg-blue-600 text-white border border-blue-600" },
          { href: "/participants", title: "Data Peserta", desc: "Daftar & QR Code", icon: Users, bg: "bg-white border border-blue-100" },
          { href: "/dashboard", title: "Dashboard", desc: "Live & Export", icon: LayoutDashboard, bg: "bg-white border border-blue-100" },
        ].map((c) => (
          <Link key={c.href} href={c.href} className={`rounded-2xl p-6 flex flex-col gap-3 hover:scale-[1.02] transition ${c.bg}`}>
            <c.icon className={`w-8 h-8 ${c.bg.includes("bg-blue-600") ? "text-white" : "text-blue-600"}`} />
            <div>
              <div className={`font-semibold ${c.bg.includes("bg-blue-600") ? "text-white" : "text-blue-900"}`}>{c.title}</div>
              <div className={`text-sm ${c.bg.includes("bg-blue-600") ? "text-blue-100" : "text-blue-600/60"}`}>{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <b>Setup Supabase:</b> Jalankan SQL di PRD.md (participants + attendances + realtime) di Supabase SQL Editor. Pastikan RLS disabled atau buat policy allow all untuk anon.
      </div>
    </div>
  );
}
