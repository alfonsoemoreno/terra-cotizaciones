import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { dashboard } from "@/lib/repository";
import { localDemo } from "@/db";
import { TerraApp } from "@/components/terra-app";
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await requireOwner();
  } catch {
    redirect("/login");
  }
  const data = await dashboard();
  return (
    <TerraApp initial={JSON.parse(JSON.stringify(data))} demo={localDemo()} />
  );
}
