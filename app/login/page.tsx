import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForms } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return (
    <div className="space-y-4">
      <AuthForms mode="login" />
      <p className="text-center text-sm text-[var(--muted)]">
        <Link href="/register" className="underline">
          Register
        </Link>
      </p>
    </div>
  );
}
