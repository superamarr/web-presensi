"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { playBeep } from "@/lib/utils";

type Result = { type: "success" | "warning" | "error"; title: string; sub: string } | null;

export default function ScanPage() {
  const [result, setResult] = useState<Result>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const scannerRef = useRef<unknown>(null);
  const lockRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep hidden input focused for USB scanner
  useEffect(() => {
    const id = setInterval(() => { if (document.activeElement?.tagName !== "INPUT") inputRef.current?.focus(); }, 1500);
    return () => clearInterval(id);
  }, []);

  async function handleToken(raw: string) {
    const token = raw.trim().toUpperCase();
    if (!token || lockRef.current) return;
    lockRef.current = true;
    setTokenInput(token);
    try {
      const { data: p, error: e1 } = await supabase.from("participants").select("*").eq("qr_token", token).maybeSingle();
      if (e1) throw e1;
      if (!p) {
        setResult({ type: "error", title: "QR Tidak Valid", sub: `Token ${token} tidak terdaftar` });
        playBeep(false);
      } else {
        const { data: att } = await supabase.from("attendances").select("id").eq("participant_id", p.id).maybeSingle();
        if (att) {
          setResult({ type: "warning", title: "Sudah Absen", sub: `${p.name} (${p.origin || "-"}) sudah tercatat hadir` });
          playBeep(false);
        } else {
          const { error: e2 } = await supabase.from("attendances").insert({ participant_id: p.id, status: "Hadir" });
          if (e2) throw e2;
          setResult({ type: "success", title: "Hadir ✓", sub: `${p.name} • ${p.origin || "-"} • ${new Date().toLocaleTimeString("id-ID")}` });
          playBeep(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({ type: "error", title: "Error", sub: msg });
      playBeep(false);
    } finally {
      setTimeout(() => (lockRef.current = false), 1800);
    }
  }

  // html5-qrcode dynamic import to avoid SSR
  async function startCamera() {
    if (scanning) return;
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const elId = "reader";
    const h = new Html5Qrcode(elId);
    scannerRef.current = h;
    try {
      await h.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decoded) => handleToken(decoded),
        () => {}
      );
    } catch (e) {
      setScanning(false);
      alert("Gagal akses kamera: " + (e as Error).message + " (butuh HTTPS)");
    }
  }
  async function stopCamera() {
    const h = scannerRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
    try { if (h?.stop) await h.stop(); h?.clear?.(); } catch {}
    scannerRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => { stopCamera(); }, []);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* hidden input for USB/Bluetooth scanner */}
      <input
        ref={inputRef}
        autoFocus
        value={manual}
        onChange={(e) => setManual(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { handleToken(manual); setManual(""); }
        }}
        placeholder="Scanner fisik autofokus di sini..."
        className="w-full border-2 border-dashed border-blue-200 rounded-xl px-3 py-3 text-sm focus:border-blue-600 outline-none bg-blue-50"
      />
      <p className="text-xs text-blue-600/60 -mt-2">USB/Bluetooth scanner akan ketik otomatis + Enter. Kamera HP juga aktif di bawah.</p>

      <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden">
        <div className="p-3 flex justify-between items-center border-b border-blue-100">
          <span className="text-sm font-medium text-blue-900">Kamera Scanner</span>
          {!scanning ? (
            <button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-full">Buka Kamera</button>
          ) : (
            <button onClick={stopCamera} className="bg-blue-100 text-blue-700 text-sm px-4 py-1.5 rounded-full">Tutup</button>
          )}
        </div>
        <div id="reader" className="w-full min-h-[280px] bg-blue-50/50 flex items-center justify-center text-sm text-blue-600/60">
          {!scanning && <span className="p-6 text-center">Klik &quot;Buka Kamera&quot; untuk scan via kamera HP (butuh HTTPS & izin kamera)</span>}
        </div>
      </div>

      {/* manual test */}
      <div className="bg-white border border-blue-100 rounded-2xl p-4 flex gap-2">
        <input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Tempel token manual (PRSN-XXXXX)" className="flex-1 border border-blue-100 focus:border-blue-400 rounded-xl px-3 py-2 text-sm outline-none" />
        <button onClick={() => handleToken(tokenInput)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 text-sm font-medium">Absen</button>
      </div>

      {result && (
        <div
          className={`rounded-2xl p-5 border-2 text-center space-y-1 ${
            result.type === "success" ? "bg-green-50 border-green-500 text-green-800" : result.type === "warning" ? "bg-amber-50 border-amber-500 text-amber-800" : "bg-red-50 border-red-500 text-red-700"
          }`}
        >
          <div className="text-lg font-bold">{result.title}</div>
          <div className="text-sm">{result.sub}</div>
        </div>
      )}

      <div className="text-xs text-zinc-500 text-center">Token terakhir: <span className="font-mono">{tokenInput || "-"}</span></div>
    </div>
  );
}
