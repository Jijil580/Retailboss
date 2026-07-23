import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { User, USER_PERMISSIONS } from "@/models/User";

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "admin" ? session : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  await connectMongo();
  const users = await User.find({ shopId: admin.shopId })
    .select("name email role permissions active lastLoginAt createdAt")
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "staff";
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((permission: string) =>
          USER_PERMISSIONS.includes(permission as (typeof USER_PERMISSIONS)[number]),
        )
      : [];

    if (name.length < 2 || !email.includes("@") || password.length < 8) {
      return NextResponse.json(
        { error: "Enter a valid name, email, and password of at least 8 characters" },
        { status: 400 },
      );
    }

    await connectMongo();
    const user = await User.create({
      shopId: admin.shopId,
      name,
      email,
      passwordHash: await hash(password, 12),
      role,
      permissions: role === "admin" ? [] : permissions,
      active: true,
    });
    return NextResponse.json(
      { user: { id: user._id, name, email, role, permissions, active: true } },
      { status: 201 },
    );
  } catch (error) {
    const duplicate =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      { error: duplicate ? "A user with this email already exists" : "Unable to create user" },
      { status: duplicate ? 409 : 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id || id === admin.id) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }

  await connectMongo();
  const user = await User.findOneAndUpdate(
    { _id: id, shopId: admin.shopId },
    { $set: { active: Boolean(body.active) } },
    { new: true },
  ).select("name email role permissions active");

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}
