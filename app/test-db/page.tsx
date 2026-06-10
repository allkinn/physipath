import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function TestDatabasePage() {
  const { data: topics, error } = await supabase
    .from("physics_topics")
    .select("id, name, description, order_index")
    .order("order_index", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-3xl font-bold text-red-300">Database Error</h1>
        <pre className="mt-6 rounded-2xl bg-slate-900 p-6 text-sm text-red-200">
          {error.message}
        </pre>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-cyan-300">Supabase Test</p>
        <h1 className="mt-2 text-3xl font-bold">Topik Fisika dari Database</h1>
        <p className="mt-3 text-slate-400">
          Kalau data di bawah muncul, berarti Next.js sudah berhasil tersambung ke Supabase.
        </p>

        <div className="mt-8 grid gap-4">
          {topics?.map((topic) => (
            <div
              key={topic.id}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-sm text-cyan-300">Topik {topic.order_index}</p>
              <h2 className="mt-2 text-xl font-bold">{topic.name}</h2>
              <p className="mt-2 leading-7 text-slate-400">{topic.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}