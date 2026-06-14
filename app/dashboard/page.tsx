import Link from "next/link";
import { BookOpen, Brain, ChartNoAxesCombined } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Siswa</h1>
            <p className="mt-2 text-slate-400">
              Pantau hasil diagnostik, rekomendasi materi, dan progres belajar.
            </p>
          </div>

          <Link
            href="/practice"
            className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Latihan Adaptif
          </Link>
          <Link
            href="/diagnostic"
            className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Mulai Tes Diagnostik
          </Link>
          <Link
            href="/learn"
            className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Lihat Rekomendasi Belajar
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <DashboardCard
            icon={<Brain />}
            title="Status Diagnostik"
            value="Belum Tes"
            description="Ikuti tes awal untuk mengetahui gap akademik."
          />
          <DashboardCard
            icon={<BookOpen />}
            title="Materi Direkomendasikan"
            value="5 Modul"
            description="Modul dipilih berdasarkan hasil tes diagnostik terbaru."
          />
          <DashboardCard
            icon={<ChartNoAxesCombined />}
            title="Progress Belajar"
            value="0%"
            description="Progress akan dihitung dari latihan soal."
          />
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Roadmap Belajar</h2>
          <p className="mt-2 text-slate-400">
            Roadmap akan dibuat otomatis berdasarkan hasil tes diagnostik.
          </p>

          <div className="mt-6 space-y-4">
            <RoadmapItem title="1. Tes Diagnostik Fisika" status="Siap dikerjakan" />
            <RoadmapItem title="2. Analisis Gap Akademik" status="Menunggu hasil tes" />
            <RoadmapItem title="3. Rekomendasi Materi" status="Belum tersedia" />
            <RoadmapItem title="4. Latihan Adaptif" status="Belum tersedia" />
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className="mt-2 text-3xl font-bold">{value}</h2>
      <p className="mt-3 leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function RoadmapItem({ title, status }: { title: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4">
      <p className="font-medium">{title}</p>
      <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
        {status}
      </span>
    </div>
  );
}