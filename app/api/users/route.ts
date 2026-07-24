import { compare, hash } from "bcryptjs";
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
  if (!id) return NextResponse.json({ error: "User id is required" }, { status: 400 });

  try {
    await connectMongo();
    const user = await User.findOne({ _id: id, shopId: admin.shopId }).select(
      "+passwordHash",
    );
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isSelf = id === admin.id;
    if (typeof body.active === "boolean") {
      if (isSelf && !body.active) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account" },
          { status: 400 },
        );
      }
      user.active = body.active;
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) {
        return NextResponse.json({ error: "Enter a valid name" }, { status: 400 });
      }
      user.name = name;
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!email.includes("@")) {
        return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
      }
      user.email = email;
    }
    if (!isSelf && body.role !== undefined) {
      user.role = body.role === "admin" ? "admin" : "staff";
      const requestedPermissions = Array.isArray(body.permissions)
        ? body.permissions.filter((permission: string) =>
            USER_PERMISSIONS.includes(
              permission as (typeof USER_PERMISSIONS)[number],
            ),
          )
        : [];
      user.permissions = user.role === "admin" ? [] : requestedPermissions;
    }

    const newPassword = String(body.newPassword ?? "");
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 },
        );
      }
      if (isSelf) {
        const currentPassword = String(body.currentPassword ?? "");
        if (!currentPassword || !(await compare(currentPassword, user.passwordHash))) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 401 },
          );
        }
      }
      user.passwordHash = await hash(newPassword, 12);
    }

    await user.save();
    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        active: user.active,
      },
      requiresLogin: isSelf && Boolean(newPassword),
    });
  } catch (error) {
    const duplicate =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      { error: duplicate ? "A user with this email already exists" : "Unable to update user" },
      { status: duplicate ? 409 : 503 },
    );
  }
}
