import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Purchase } from "@/models/Purchase";
import { Supplier } from "@/models/Supplier";

export const dynamic = "force-dynamic";

async function requireSupplierUser() {
  const session = await getSession();
  if (!session) return null;
  return session.role === "admin" || session.permissions.includes("manage_suppliers")
    ? session
    : null;
}

function supplierFields(body: Record<string, unknown>) {
  return {
    name: String(body.name ?? "").trim().slice(0, 120),
    contactPerson: String(body.contactPerson ?? "").trim().slice(0, 100),
    phone: String(body.phone ?? "").replace(/[^\d+]/g, "").slice(0, 16),
    email: String(body.email ?? "").trim().toLowerCase().slice(0, 120),
    gstNumber: String(body.gstNumber ?? "").trim().toUpperCase().slice(0, 15),
    address: String(body.address ?? "").trim().slice(0, 240),
    city: String(body.city ?? "").trim().slice(0, 80),
    state: String(body.state ?? "").trim().slice(0, 80),
    pincode: String(body.pincode ?? "").trim().slice(0, 12),
    openingBalance: Math.max(0, Number(body.openingBalance) || 0),
  };
}

export async function GET() {
  const session = await requireSupplierUser();
  if (!session) {
    return NextResponse.json({ error: "Supplier access required" }, { status: 403 });
  }
  await connectMongo();
  const suppliers = await Supplier.find({ shopId: session.shopId, active: true })
    .sort({ name: 1 })
    .lean();
  const totals = await Purchase.aggregate([
    { $match: { shopId: session.shopId, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: "$supplierId",
        totalPurchased: { $sum: "$total" },
        totalPaid: { $sum: "$paid" },
        totalPending: { $sum: "$pending" },
        purchaseCount: { $sum: 1 },
      },
    },
  ]);
  const totalMap = new Map(totals.map((entry) => [String(entry._id), entry]));
  return NextResponse.json({
    suppliers: suppliers.map((supplier) => ({
      ...supplier,
      totalPurchased: totalMap.get(String(supplier._id))?.totalPurchased ?? 0,
      totalPaid: totalMap.get(String(supplier._id))?.totalPaid ?? 0,
      totalPending:
        (totalMap.get(String(supplier._id))?.totalPending ?? 0) +
        Number(supplier.openingBalance ?? 0),
      purchaseCount: totalMap.get(String(supplier._id))?.purchaseCount ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSupplierUser();
  if (!session) {
    return NextResponse.json({ error: "Supplier access required" }, { status: 403 });
  }
  const fields = supplierFields(await request.json());
  if (!fields.name || !fields.phone) {
    return NextResponse.json(
      { error: "Supplier name and phone number are required" },
      { status: 400 },
    );
  }
  await connectMongo();
  const supplier = await Supplier.create({ shopId: session.shopId, ...fields });
  return NextResponse.json({ supplier }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSupplierUser();
  if (!session) {
    return NextResponse.json({ error: "Supplier access required" }, { status: 403 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "");
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid supplier" }, { status: 400 });
  }
  const fields = supplierFields(body);
  if (!fields.name || !fields.phone) {
    return NextResponse.json(
      { error: "Supplier name and phone number are required" },
      { status: 400 },
    );
  }
  await connectMongo();
  const supplier = await Supplier.findOneAndUpdate(
    { _id: id, shopId: session.shopId },
    { $set: fields },
    { new: true, runValidators: true },
  );
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  return NextResponse.json({ supplier });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSupplierUser();
  if (!session) {
    return NextResponse.json({ error: "Supplier access required" }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid supplier" }, { status: 400 });
  }
  await connectMongo();
  const supplier = await Supplier.findOneAndUpdate(
    { _id: id, shopId: session.shopId },
    { $set: { active: false } },
  );
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
