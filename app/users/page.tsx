import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  return <UsersClient currentUser={{ name: session.name, email: session.email }} />;
}
