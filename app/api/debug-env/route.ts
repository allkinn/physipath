import { NextResponse } from "next/server";

function mask(value: string | undefined) {
  if (!value) return "MISSING";
  return {
    prefix: value.slice(0, 12),
    suffix: value.slice(-6),
    length: value.length,
  };
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return NextResponse.json({
    supabaseUrl: url
      ? {
          value: url,
          projectRef: url.replace("https://", "").replace(".supabase.co", ""),
        }
      : "MISSING",
    anonKey: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    geminiKey: mask(process.env.GEMINI_API_KEY),
  });
}

