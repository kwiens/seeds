import { Pagination } from "@/components/seeds/pagination";
import { SearchInput } from "@/components/seeds/search-input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

const joinedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
});
const peopleSearchParams = { tab: "users" };
const numberFormatter = new Intl.NumberFormat("en-US");

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
      >
        Admin
      </Badge>
    );
  }
  if (role === "council") {
    return (
      <Badge variant="secondary" className="text-xs">
        Council
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      Member
    </Badge>
  );
}

export function UserList({
  currentPage,
  pageSize,
  search,
  totalCount,
  totalPages,
  users,
}: {
  currentPage: number;
  pageSize: number;
  search?: string;
  totalCount: number;
  totalPages: number;
  users: AdminUser[];
}) {
  const firstResult = users.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = firstResult + users.length - 1;
  const resultSummary =
    totalCount === 0
      ? "0 people"
      : totalCount === 1
        ? "1 person"
        : `Showing ${numberFormatter.format(firstResult)}–${numberFormatter.format(lastResult)} of ${numberFormatter.format(totalCount)}`;

  return (
    <div>
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          ariaLabel="Search people by name or email"
          fixedParams={peopleSearchParams}
          placeholder="Search by name or email..."
        />
        <p
          className="text-muted-foreground text-sm whitespace-nowrap"
          aria-live="polite"
        >
          {resultSummary}
        </p>
      </div>

      {users.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {search ? "No people match your search." : "No accounts yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[40rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-sm font-medium whitespace-normal break-words">
                    {user.name}
                  </TableCell>
                  <TableCell className="text-sm whitespace-normal break-all">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {joinedDateFormatter.format(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        fixedParams={peopleSearchParams}
        totalPages={totalPages}
      />
    </div>
  );
}
