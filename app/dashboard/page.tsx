"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Participant } from "@/lib/types";

type Row = Participant & { scanned_at: string | null; status: string };

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [feed, setFeed] = useState<{ name: string; origin: string | null; time: string }[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    const { data: participants, error: e1 } = await supabase.from("participants").select("*").order("name");
    const { data: attendances, error: e2 } = await supabase.from("attendances").select("participant_id, scanned_at, status, participants(name, origin)");
    if (e1 || e2) { setErr((e1 || e2)?.message || "Gagal fetch"); return; }
    setErr("");
    const attMap = new Map<string, { scanned_at: string; status: string }>();
    (attendances as unknown as { participant_id: string; scanned_at: string; status: string }[] | null)?.forEach((a) => attMap.set(a.participant_id, { scanned_at: a.scanned_at, status: a.status }));
    const merged: Row[] = ((participants as Participant[]) || []).map((p) => ({
      ...p,
      scanned_at: attMap.get(p.id)?.scanned_at || null,
      status: attMap.get(p.id)?.status || "Belum Hadir",
    }));
    setRows(merged);
    // feed: last 10 attendances sorted
    const sorted = [...(attendances || [])]
      .sort((a: unknown, b: unknown) => new Date((b as { scanned_at: string }).scanned_at).getTime() - new Date((a as { scanned_at: string }).scanned_at).getTime())
      .slice(0, 8)
      .map((a: unknown) => {
        const x = a as { scanned_at: string; participants: { name: string; origin: string | null } };
        return { name: x.participants?.name || "-", origin: x.participants?.origin || null, time: x.scanned_at };
      });
    setFeed(sorted);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("attendances-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendances" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const total = rows.length;
  const hadir = rows.filter((r) => r.status === "Hadir").length;
  const belum = total - hadir;

  async function exportPDF() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.setFontSize(14); doc.text("LAPORAN PRESENSI KEHADIRAN", 105, 14, { align: "center" });
    doc.setFontSize(9); doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}  |  Total Peserta: ${total}  |  Hadir: ${hadir}  |  Belum: ${belum}`, 105, 20, { align: "center" });
    autoTable(doc, {
      startY: 26,
      head: [["NO", "NAMA PESERTA", "ASAL", "STATUS", "WAKTU SCAN"]],
      body: rows.map((r, i) => [String(i + 1), r.name, r.origin || "-", r.status, r.scanned_at ? new Date(r.scanned_at).toLocaleString("id-ID") : "-"]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`presensi-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = rows.map((r, i) => ({
      No: i + 1,
      "Nama Peserta": r.name,
      "Asal / Instansi": r.origin || "-",
      "Waktu Scan": r.scanned_at ? new Date(r.scanned_at).toLocaleString("id-ID") : "-",
      "Status Kehadiran": r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presensi");
    XLSX.writeFile(wb, `presensi-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm"><b>Gagal konek Supabase:</b> {err}<br/><span className="text-xs">Cek .env.local & rebuild, Vercel Env Vars, supabase-setup.sql, adblock.</span></div>}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-blue-100 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">{total}</div><div className="text-xs text-blue-600/60">Total Peserta</div>
        </div>
        <div className="bg-blue-600 text-white rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold">{hadir}</div><div className="text-xs text-blue-100">Hadir</div>
        </div>
        <div className="bg-blue-100 border border-blue-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{belum}</div><div className="text-xs text-blue-600">Belum Hadir</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={exportPDF} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium">Export PDF</button>
        <button onClick={exportExcel} className="flex-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl py-3 text-sm font-medium">Export Excel</button>
        <button onClick={load} className="px-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-sm">Refresh</button>
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-blue-900">Live Feed — Scan Terakhir (realtime)</h3>
        {feed.length === 0 ? <div className="text-sm text-blue-600/60">Belum ada absensi.</div> : (
          <ul className="space-y-2">
            {feed.map((f, i) => (
              <li key={i} className="flex justify-between items-center bg-blue-50 rounded-xl px-3 py-2 text-sm">
                <span><b className="text-blue-900">{f.name}</b> <span className="text-blue-600/60">{f.origin ? `• ${f.origin}` : ""}</span></span>
                <span className="text-xs text-blue-600/60">{new Date(f.time).toLocaleTimeString("id-ID")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden">
        <div className="p-4 font-semibold text-sm border-b border-blue-100 text-blue-900">Rekapitulasi</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-xs text-blue-700">
              <tr><th className="px-3 py-2 text-left">No</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Asal</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Waktu</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-blue-50">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-blue-900">{r.name}</td>
                  <td className="px-3 py-2 text-blue-600/70">{r.origin || "-"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "Hadir" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-blue-900/70">{r.scanned_at ? new Date(r.scanned_at).toLocaleString("id-ID") : "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-blue-600/60">Belum ada data peserta</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
