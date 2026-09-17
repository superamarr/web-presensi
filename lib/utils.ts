export function genToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `PRSN-${s}`;
}

export function playBeep(ok: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 880 : 220;
    o.type = "sine";
    g.gain.value = 0.3;
    o.start(); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    o.stop(ctx.currentTime + 0.35);
  } catch {}
}
