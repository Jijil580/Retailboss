import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "retailboss_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  shopId: string;
  permissions: string[];
};

function getSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters");
  }
  return value;
}

export async function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      permissions: [...user.permissions],
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const [payloadPart, signaturePart] = token.split(".");
    if (!payloadPart || !signaturePart) return null;

    const expectedSignature = createHmac("sha256", getSecret())
      .update(payloadPart)
      .digest();
    const receivedSignature = Buffer.from(signaturePart, "base64url");
    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8"),
    ) as SessionUser & { expiresAt?: number };
    if (
      typeof payload.id !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "admin" && payload.role !== "staff") ||
      typeof payload.shopId !== "string" ||
      !Array.isArray(payload.permissions) ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt < Date.now()
    ) {
      return null;
    }
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      shopId: payload.shopId,
      permissions: payload.permissions.map(String),
    };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}
