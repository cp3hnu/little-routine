"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleHelpIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/locale-provider";

export function UserMenu({ nickname, phone }: { nickname: string; phone: string }) {
  const { t } = useI18n();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-(--border) bg-(--accent-soft) text-(--accent)"
          aria-label={t.accountMenu}
        >
          <UserRoundIcon className="size-5" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2.5 text-left">
          <span className="truncate text-sm font-semibold text-(--ink)">{nickname || t.nickname}</span>
          <span className="truncate text-xs font-normal text-(--muted)">{phone}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/help" className="cursor-pointer">
            <CircleHelpIcon />
            {t.help}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault();
            void logout();
          }}
        >
          <LogOutIcon />
          {t.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
