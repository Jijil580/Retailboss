import { compare, hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/User";

const SHOP_ID = "urban-thread";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectMongo();
    let user = await User.findOne({ shopId: SHOP_ID, email }).select("+passwordHash");

    const bootstrapEmail = (process.env.ADMIN_EMAIL ?? "admin@retailboss.app").toLowerCase();
    const bootstrapPassword = process.env.ADMIN_PASSWORD;

    if (!user && email === bootstrapEmail && bootstrapPassword && password === bootstrapPassword) {
      user = await User.create({
        shopId: SHOP_ID,
        name: "RetailBoss Admin",
        email,
        passwordHash: await hash(password, 12),
        role: "admin",
        permissions: [],
        active: true,
      });
    }

    if (!user || !user.active || !(await compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = await createSessionToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
      permissions: user.permissions,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in service is unavailable" }, { status: 503 });
  }
}
