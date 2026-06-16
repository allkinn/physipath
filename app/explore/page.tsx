import Link from "next/link";
import { Lightbulb, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

type ExploreChallenge = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  problem_context: string;
  task_instruction: string;
  order_index: number;
};

export default async function ExplorePage() {
  const { data, error } = await supabase
    .from("explore_challenges")
    .select("id, slug, title, theme, problem_context, task_instruction, order_index")
    .order("order_index", { ascending: true });

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-2xl font-bold text-red-200">Gagal mengambil challenge</h1>
          <p className="mt-3 text-red-100">{error.message}</p>
        </div>
      </main>
    );
  }

  const challenges = (data ?? []) as ExploreChallenge[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Explore Pilar</p>
            <h1 className="mt-2 text-3xl font-bold">Soft Skill Challenge</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              Pilih tantangan berbasis masalah nyata. AI akan menilai kemampuan
              problem solving, critical thinking, komunikasi, dan kreativitas dari jawabanmu.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <Sparkles />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-300">Tujuan Explore Pilar</h2>
              <p className="mt-3 leading-7 text-slate-300">
                Bagian ini bukan untuk mencari jawaban benar-salah, tapi melatih cara siswa
                menganalisis masalah, menyusun solusi, menjelaskan ide, dan berpikir kreatif.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/explore/${challenge.slug}`}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Lightbulb />
              </div>

              <p className="text-sm text-cyan-300">{challenge.theme}</p>
              <h2 className="mt-2 text-xl font-bold">{challenge.title}</h2>
              <p className="mt-3 line-clamp-4 leading-7 text-slate-400">
                {challenge.problem_context}
              </p>

              <p className="mt-5 text-sm font-semibold text-cyan-300">
                Buka Challenge →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}