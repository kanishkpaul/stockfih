import { NextRequest, NextResponse } from "next/server";

import { buildExplanationMessages, buildFallbackExplanation } from "@/lib/prompts";
import type { ExplainRoutePayload } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

function isExplainRoutePayload(value: unknown): value is ExplainRoutePayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<ExplainRoutePayload>;

  return (
    typeof payload.fen === "string" &&
    typeof payload.playedMove === "string" &&
    typeof payload.classification === "string" &&
    typeof payload.pgnContext === "string" &&
    typeof payload.tone === "string"
  );
}

export async function POST(request: NextRequest) {
  let payload: ExplainRoutePayload;

  try {
    const body = await request.json();

    if (!isExplainRoutePayload(body)) {
      return NextResponse.json(
        { error: "Invalid explanation payload." },
        { status: 400 },
      );
    }

    payload = body;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const token = process.env.HF_TOKEN?.trim();
  const model = process.env.HF_MODEL?.trim() || DEFAULT_HF_MODEL;

  if (!token) {
    return NextResponse.json({
      explanation: buildFallbackExplanation(payload),
      model,
      source: "template" as const,
    });
  }

  try {
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_tokens: 240,
        messages: buildExplanationMessages(payload),
        model,
        temperature: 0.25,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const explanation = data.choices?.[0]?.message?.content?.trim();

    if (!explanation) {
      throw new Error("The model returned an empty explanation.");
    }

    return NextResponse.json({
      explanation,
      model,
      source: "huggingface" as const,
    });
  } catch {
    return NextResponse.json({
      explanation: buildFallbackExplanation(payload),
      model,
      source: "template" as const,
    });
  }
}
