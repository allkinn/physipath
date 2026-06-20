import Link from "next/link";
import type { ReactNode } from "react";
import {
  Brain,
  BookOpen,
  ChartNoAxesCombined,
  Dumbbell,
  Lightbulb,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <Brain size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold">PhysiPath</h1>
              <p className="text-xs text-slate-400">
                AI Physics Diagnostic Learning Platform
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
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

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              <Sparkles size={16} />
              Pembelajaran Fisika Adaptif Berbasis AI
            </div>

            <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Kenali kelemahan konsep Fisika, lalu belajar sesuai kebutuhanmu.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              PhysiPath membantu siswa SMA memahami bagian Fisika yang belum
              dikuasai melalui tes diagnostik, rekomendasi materi adaptif,
              latihan soal, AI Tutor, progress tracking, dan tantangan soft skill.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Register
              </Link>

              <Link
                href="/login"
                className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Login
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Sudah punya akun? Login untuk melanjutkan belajar. Belum punya akun?
              Register dulu untuk mulai tes diagnostik.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/30">
            <div className="rounded-2xl bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Alur Belajar PhysiPath</p>

              <div className="mt-6 space-y-4">
                <FlowItem
                  number="01"
                  title="Tes Diagnostik"
                  description="Siswa mengerjakan soal Fisika untuk memetakan kemampuan awal."
                />

                <FlowItem
                  number="02"
                  title="Analisis Gap"
                  description="Sistem menghitung skor per topik dan menentukan bagian yang perlu diperkuat."
                />

                <FlowItem
                  number="03"
                  title="Materi dan Latihan Adaptif"
                  description="Siswa mendapat modul dan latihan sesuai hasil diagnostik."
                />

                <FlowItem
                  number="04"
                  title="AI Tutor dan Progress"
                  description="AI membantu menjelaskan soal, sementara dashboard memantau perkembangan belajar."
                />
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-semibold text-cyan-300">
                  Fokus utama
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Platform ini dirancang agar siswa tidak hanya mengerjakan soal,
                  tetapi juga memahami letak kelemahannya dan mendapat arahan
                  belajar yang lebih personal.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="pb-16">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Fitur Utama</p>
            <h2 className="mt-2 text-3xl font-bold">
              Satu platform untuk diagnosis, belajar, latihan, dan soft skill.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Brain size={24} />}
              title="Diagnostic Engine"
              description="Mendeteksi gap akademik siswa berdasarkan hasil tes per topik Fisika."
            />

            <FeatureCard
              icon={<BookOpen size={24} />}
              title="Adaptive Learning"
              description="Memberikan modul belajar sesuai tingkat pemahaman siswa."
            />

            <FeatureCard
              icon={<Dumbbell size={24} />}
              title="Adaptive Practice"
              description="Menyediakan latihan soal yang sesuai dengan rekomendasi belajar."
            />

            <FeatureCard
              icon={<Lightbulb size={24} />}
              title="Explore Challenge"
              description="Melatih problem solving, critical thinking, komunikasi, dan kreativitas."
            />
          </div>
        </section>

        <footer className="border-t border-slate-800 py-6 text-sm text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>© 2026 PhysiPath.</p>
            <p>AI Diagnostic • Adaptive Learning • AI Tutor • Soft Skill Challenge</p>
          </div>
        </footer>
      </section>
    </main>
  );
}

function FlowItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-bold text-cyan-300">
          {number}
        </div>

        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 leading-6 text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
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