import Link from "next/link";

const results = [
  {
    topic: "GLB dan GLBB",
    score: 35,
    status: "Gap Berat",
    recommendation:
      "Pelajari ulang konsep jarak, kecepatan, percepatan, dan grafik gerak.",
  },
  {
    topic: "Hukum Newton",
    score: 60,
    status: "Perlu Penguatan",
    recommendation:
      "Perkuat konsep resultan gaya, massa, percepatan, dan gaya gesek.",
  },
  {
    topic: "Usaha dan Energi",
    score: 85,
    status: "Cukup Menguasai",
    recommendation:
      "Lanjutkan ke soal penerapan energi mekanik dan hukum kekekalan energi.",
  },
];

export default function ResultPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-5xl">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Hasil Diagnostik</p>
          <h1 className="mt-2 text-3xl font-bold">Analisis Gap Akademik</h1>
          <p className="mt-3 leading-7 text-slate-400">
            Berikut adalah contoh hasil analisis awal berdasarkan jawaban tes
            diagnostik Fisika.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {results.map((item) => (
            <div
              key={item.topic}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{item.topic}</h2>
                  <p className="mt-2 text-slate-400">{item.recommendation}</p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold">{item.score}</p>
                  <p className="text-sm text-cyan-300">{item.status}</p>
                </div>
              </div>

              <div className="mt-5 h-3 rounded-full bg-slate-800">
                <div
                  className="h-3 rounded-full bg-cyan-400"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <h2 className="text-xl font-bold text-cyan-300">Rekomendasi AI</h2>
          <p className="mt-3 leading-7 text-slate-300">
            Fokus belajar pertama adalah GLB dan GLBB karena skor pada topik ini
            masih rendah. Mulailah dari konsep kecepatan tetap, percepatan, lalu
            lanjut ke grafik posisi-waktu dan kecepatan-waktu.
          </p>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Kembali ke Dashboard
          </Link>

          <Link
            href="/diagnostic"
            className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Ulangi Tes
          </Link>
        </div>
      </section>
    </main>
  );
}