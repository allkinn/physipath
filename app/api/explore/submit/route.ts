import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

type ExploreChallenge = {
  id: string;
  title: string;
  theme: string;
  problem_context: string;
  task_instruction: string;
};

type AiEvaluation = {
  problem_solving_score: number;
  critical_thinking_score: number;
  communication_score: number;
  creativity_score: number;
  feedback: string;
};

function clampScore(value: unknown) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI tidak mengembalikan format JSON yang valid.");
  }

  return JSON.parse(match[0]);
}

function buildPrompt(challenge: ExploreChallenge, answer: string) {
  return `
Kamu adalah evaluator soft skill untuk platform pembelajaran PhysiPath.

Tugasmu:
Nilai jawaban siswa pada challenge berbasis masalah nyata.

Challenge:
Judul: ${challenge.title}
Tema: ${challenge.theme}

Konteks masalah:
${challenge.problem_context}

Instruksi tugas:
${challenge.task_instruction}

Jawaban siswa:
${answer}

Nilai jawaban siswa berdasarkan 4 aspek:
1. problem_solving_score: kemampuan memahami masalah dan memberi solusi
2. critical_thinking_score: kemampuan memberi alasan, analisis, konsekuensi, atau batasan solusi
3. communication_score: kejelasan struktur jawaban dan cara menyampaikan ide
4. creativity_score: kebaruan, relevansi, dan kreativitas solusi

Skor tiap aspek 0 sampai 100.

Berikan feedback ringkas dalam Bahasa Indonesia.
Feedback harus berisi:
- kekuatan jawaban
- bagian yang perlu diperbaiki
- saran konkret agar jawaban lebih kuat

WAJIB balas hanya dalam JSON valid tanpa markdown, tanpa backtick, tanpa teks tambahan.

Format JSON:
{
  "problem_solving_score": 80,
  "critical_thinking_score": 75,
  "communication_score": 78,
  "creativity_score": 82,
  "feedback": "..."
}
`;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        { error: "Supabase env belum lengkap." },
        { status: 500 }
      );
    }

    if (!geminiApiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY belum diisi di .env.local." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return Response.json(
        { error: "Authorization token tidak ditemukan. Login dulu." },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: "Session tidak valid. Login ulang dulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const challengeId = body.challengeId as string;
    const answer = body.answer as string;

    if (!challengeId) {
      return Response.json(
        { error: "Challenge ID tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!answer || answer.trim().length < 80) {
      return Response.json(
        { error: "Jawaban terlalu pendek. Minimal sekitar 80 karakter." },
        { status: 400 }
      );
    }

    const { data: challengeData, error: challengeError } = await supabase
      .from("explore_challenges")
      .select("id, title, theme, problem_context, task_instruction")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challengeData) {
      return Response.json(
        { error: challengeError?.message || "Challenge tidak ditemukan." },
        { status: 404 }
      );
    }

    const challenge = challengeData as ExploreChallenge;

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildPrompt(challenge, answer),
      config: {
        temperature: 0.25,
      },
    });

    const rawText = response.text || "";

    let parsed: AiEvaluation;

    try {
      const json = extractJson(rawText);

      parsed = {
        problem_solving_score: clampScore(json.problem_solving_score),
        critical_thinking_score: clampScore(json.critical_thinking_score),
        communication_score: clampScore(json.communication_score),
        creativity_score: clampScore(json.creativity_score),
        feedback:
          typeof json.feedback === "string"
            ? json.feedback
            : "AI berhasil menilai jawaban, tetapi feedback tidak terbaca dengan baik.",
      };
    } catch {
      parsed = {
        problem_solving_score: 0,
        critical_thinking_score: 0,
        communication_score: 0,
        creativity_score: 0,
        feedback:
          "AI belum mengembalikan format penilaian yang valid. Coba submit ulang atau perbaiki struktur jawaban.",
      };
    }

    const { data: submission, error: insertError } = await supabase
      .from("explore_submissions")
      .insert({
        user_id: user.id,
        challenge_id: challenge.id,
        answer,
        problem_solving_score: parsed.problem_solving_score,
        critical_thinking_score: parsed.critical_thinking_score,
        communication_score: parsed.communication_score,
        creativity_score: parsed.creativity_score,
        feedback: parsed.feedback,
      })
      .select(`
        id,
        answer,
        problem_solving_score,
        critical_thinking_score,
        communication_score,
        creativity_score,
        feedback,
        created_at
      `)
      .single();

    if (insertError || !submission) {
      return Response.json(
        { error: insertError?.message || "Gagal menyimpan submission." },
        { status: 500 }
      );
    }

    return Response.json({
      submission,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi error tidak diketahui.";

    return Response.json({ error: message }, { status: 500 });
  }
}