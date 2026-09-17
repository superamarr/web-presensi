"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { genToken } from "@/lib/utils";
import type { Participant } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { Trash2, Download, Search } from "lucide-react";

export default function ParticipantsPage() {
  const [list, setList] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const { data, error } = await supabase.from("participants").select("*").order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else { setErr(""); if (data) setList(data as Participant[]); }
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const qr_token = genToken();
    const { error } = await supabase.from("participants").insert({ name: name.trim(), origin: origin.trim() || null, qr_token });
    setLoading(false);
    if (error) alert(error.message);
    else { setName(""); setOrigin(""); load(); }
  }

  async function del(id: string) {
    if (!confirm("Hapus peserta?")) return;
    await supabase.from("participants").delete().eq("id", id);
    load();
  }

  function downloadQR(token: string, name: string) {
    const svg = document.getElementById(`qr-${token}`) as unknown as SVGSVGElement | null;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `QR-${name}-${token}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }

  const filtered = list.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.origin && p.origin.toLowerCase().includes(q.toLowerCase())) || p.qr_token.includes(q));

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 w-full max-w-full sm:max-w-5xl overflow-x-hidden">
      {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm break-words"><b>Gagal konek Supabase:</b> {err}<br/><span className="text-xs break-words">Cek: 1) .env.local ada & restart dev (`taskkill /F /IM node.exe; Remove-Item .next -Force; npm run dev`), 2) Vercel Env Vars ter-set & redeploy Clear cache, 3) jalankan supabase-setup.sql, 4) matikan adblock.</span></div>}
      <form onSubmit={add} className="bg-white rounded-2xl p-5 border border-blue-100 space-y-3">
        <h2 className="font-semibold text-blue-900">Tambah Peserta</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama * (wajib)" className="border border-blue-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-3 py-2.5 outline-none" required />
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Asal / Instansi (opsional)" className="border border-blue-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-3 py-2.5 outline-none" />
          <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 font-medium disabled:opacity-50">
            {loading ? "..." : "+ Tambah & Generate QR"}
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-blue-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / asal / token..." className="flex-1 outline-none text-sm" />
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{filtered.length} peserta</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white border border-blue-100 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <div className="font-semibold truncate text-blue-900">{p.name}</div>
                <div className="text-xs text-blue-600/60 truncate">{p.origin || "-"}</div>
                <div className="text-[11px] font-mono bg-blue-50 text-blue-700 inline-block px-2 py-0.5 rounded mt-1">{p.qr_token}</div>
              </div>
              <button onClick={() => del(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
            <div className="bg-blue-50/50 rounded-xl p-3 flex justify-center">
              <QRCodeSVG id={`qr-${p.qr_token}`} value={p.qr_token} size={140} />
            </div>
            <button onClick={() => downloadQR(p.qr_token, p.name)} className="w-full border border-blue-100 rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50 text-blue-700">
              <Download className="w-4 h-4" /> Unduh QR
            </button>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">Belum ada peserta. Tambahkan di atas.</div>}
    </div>
  );
}
