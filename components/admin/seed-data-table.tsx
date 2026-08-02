"use client";

import { useState } from "react";
import Link from "next/link";
import { Sun } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { SeedStatusBadge } from "@/components/dashboard/seed-status-badge";
import { SeedActions } from "@/components/admin/seed-actions";
import type { CategoryKey } from "@/lib/categories";

interface AdminSeed {
  id: string;
  name: string;
  category: CategoryKey;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
  archivedAt: Date | null;
  badges: string[];
  createdAt: Date;
  creatorName: string;
  creatorEmail: string;
  supportCount: number;
}

export function AdminSeedTable({
  seeds,
  supporterEmailsMap,
}: {
  seeds: AdminSeed[];
  supporterEmailsMap: Record<string, string[]>;
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filtered = seeds.filter((s) => {
    if (stageFilter === "archived" && !s.archivedAt) return false;
    if (
      stageFilter !== "all" &&
      stageFilter !== "archived" &&
      s.stage !== stageFilter
    )
      return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="seed">Seed</SelectItem>
            <SelectItem value="sprout">Sprout</SelectItem>
            <SelectItem value="tree">Tree</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Creator</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">
                <Sun className="inline size-4 text-amber-500" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No seeds found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((seed) => (
                <TableRow key={seed.id}>
                  <TableCell>
                    <Link
                      href={`/seeds/${seed.id}`}
                      className="block max-w-[400px] truncate font-medium hover:underline"
                      title={seed.name}
                    >
                      {seed.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <p className="text-sm">{seed.creatorName}</p>
                      <a
                        href={`mailto:${seed.creatorEmail}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {seed.creatorEmail.length > 25
                          ? `${seed.creatorEmail.slice(0, 25)}…`
                          : seed.creatorEmail}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <CategoryBadge category={seed.category} />
                  </TableCell>
                  <TableCell>
                    <SeedStatusBadge
                      stage={seed.stage}
                      approvalState={seed.approvalState}
                      archivedAt={seed.archivedAt}
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {seed.supportCount > 0 ? (
                      <Link
                        href={`/dashboard/projects/${seed.id}/supporters`}
                        className="hover:underline"
                      >
                        {seed.supportCount}
                      </Link>
                    ) : (
                      seed.supportCount
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {new Date(seed.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell>
                    <SeedActions
                      projectId={seed.id}
                      stage={seed.stage}
                      approvalState={seed.approvalState}
                      archived={!!seed.archivedAt}
                      badges={seed.badges}
                      creatorEmail={seed.creatorEmail}
                      supporterEmails={supporterEmailsMap[seed.id]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
