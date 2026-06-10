import Link from "next/link";
import { Brain, ChartNoAxesCombined, GraduationCap, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <Brain size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">PhysiPath</h1>
              <p className="text-xs text-slate-400">AI Physics Diagnostic Platform</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Register
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              <Sparkles size={16} />
              Pembelajaran Fisika Adaptif Berbasis AI
            </div>

            <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Deteksi gap akademik Fisika siswa secara personal.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              PhysiPath membantu siswa SMA mengetahui kelemahan konsep Fisika melalui
              tes diagnostik, lalu memberikan rekomendasi belajar berdasarkan topik
              yang belum dikuasai.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Mulai Tes Diagnostik
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Lihat Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/30">
            <div className="rounded-2xl bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Hasil Diagnostik Sementara</p>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>GLB dan GLBB</span>
                    <span className="text-red-300">Gap Berat</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800">
                    <div className="h-3 w-[35%] rounded-full bg-red-400" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Hukum Newton</span>
                    <span className="text-yellow-300">Perlu Penguatan</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800">
                    <div className="h-3 w-[62%] rounded-full bg-yellow-300" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Usaha dan Energi</span>
                    <span className="text-emerald-300">Cukup Menguasai</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800">
                    <div className="h-3 w-[82%] rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-semibold text-cyan-300">Rekomendasi AI</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Fokus belajar pertama: GLB dan GLBB. Pelajari ulang konsep
                  kecepatan, percepatan, grafik v-t, dan persamaan gerak.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          <FeatureCard
            icon={<Brain size={24} />}
            title="AI Diagnostic"
            description="Menganalisis kelemahan konsep siswa berdasarkan hasil tes awal."
          />
          <FeatureCard
            icon={<GraduationCap size={24} />}
            title="Adaptive Learning"
            description="Memberikan materi dan latihan sesuai tingkat pemahaman siswa."
          />
          <FeatureCard
            icon={<ChartNoAxesCombined size={24} />}
            title="Progress Tracking"
            description="Menampilkan perkembangan belajar siswa per topik Fisika."
          />
        </section>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 leading-6 text-slate-400">{description}</p>
    </div>
  );
}