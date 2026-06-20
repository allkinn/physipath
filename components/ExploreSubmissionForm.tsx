"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../lib/supabase";

type ExploreChallenge = {
  id: string;
  title: string;
};

type ExploreSubmission = {
  id: string;
  answer: string;
  problem_solving_score: number;
  critical_thinking_score: number;
  communication_score: number;
  creativity_score: number;
  feedback: string;
  created_at: string;
};

export default function ExploreSubmissionForm({
  challenge,
}: {
  challenge: ExploreChallenge;
}) {
  const [answer, setAnswer] = useState("");
  const [submission, setSubmission] = useState<ExploreSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    if (answer.trim().length < 80) {
      setMessage("Jawaban masih terlalu pendek. Jelaskan solusi minimal 80 karakter.");
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage("Lu harus login dulu sebelum submit challenge.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/explore/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        challengeId: challenge.id,
        answer,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Gagal submit challenge.");
      setLoading(false);
      return;
    }

    setSubmission(data.submission as ExploreSubmission);
    setLoading(false);
  }

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">Tulis Solusimu</h2>
      <p className="mt-3 leading-7 text-slate-400">
        Jelaskan solusi dengan struktur yang jelas: masalah utama, ide solusi,
        cara kerja, manfaat, dan tantangan penerapan.
      </p>

      {message && (
        <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {message}
        </div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={loading}
        placeholder="Tulis jawabanmu di sini..."
        className="mt-6 min-h-64 w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 leading-7 text-slate-200 outline-none focus:border-cyan-400 disabled:opacity-60"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          Panjang jawaban: {answer.trim().length} karakter
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !!submission}
          className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "AI sedang menilai..." : submission ? "Sudah Disubmit" : "Submit ke AI"}
        </button>
      </div>

      {submission && (
        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <p className="text-sm font-semibold text-cyan-300">Hasil Evaluasi AI</p>
          <h3 className="mt-2 text-2xl font-bold">Soft Skill Score</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ScoreCard title="Problem Solving" score={submission.problem_solving_score} />
            <ScoreCard title="Critical Thinking" score={submission.critical_thinking_score} />
            <ScoreCard title="Communication" score={submission.communication_score} />
            <ScoreCard title="Creativity" score={submission.creativity_score} />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-semibold text-cyan-300">Feedback AI</p>
            <p className="mt-3 whitespace-pre-line leading-8 text-slate-300">
              {submission.feedback}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Kembali ke Dashboard
            </Link>

            <Link
              href="/explore"
              className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
            >
              Challenge Lainnya
            </Link>
</div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold">{title}</p>
        <p className="text-2xl font-bold">{score}</p>
      </div>

      <div className="mt-4 h-3 rounded-full bg-slate-800">
        <div
          className="h-3 rounded-full bg-cyan-400"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}