"use client";

import { usePathname } from "next/navigation";

const hiddenRoutes = ["/", "/login", "/register"];

export default function AppFooter() {
  const pathname = usePathname();

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-6 pb-24 pt-8 text-white lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
        <p>© 2026 PhysiPath. AI Physics Diagnostic Learning Platform.</p>
        <p>Diagnostic • Adaptive Learning • AI Tutor • Explore Challenge</p>
      </div>
    </footer>
  );
}