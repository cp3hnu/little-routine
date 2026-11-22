import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForms } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return (
    <div className="space-y-4">
      <AuthForms mode="register" />
      <p className="text-center text-sm text-[var(--muted)]">
        <Link href="/login" className="underline">
          Login
        </Link>
      </p>
    </div>
  );
}
