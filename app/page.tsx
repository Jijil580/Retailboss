import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardClient
      currentUser={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    />
  );
}
