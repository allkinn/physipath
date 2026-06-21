"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function MarkModuleCompleteButton({
  moduleId,
}: {
  moduleId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkProgress();
  }, []);

  async function checkProgress() {
    setLoading(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("module_progress")
      .select("is_read")
      .eq("user_id", session.user.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setIsRead(data?.is_read ?? false);
    setLoading(false);
  }

  async function handleMarkComplete() {
    setSaving(true);
    setMessage("");
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("module_progress").upsert(
      {
        user_id: session.user.id,
        module_id: moduleId,
        is_read: true,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,module_id",
      }
    );

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setIsRead(true);
    setMessage("Modul berhasil ditandai selesai.");
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-cyan-300" size={18} />
          Mengecek progres modul...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Status Modul</h3>
          <p className="mt-2 text-slate-400">
            Tandai modul ini selesai setelah kamu membaca dan memahami materinya.
          </p>
        </div>

        {isRead ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 font-semibold text-emerald-300">
            <CheckCircle2 size={18} />
            Completed
          </div>
        ) : (
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Tandai Selesai
              </>
            )}
          </button>
        )}
      </div>

      {message && (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}