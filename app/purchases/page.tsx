import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PurchasesClient from "./purchases-client";

export default async function PurchasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && !session.permissions.includes("manage_suppliers")) {
    redirect("/");
  }
  return <PurchasesClient />;
}
