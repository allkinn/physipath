"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AiGapAnalysis({
  attemptId,
}: {
  attemptId: string | null;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generateAnalysis() {
    setLoading(true);
    setMessage("");

    if (!attemptId) {
      setMessage("Attempt ID tidak ditemukan.");
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage("Lu harus login dulu untuk membuat analisis AI.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/ai/gap-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        attemptId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Gagal membuat analisis AI.");
      setLoading(false);
      return;
    }

    setContent(data.content);
    setLoading(false);
  }

  return (
    <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Sparkles />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-cyan-300">AI Gap Analysis</p>
          <h2 className="mt-1 text-xl font-bold">Analisis Personal dari AI</h2>
          <p className="mt-3 leading-7 text-slate-300">
            AI akan membaca skor diagnostik dan menyusun penjelasan personal
            tentang topik prioritas, dugaan penyebab gap, dan strategi belajar.
          </p>

          {!content && (
            <button
              type="button"
              onClick={generateAnalysis}
              disabled={loading}
              className="mt-5 rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Membuat analisis..." : "Buat Analisis AI"}
            </button>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {message}
            </div>
          )}

          {content && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="space-y-4 whitespace-pre-line leading-8 text-slate-300">
                {content}
              </div>

              <button
                type="button"
                onClick={generateAnalysis}
                disabled={loading}
                className="mt-6 rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Muat Ulang Analisis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}