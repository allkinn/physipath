import Link from "next/link";
import { Brain, BookOpen, Dumbbell, Lightbulb, Sparkles } from "lucide-react";

const features = [
  {
    title: "Diagnostic Engine",
    description:
      "Mendeteksi gap akademik siswa berdasarkan hasil tes Fisika per topik.",
    icon: Brain,
  },
  {
    title: "Adaptive Learning",
    description:
      "Memberikan rekomendasi modul belajar sesuai tingkat pemahaman siswa.",
    icon: BookOpen,
  },
  {
    title: "Adaptive Practice",
    description:
      "Menyediakan latihan soal sesuai hasil diagnostik dan rekomendasi materi.",
    icon: Dumbbell,
  },
  {
    title: "Explore Challenge",
    description:
      "Melatih problem solving, critical thinking, communication, dan creativity.",
    icon: Lightbulb,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <Sparkles />
          </div>

          <p className="text-sm font-semibold text-cyan-300">Tentang PhysiPath</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">
            Platform pembelajaran Fisika adaptif berbasis AI.
          </h1>

          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            PhysiPath dirancang untuk membantu siswa SMA mengetahui kelemahan konsep
            Fisika melalui tes diagnostik, mendapatkan rekomendasi materi, mengerjakan
            latihan adaptif, serta mengembangkan soft skill melalui tantangan berbasis
            masalah nyata.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/diagnostic"
              className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Mulai Tes Diagnostik
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
            >
              Buka Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                  <Icon />
                </div>
                <h2 className="text-xl font-bold">{feature.title}</h2>
                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}