import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSeedTable } from "@/components/admin/seed-data-table";
import { getAllSeeds } from "@/lib/db/queries/admin";

export const metadata: Metadata = {
  title: "Admin | Seeds",
};

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  const allSeeds = await getAllSeeds();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage community seed proposals
        </p>
      </div>

      <AdminSeedTable seeds={allSeeds} />
    </div>
  );
}
