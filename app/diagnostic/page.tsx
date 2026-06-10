import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

type TopicRelation =
  | {
      name: string;
      order_index: number;
    }
  | {
      name: string;
      order_index: number;
    }[]
  | null;

type QuestionWithTopic = {
  id: string;
  code: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
  physics_topics: TopicRelation;
};

function getTopicName(topic: TopicRelation) {
  if (!topic) return "Tanpa Topik";

  if (Array.isArray(topic)) {
    return topic[0]?.name ?? "Tanpa Topik";
  }

  return topic.name;
}

export default async function DiagnosticPage() {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      code,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      difficulty,
      physics_topics (
        name,
        order_index
      )
    `)
    .order("code", { ascending: true });

  const questions = (data ?? []) as QuestionWithTopic[];

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-red-300">Gagal mengambil soal</h1>
          <pre className="mt-6 rounded-2xl bg-slate-900 p-6 text-sm text-red-200">
            {error.message}
          </pre>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-4xl">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Tes Diagnostik Awal</p>
          <h1 className="mt-2 text-3xl font-bold">Tes Diagnostik Fisika</h1>
          <p className="mt-3 leading-7 text-slate-400">
            Jawab soal berikut untuk membantu sistem mendeteksi topik Fisika yang
            sudah dikuasai dan yang masih perlu diperkuat.
          </p>

          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4">
            <p className="text-sm text-cyan-300">
              Jumlah soal dari database: {questions.length} soal
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {questions.map((item, index) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                  {getTopicName(item.physics_topics)}
                </span>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
                    {item.difficulty}
                  </span>
                  <span className="text-sm text-slate-400">
                    Soal {index + 1}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-semibold leading-8">
                {item.question_text}
              </h2>

              <div className="mt-5 grid gap-3">
                <label className="cursor-pointer rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-cyan-400">
                  <input
                    type="radio"
                    name={`question-${item.id}`}
                    value="A"
                    className="mr-3"
                  />
                  A. {item.option_a}
                </label>

                <label className="cursor-pointer rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-cyan-400">
                  <input
                    type="radio"
                    name={`question-${item.id}`}
                    value="B"
                    className="mr-3"
                  />
                  B. {item.option_b}
                </label>

                <label className="cursor-pointer rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-cyan-400">
                  <input
                    type="radio"
                    name={`question-${item.id}`}
                    value="C"
                    className="mr-3"
                  />
                  C. {item.option_c}
                </label>

                <label className="cursor-pointer rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-cyan-400">
                  <input
                    type="radio"
                    name={`question-${item.id}`}
                    value="D"
                    className="mr-3"
                  />
                  D. {item.option_d}
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            href="/result"
            className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Submit Jawaban
          </Link>
        </div>
      </section>
    </main>
  );
}