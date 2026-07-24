import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import InvoiceClient from "./invoice-client";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  return <InvoiceClient invoiceId={id} />;
}
