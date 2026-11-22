import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForms } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <AuthForms mode="login" />;
}
