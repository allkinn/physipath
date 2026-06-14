import Link from "next/link";
import PracticeForm, {
  PracticeQuestion,
} from "../../../components/PracticeForm";
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

export default async function PracticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: moduleData, error: moduleError } = await supabase
    .from("learning_modules")
    .select(`
      id,
      slug,
      title,
      target_level,
      difficulty_label,
      summary,
      physics_topics (
        name,
        description
      )
    `)
    .eq("slug", slug)
    .single();

  if (moduleError || !moduleData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-2xl font-bold text-red-200">Latihan tidak ditemukan</h1>
          <p className="mt-3 text-red-100">
            {moduleError?.message || "Data modul tidak tersedia."}
          </p>

          <Link
            href="/practice"
            className="mt-6 inline-block rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
          >
            Kembali ke Practice
          </Link>
        </div>
      </main>
    );
  }

  const module = moduleData as LearningModule;
  const topic = getTopic(module.physics_topics);

  const { data: questionData, error: questionError } = await supabase
    .from("practice_questions")
    .select(`
      id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      order_index
    `)
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  if (questionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-2xl font-bold text-red-200">Gagal mengambil soal</h1>
          <p className="mt-3 text-red-100">{questionError.message}</p>
        </div>
      </main>
    );
  }

  const questions = (questionData ?? []) as PracticeQuestion[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/practice"
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          ← Kembali ke Latihan
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

          <h1 className="mt-6 text-3xl font-bold leading-tight">
            Latihan: {module.title}
          </h1>

          <p className="mt-5 leading-8 text-slate-300">
            {module.summary}
          </p>

          <p className="mt-5 text-sm text-slate-400">
            Jumlah soal latihan: {questions.length}
          </p>
        </div>

        <PracticeForm
          module={{
            id: module.id,
            title: module.title,
            slug: module.slug,
          }}
          questions={questions}
        />
      </section>
    </main>
  );
}