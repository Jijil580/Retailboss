import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { getIndiaTodayRange } from "@/lib/date-range";
import { connectMongo } from "@/lib/mongodb";
import { Expense } from "@/models/Expense";

export const dynamic = "force-dynamic";

async function requireExpenseUser() {
  const session = await getSession();
  if (!session) return null;
  return session.role === "admin" || session.permissions.includes("add_expenses")
    ? session
    : null;
}

function expenseFields(body: Record<string, unknown>) {
  return {
    category: String(body.category ?? "").trim().slice(0, 80),
    amount: Math.round((Math.max(0, Number(body.amount) || 0) + Number.EPSILON) * 100) / 100,
    paidTo: String(body.paidTo ?? "").trim().slice(0, 120),
    paymentMode: ["cash", "upi", "card", "bank"].includes(String(body.paymentMode))
      ? String(body.paymentMode)
      : "cash",
    referenceNumber: String(body.referenceNumber ?? "").trim().slice(0, 100),
    description: String(body.description ?? "").trim().slice(0, 240),
    notes: String(body.notes ?? "").trim().slice(0, 500),
  };
}

export async function GET(request: NextRequest) {
  const session = await requireExpenseUser();
  if (!session) {
    return NextResponse.json({ error: "Expense access required" }, { status: 403 });
  }
  await connectMongo();
  const filter: Record<string, unknown> = { shopId: session.shopId };
  if (session.role !== "admin") {
    const { start, end } = getIndiaTodayRange();
    filter.createdBy = new Types.ObjectId(session.id);
    filter.expenseDate = { $gte: start, $lte: end };
  } else {
    const month = request.nextUrl.searchParams.get("month");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    let start = from ? new Date(`${from}T00:00:00+05:30`) : null;
    let end = to ? new Date(`${to}T23:59:59.999+05:30`) : null;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, monthNumber] = month.split("-").map(Number);
      start = new Date(`${year}-${String(monthNumber).padStart(2, "0")}-01T00:00:00+05:30`);
      end = new Date(
        Date.UTC(year, monthNumber, 0, 18, 29, 59, 999),
      );
    }
    if (start || end) {
      filter.expenseDate = {
        ...(start && !Number.isNaN(start.getTime()) ? { $gte: start } : {}),
        ...(end && !Number.isNaN(end.getTime()) ? { $lte: end } : {}),
      };
    }
  }
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { expenseNumber: { $regex: escaped, $options: "i" } },
      { category: { $regex: escaped, $options: "i" } },
      { paidTo: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
      { referenceNumber: { $regex: escaped, $options: "i" } },
      { createdByName: { $regex: escaped, $options: "i" } },
    ];
  }
  const expenses = await Expense.find(filter)
    .sort({ expenseDate: -1, createdAt: -1 })
    .limit(1000)
    .lean();
  return NextResponse.json({
    expenses,
    scope: session.role === "admin" ? "all" : "today",
  });
}

export async function POST(request: NextRequest) {
  const session = await requireExpenseUser();
  if (!session) {
    return NextResponse.json({ error: "Expense access required" }, { status: 403 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const fields = expenseFields(body);
  if (!fields.category || !fields.paidTo || !fields.description || fields.amount <= 0) {
    return NextResponse.json(
      { error: "Category, paid to, description, and amount are required" },
      { status: 400 },
    );
  }
  let expenseDate = body.expenseDate
    ? new Date(`${String(body.expenseDate)}T12:00:00+05:30`)
    : new Date();
  if (session.role !== "admin") expenseDate = new Date();
  if (Number.isNaN(expenseDate.getTime())) expenseDate = new Date();
  await connectMongo();
  const expense = await Expense.create({
    shopId: session.shopId,
    expenseNumber: `EXP-${Date.now().toString().slice(-9)}`,
    expenseDate,
    ...fields,
    createdBy: new Types.ObjectId(session.id),
    createdByName: session.name,
  });
  return NextResponse.json({ expense }, { status: 201 });
}
