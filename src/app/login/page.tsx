import { authConfigured, ownerEmail } from "@/lib/auth";
import { Login } from "@/components/login";
import { localDemo } from "@/db";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  if (localDemo()) redirect("/");
  return <Login configured={authConfigured()} email={ownerEmail()} />;
}
