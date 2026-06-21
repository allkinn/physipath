import DiagnosticForm, {
  DiagnosticQuestion,
} from "../../components/DiagnosticForm";
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

type RawQuestion = {
  id: string;
  code: string;
  topic_id: string;
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
    .from("safe_questions")
    .select(`
      id,
      code,
      topic_id,
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

  const rawQuestions = (data ?? []) as RawQuestion[];

  const questions: DiagnosticQuestion[] = rawQuestions.map((item) => ({
    id: item.id,
    code: item.code,
    topic_id: item.topic_id,
    topic_name: getTopicName(item.physics_topics),
    question_text: item.question_text,
    option_a: item.option_a,
    option_b: item.option_b,
    option_c: item.option_c,
    option_d: item.option_d,
    difficulty: item.difficulty,
  }));

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

        <DiagnosticForm questions={questions} />
      </section>
    </main>
  );
}