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
    <nav className="sticky top-0 z-10 bg-white border-b border-blue-100 flex items-center justify-between px-3 sm:px-4 py-3 max-w-full overflow-hidden">
      <Link href="/" className="flex items-center gap-1.5 sm:gap-2 font-bold text-base sm:text-lg text-blue-700 shrink-0 min-w-0">
        <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" /> <span className="truncate">Presensi QR</span>
      </Link>
      <div className="flex gap-1 shrink-0">
        {links.map((l) => {
          const active = path === l.href;
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 shrink-0 ${active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
