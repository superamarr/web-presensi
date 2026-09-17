"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode, ScanLine, LayoutDashboard, Users } from "lucide-react";

const links = [
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/participants", label: "Peserta", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-blue-100 flex items-center justify-between px-4 py-3">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-700">
        <QrCode className="w-6 h-6 text-blue-600" /> Presensi QR
      </Link>
      <div className="flex gap-1">
        {links.map((l) => {
          const active = path === l.href;
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 ${active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
            >
              <Icon className="w-4 h-4" /> {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
