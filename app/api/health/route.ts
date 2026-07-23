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
    const message = error instanceof Error ? error.message : "";
    const category = /auth|authentication/i.test(message)
      ? "authentication"
      : /querySrv|ENOTFOUND|DNS/i.test(message)
        ? "dns"
        : /Invalid scheme|Invalid connection string|MongoParseError/i.test(
              `${error instanceof Error ? error.name : ""} ${message}`,
            )
          ? "uri_format"
          : /timed out|Server selection|IP access/i.test(message)
            ? "network_access"
            : "unknown";
    return NextResponse.json(
      {
        status: configured ? "degraded" : "configuration_required",
        database: configured ? "unavailable" : "not_configured",
        category: configured ? category : "missing_uri",
        message: configured
          ? "The database could not be reached."
          : "Add MONGODB_URI in Vercel to enable persistent data.",
        timestamp: new Date().toISOString(),
      },
      { status: configured ? 503 : 200 },
    );
  }
}
