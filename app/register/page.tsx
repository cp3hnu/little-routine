import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForms } from "@/components/auth-forms";
import { authPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = authPageMetadata("register");

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <AuthForms mode="register" />;
}
