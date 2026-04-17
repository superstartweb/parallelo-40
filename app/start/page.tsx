"use client";

import Link from "next/link";
import { Utensils, Palmtree, Settings, BarChart3, ChefHat } from "lucide-react";

export default function StartPage() {
  const links = [
    { name: "MENU CLIENTE", href: "/", icon: <Utensils />, color: "bg-green-500" },
    { name: "CUCINA (Ristorante)", href: "/ristorante", icon: <ChefHat />, color: "bg-[#f2aa39]" },
    { name: "BANCO (Parallelo40)", href: "/parallelo40", icon: <Palmtree />, color: "bg-[#00c0f4]" },
    { name: "REPORT & STATS", href: "/manager/parallelo40", icon: <BarChart3 />, color: "bg-gray-800" },
    { name: "ADMIN (Gestione Menu)", href: "/admin", icon: <Settings />, color: "bg-red-600" },
  ];

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
      <img src="https://www.superstart.it/wp-content/uploads/2026/04/ParalleloQuaranta_nero.png" alt="Logo" className="h-10 mb-12" />
      <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <div className="bg-white border-2 border-gray-50 p-4 rounded-[2rem] hover:border-gray-900 flex items-center gap-4 transition-all shadow-sm">
              <div className={`${link.color} p-3 rounded-2xl text-white shadow-md`}>{link.icon}</div>
              <h2 className="font-black text-gray-900 text-sm uppercase">{link.name}</h2>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-12 text-[10px] text-gray-300 font-bold tracking-[10px]">SuPeR START</p>
    </div>
  );
}