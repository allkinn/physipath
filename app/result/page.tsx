"use client";

import AiGapAnalysis from "../../components/AiGapAnalysis";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type TopicRelation =
  | {
      name: string;
      description: string;
      order_index: number;
    }
  | {
      name: string;
      description: string;
      order_index: number;
    }[]
  | null;

type TopicScore = {
  id: string;
  score: number;
  level: string;
  physics_topics: TopicRelation;
};

type Attempt = {
  id: string;
  total_score: number;
  created_at: string;
};

function getTopic(topic: TopicRelation) {
  if (!topic) {
    return {
      name: "Tanpa Topik",
      description: "",
      order_index: 999,
    };
  }

  if (Array.isArray(topic)) {
    return (
      topic[0] ?? {
        name: "Tanpa Topik",
        description: "",
        order_index: 999,
      }
    );
  }

  return topic;
}

function getRecommendation(level: string, topicName: string) {
  if (level === "Gap Berat") {
    return `Fokus utama belajar ulang ${topicName} dari konsep paling dasar sebelum lanjut ke soal menengah.`;
  }

  if (level === "Perlu Penguatan") {
    return `Perkuat ${topicName} dengan latihan soal bertahap dan pembahasan kesalahan.`;
  }

  return `Pemahaman ${topicName} sudah cukup baik. Lanjutkan ke soal aplikasi dan tantangan.`;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt");

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [scores, setScores] = useState<TopicScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) {
        setMessage("Attempt ID tidak ditemukan.");
        setLoading(false);
        return;
      }

      const { data: attemptData, error: attemptError } = await supabase
        .from("diagnostic_attempts")
        .select("id, total_score, created_at")
        .eq("id", attemptId)
        .single();

      if (attemptError || !attemptData) {
        setMessage(attemptError?.message || "Gagal mengambil data attempt.");
        setLoading(false);
        return;
      }

      const { data: scoreData, error: scoreError } = await supabase
        .from("topic_scores")
        .select(`
          id,
          score,
          level,
          physics_topics (
            name,
            description,
            order_index
          )
        `)
        .eq("attempt_id", attemptId);

      if (scoreError || !scoreData) {
        setMessage(scoreError?.message || "Gagal mengambil skor topik.");
        setLoading(false);
        return;
      }

      const sortedScores = (scoreData as TopicScore[]).sort((a, b) => {
        return (
          getTopic(a.physics_topics).order_index -
          getTopic(b.physics_topics).order_index
        );
      });

      setAttempt(attemptData as Attempt);
      setScores(sortedScores);
      setLoading(false);
    }

    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-slate-300">Mengambil hasil diagnostik...</p>
        </div>
      </main>
    );
  }

  if (message) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-2xl font-bold text-red-200">Gagal memuat hasil</h1>
          <p className="mt-3 text-red-100">{message}</p>

          <Link
            href="/diagnostic"
            className="mt-6 inline-block rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
          >
            Kembali ke Tes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-5xl">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Hasil Diagnostik</p>
          <h1 className="mt-2 text-3xl font-bold">Analisis Gap Akademik</h1>
          <p className="mt-3 leading-7 text-slate-400">
            Berikut adalah hasil asli berdasarkan jawaban yang baru saja disubmit.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <p className="text-sm text-cyan-300">Skor Total</p>
          <h2 className="mt-2 text-5xl font-bold text-white">
            {attempt?.total_score}
          </h2>
          <p className="mt-3 text-slate-300">
            Skor ini dihitung dari seluruh jawaban benar pada tes diagnostik.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {scores.map((item) => {
            const topic = getTopic(item.physics_topics);

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{topic.name}</h2>
                    <p className="mt-2 text-slate-400">
                      {getRecommendation(item.level, topic.name)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold">{item.score}</p>
                    <p className="text-sm text-cyan-300">{item.level}</p>
                  </div>
                </div>

                <div className="mt-5 h-3 rounded-full bg-slate-800">
                  <div
                    className="h-3 rounded-full bg-cyan-400"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <h2 className="text-xl font-bold text-cyan-300">Rekomendasi Sistem</h2>
          <p className="mt-3 leading-7 text-slate-300">
            Mulailah dari topik dengan skor paling rendah. Sistem akan menggunakan
            hasil ini sebagai dasar untuk menyusun rekomendasi materi dan latihan
            adaptif pada tahap berikutnya.
          </p>
        </div>
        <AiGapAnalysis attemptId={attemptId} />

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Kembali ke Dashboard
          </Link>
          <Link
            href="/learn"
            className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Lihat Rekomendasi Materi
          </Link>

          <Link
            href="/diagnostic"
            className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Ulangi Tes
          </Link>
          <Link
            href="/practice"
            className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Latihan Adaptif
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-300">Memuat hasil diagnostik...</p>
          </div>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}