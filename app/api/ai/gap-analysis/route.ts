import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

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
  score: number | string;
  level: string;
  physics_topics: TopicRelation;
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

function buildPrompt(totalScore: number, topicScores: TopicScore[]) {
  const sortedScores = [...topicScores].sort((a, b) => {
    return Number(a.score) - Number(b.score);
  });

  const topicSummary = sortedScores
    .map((item) => {
      const topic = getTopic(item.physics_topics);

      return `- ${topic.name}: skor ${item.score}, status ${item.level}. Deskripsi topik: ${topic.description}`;
    })
    .join("\n");

  return `
Kamu adalah AI tutor Fisika SMA untuk platform PhysiPath.

Tugasmu:
Buat analisis personal hasil tes diagnostik siswa berdasarkan skor total dan skor per topik.

Data siswa:
Skor total diagnostik: ${totalScore}

Skor per topik:
${topicSummary}

Format jawaban wajib dalam Bahasa Indonesia.
Gunakan gaya bahasa jelas, ramah, dan mudah dipahami siswa SMA.

Susun jawaban dengan format berikut:

1. Ringkasan Kondisi Siswa
Jelaskan kondisi umum siswa berdasarkan skor total.

2. Topik Prioritas
Sebutkan topik yang harus dipelajari lebih dulu dari skor terendah.

3. Dugaan Penyebab Gap
Jelaskan kemungkinan penyebab siswa lemah pada topik tersebut. Jangan menghakimi siswa.

4. Rekomendasi Urutan Belajar
Buat urutan belajar konkret dari topik paling lemah ke topik yang lebih kuat.

5. Strategi Latihan
Beri strategi latihan yang praktis dan bisa dilakukan siswa.

6. Catatan Motivasi
Beri motivasi singkat yang realistis, tidak berlebihan.

Batas panjang jawaban: maksimal 450 kata.
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
    const attemptId = body.attemptId as string;

    if (!attemptId) {
      return Response.json(
        { error: "Attempt ID tidak ditemukan." },
        { status: 400 }
      );
    }

    const { data: cachedFeedback } = await supabase
      .from("ai_feedbacks")
      .select("content")
      .eq("attempt_id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cachedFeedback?.content) {
      return Response.json({
        content: cachedFeedback.content,
        cached: true,
      });
    }

    const { data: attemptData, error: attemptError } = await supabase
      .from("diagnostic_attempts")
      .select("id, total_score, user_id")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (attemptError || !attemptData) {
      return Response.json(
        { error: attemptError?.message || "Attempt tidak ditemukan." },
        { status: 404 }
      );
    }

    const { data: scoreData, error: scoreError } = await supabase
      .from("topic_scores")
      .select(`
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
      return Response.json(
        { error: scoreError?.message || "Gagal mengambil skor topik." },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(
      Number(attemptData.total_score),
      scoreData as TopicScore[]
    );

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    const content =
      response.text || "AI belum berhasil membuat analisis untuk hasil ini.";

    await supabase.from("ai_feedbacks").insert({
      user_id: user.id,
      attempt_id: attemptId,
      content,
    });

    return Response.json({
      content,
      cached: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi error tidak diketahui.";

    return Response.json({ error: message }, { status: 500 });
  }
}