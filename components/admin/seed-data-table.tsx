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
  status: string;
  createdAt: Date;
  creatorName: string;
  creatorEmail: string;
  supportCount: number;
}

export function AdminSeedTable({ seeds }: { seeds: AdminSeed[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = seeds.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
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
                      className="font-medium hover:underline"
                    >
                      {seed.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <p className="text-sm">{seed.creatorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {seed.creatorEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <CategoryBadge category={seed.category} />
                  </TableCell>
                  <TableCell>
                    <SeedStatusBadge status={seed.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {seed.supportCount}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {new Date(seed.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <SeedActions
                      seedId={seed.id}
                      status={seed.status}
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
