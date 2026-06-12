import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type TopicRelation =
  | {
      name: string;
      description: string;
    }
  | {
      name: string;
      description: string;
    }[]
  | null;

type LearningModule = {
  id: string;
  slug: string;
  title: string;
  target_level: string;
  difficulty_label: string;
  summary: string;
  content: string;
  physics_topics: TopicRelation;
};

function getTopic(topic: TopicRelation) {
  if (!topic) {
    return {
      name: "Tanpa Topik",
      description: "",
    };
  }

  if (Array.isArray(topic)) {
    return (
      topic[0] ?? {
        name: "Tanpa Topik",
        description: "",
      }
    );
  }

  return topic;
}

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("learning_modules")
    .select(`
      id,
      slug,
      title,
      target_level,
      difficulty_label,
      summary,
      content,
      physics_topics (
        name,
        description
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-2xl font-bold text-red-200">Modul tidak ditemukan</h1>
          <p className="mt-3 text-red-100">
            {error?.message || "Data modul tidak tersedia."}
          </p>

          <Link
            href="/learn"
            className="mt-6 inline-block rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
          >
            Kembali ke Learn
          </Link>
        </div>
      </main>
    );
  }

  const module = data as LearningModule;
  const topic = getTopic(module.physics_topics);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/learn"
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          ← Kembali ke Rekomendasi
        </Link>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
              {topic.name}
            </span>
            <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
              {module.difficulty_label}
            </span>
            <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
              {module.target_level}
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight">{module.title}</h1>

          <p className="mt-5 leading-8 text-slate-300">{module.summary}</p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-bold">Materi Pembelajaran</h2>

          <div className="mt-6 space-y-5 leading-8 text-slate-300">
            {module.content.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph.trim()}</p>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <h2 className="text-xl font-bold text-cyan-300">Langkah Berikutnya</h2>
          <p className="mt-3 leading-7 text-slate-300">
            Setelah membaca modul ini, lanjutkan dengan latihan soal pada topik yang
            sama. Fitur latihan adaptif akan dibuat pada tahap berikutnya.
          </p>
        </div>
      </article>
    </main>
  );
}