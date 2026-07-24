import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PosClient from "./pos-client";

export default async function PosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && !session.permissions.includes("create_sales")) redirect("/");
  return <PosClient />;
}
