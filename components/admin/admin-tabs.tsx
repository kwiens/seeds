"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { type AdminTab, isAdminTab } from "@/lib/admin-tabs";

export function AdminTabs({
  activeTab,
  children,
}: {
  activeTab: AdminTab;
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function changeTab(value: string) {
    if (!isAdminTab(value) || value === activeTab) return;

    const params = new URLSearchParams(searchParams.toString());
    if (value === "seeds") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    if (value !== "users") {
      params.delete("page");
      params.delete("search");
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/admin?${query}` : "/admin", { scroll: false });
    });
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={changeTab}
      aria-busy={isPending || undefined}
    >
      {children}
    </Tabs>
  );
}
