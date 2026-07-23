import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await connectMongo();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const configured = Boolean(process.env.MONGODB_URI);
    return NextResponse.json(
      {
        status: configured ? "degraded" : "configuration_required",
        database: configured ? "unavailable" : "not_configured",
        message: configured
          ? "The database could not be reached."
          : "Add MONGODB_URI in Vercel to enable persistent data.",
        timestamp: new Date().toISOString(),
      },
      { status: configured ? 503 : 200 },
    );
  }
}
