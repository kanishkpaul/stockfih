import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Configure BYOK or a local model in AI connection. The shared-token endpoint has been retired." },
    { status: 410 },
  );
}
