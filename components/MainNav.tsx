"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  BookOpen,
  ChartNoAxesCombined,
  Dumbbell,
  History,
  Lightbulb,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const mainNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Diagnostic",
    href: "/diagnostic",
    icon: Brain,
  },
  {
    label: "Learn",
    href: "/learn",
    icon: BookOpen,
  },
  {
    label: "Practice",
    href: "/practice",
    icon: Dumbbell,
  },
  {
    label: "Explore",
    href: "/explore",
    icon: Lightbulb,
  },
];

const secondaryNavItems = [
  {
    label: "History",
    href: "/history",
    icon: History,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

const navItems = [...mainNavItems, ...secondaryNavItems];

const hiddenRoutes = ["/", "/login", "/register"];

function shouldHideNav(pathname: string) {
  return hiddenRoutes.includes(pathname);
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(!!session);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (shouldHideNav(pathname)) {
    return null;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 px-6 py-4 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <Brain size={22} />
            </div>

            <div>
              <p className="text-lg font-bold leading-none">PhysiPath</p>
              <p className="mt-1 text-xs text-slate-400">
                AI Physics Learning
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 xl:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:bg-slate-900 hover:text-cyan-300"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-300"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-slate-200 xl:hidden"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isOpen && (
          <div className="mx-auto mt-4 grid max-w-7xl gap-2 rounded-3xl border border-slate-800 bg-slate-900 p-3 xl:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}

            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-400/10"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-3 py-2 text-white backdrop-blur-xl xl:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                  active
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-400 hover:text-cyan-300"
                }`}
              >
                <Icon size={18} />
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}