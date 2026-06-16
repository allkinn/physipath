import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

type TopicRelation =
  | {
      name: string;
      description: string;
    }
  | {
      name: string;
      description: string;
    }[]
  | null;

type ModuleRelation =
  | {
      title: string;
      difficulty_label: string;
      physics_topics: TopicRelation;
    }
  | {
      title: string;
      difficulty_label: string;
      physics_topics: TopicRelation;
    }[]
  | null;

type PracticeQuestion = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  learning_modules: ModuleRelation;
};

function getModule(module: ModuleRelation) {
  if (!module) {
    return {
      title: "Modul tidak ditemukan",
      difficulty_label: "",
      physics_topics: null,
    };
  }

  if (Array.isArray(module)) {
    return (
      module[0] ?? {
        title: "Modul tidak ditemukan",
        difficulty_label: "",
        physics_topics: null,
      }
    );
  }

  return module;
}

function getTopic(topic: TopicRelation) {
  if (!topic) {
    return {
      name: "Tanpa Topik",
      description: "",
    };
  }

  if (Array.isArray(topic)) {
    return (
      topic[0] ?? {
        name: "Tanpa Topik",
        description: "",
      }
    );
  }

  return topic;
}

function getOptionText(question: PracticeQuestion, answer: string) {
  if (answer === "A") return question.option_a;
  if (answer === "B") return question.option_b;
  if (answer === "C") return question.option_c;
  if (answer === "D") return question.option_d;
  return "-";
}

function buildPrompt({
  question,
  selectedAnswer,
  isCorrect,
}: {
  question: PracticeQuestion;
  selectedAnswer: string;
  isCorrect: boolean;
}) {
  const module = getModule(question.learning_modules);
  const topic = getTopic(module.physics_topics);

  const selectedText = getOptionText(question, selectedAnswer);
  const correctText = getOptionText(question, question.correct_answer);

  return `
Kamu adalah AI Tutor Fisika SMA dalam platform PhysiPath.

Tugasmu:
Jelaskan hasil jawaban siswa pada satu soal latihan secara personal, jelas, dan mudah dipahami.

Data soal:
Topik: ${topic.name}
Deskripsi topik: ${topic.description}
Modul: ${module.title}
Level modul: ${module.difficulty_label}

Soal:
${question.question_text}

Pilihan:
A. ${question.option_a}
B. ${question.option_b}
C. ${question.option_c}
D. ${question.option_d}

Jawaban siswa: ${selectedAnswer}. ${selectedText}
Jawaban benar: ${question.correct_answer}. ${correctText}
Status jawaban siswa: ${isCorrect ? "Benar" : "Salah"}

Pembahasan dasar dari sistem:
${question.explanation}

Buat penjelasan dalam Bahasa Indonesia dengan format berikut:

1. Evaluasi Jawaban
Jelaskan apakah jawaban siswa benar atau salah.

2. Konsep Kunci
Jelaskan konsep Fisika yang dipakai pada soal ini.

3. Kenapa Jawaban Itu Benar
Jelaskan alasan jawaban benar dengan langkah berpikir yang sederhana.

4. Jika Siswa Salah
Jika jawaban siswa salah, jelaskan kemungkinan miskonsepsinya tanpa menghakimi. Jika benar, beri penguatan.

5. Contoh Soal Mirip
Buat satu contoh soal mirip yang singkat beserta jawabannya.

Batas panjang maksimal 350 kata.
Gunakan gaya tutor yang ramah, tidak terlalu formal, tapi tetap edukatif.
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
    const questionId = body.questionId as string;

    if (!attemptId || !questionId) {
      return Response.json(
        { error: "Attempt ID atau Question ID tidak ditemukan." },
        { status: 400 }
      );
    }

    const { data: cached } = await supabase
      .from("ai_tutor_explanations")
      .select("content")
      .eq("user_id", user.id)
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .maybeSingle();

    if (cached?.content) {
      return Response.json({
        content: cached.content,
        cached: true,
      });
    }

    const { data: attemptData, error: attemptError } = await supabase
      .from("practice_attempts")
      .select("id, user_id, module_id")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (attemptError || !attemptData) {
      return Response.json(
        { error: attemptError?.message || "Attempt latihan tidak ditemukan." },
        { status: 404 }
      );
    }

    const { data: answerData, error: answerError } = await supabase
      .from("practice_answers")
      .select("selected_answer, is_correct")
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .single();

    if (answerError || !answerData) {
      return Response.json(
        { error: answerError?.message || "Jawaban latihan tidak ditemukan." },
        { status: 404 }
      );
    }

    const { data: questionData, error: questionError } = await supabase
      .from("practice_questions")
      .select(`
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation,
        learning_modules (
          title,
          difficulty_label,
          physics_topics (
            name,
            description
          )
        )
      `)
      .eq("id", questionId)
      .eq("module_id", attemptData.module_id)
      .single();

    if (questionError || !questionData) {
      return Response.json(
        { error: questionError?.message || "Soal latihan tidak ditemukan." },
        { status: 404 }
      );
    }

    const question = questionData as PracticeQuestion;

    const prompt = buildPrompt({
      question,
      selectedAnswer: answerData.selected_answer,
      isCorrect: answerData.is_correct,
    });

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.35,
      },
    });

    const content =
      response.text || "AI belum berhasil membuat penjelasan untuk soal ini.";

    await supabase.from("ai_tutor_explanations").insert({
      user_id: user.id,
      attempt_id: attemptId,
      question_id: questionId,
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