import Link from "next/link";
import ExploreSubmissionForm from "../../../components/ExploreSubmissionForm";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type ExploreChallenge = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  problem_context: string;
  task_instruction: string;
};

export default async function ExploreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("explore_challenges")
    .select("id, slug, title, theme, problem_context, task_instruction")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-2xl font-bold text-red-200">Challenge tidak ditemukan</h1>
          <p className="mt-3 text-red-100">
            {error?.message || "Data challenge tidak tersedia."}
          </p>

          <Link
            href="/explore"
            className="mt-6 inline-block rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
          >
            Kembali ke Explore
          </Link>
        </div>
      </main>
    );
  }

  const challenge = data as ExploreChallenge;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/explore"
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          ← Kembali ke Explore
        </Link>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
            {challenge.theme}
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight">
            {challenge.title}
          </h1>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-semibold text-cyan-300">Konteks Masalah</p>
            <p className="mt-3 leading-8 text-slate-300">
              {challenge.problem_context}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p className="text-sm font-semibold text-cyan-300">Tugas</p>
            <p className="mt-3 leading-8 text-slate-300">
              {challenge.task_instruction}
            </p>
          </div>
        </div>

        <ExploreSubmissionForm
          challenge={{
            id: challenge.id,
            title: challenge.title,
          }}
        />
      </section>
    </main>
  );
}