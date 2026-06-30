"use client";

function mask(value: string | undefined) {
  if (!value) return "MISSING";

  return {
    prefix: value.slice(0, 14),
    suffix: value.slice(-6),
    length: value.length,
  };
}

export default function DebugVercelPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Debug Vercel Env</h1>

        <pre className="mt-6 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-300">
          {JSON.stringify(
            {
              supabaseUrl,
              anonKey: mask(supabaseAnonKey),
            },
            null,
            2
          )}
        </pre>
      </div>
    </main>
  );
}