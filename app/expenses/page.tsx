import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ExpensesClient from "./expenses-client";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && !session.permissions.includes("add_expenses")) {
    redirect("/");
  }
  return <ExpensesClient isAdmin={session.role === "admin"} />;
}
