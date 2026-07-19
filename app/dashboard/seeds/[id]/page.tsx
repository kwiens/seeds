import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SupporterExport } from "@/components/dashboard/supporter-list";
import { TeamUpdatesSection } from "@/components/seeds/team-updates-section";
import { getSeedById, getSeedSupporters } from "@/lib/db/queries/seeds";
import { getTeamUpdatesBySeed } from "@/lib/db/queries/team-updates";

export default async function DashboardSeedDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const seed = await getSeedById(params.id);
  if (!seed) notFound();

  if (!canEditSeed(session, seed)) {
    redirect("/dashboard");
  }

  const supporters = await getSeedSupporters(seed.id, { includeEmail: true });
  const isSprout = seed.status === "in_progress";
  const teamUpdates = isSprout ? await getTeamUpdatesBySeed(seed.id) : [];

  const supportersContent = (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          {!isSprout && <h1 className="text-2xl font-bold">{seed.name}</h1>}
          <p className="text-muted-foreground text-sm">
            {supporters.length}{" "}
            {supporters.length === 1 ? "supporter" : "supporters"}
          </p>
        </div>
        {supporters.length > 0 && (
          <SupporterExport supporters={supporters} seedName={seed.name} />
        )}
      </div>

      {supporters.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            No one has supported this seed yet. Share it to gather sunlight!
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Supported On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supporters.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/dashboard">
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back to My Seeds
        </Link>
      </Button>

      {isSprout && <h1 className="mb-6 text-2xl font-bold">{seed.name}</h1>}

      {isSprout ? (
        <Tabs defaultValue="team-updates">
          <TabsList variant="line">
            <TabsTrigger value="team-updates">
              Team Updates ({teamUpdates.length})
            </TabsTrigger>
            <TabsTrigger value="supporters">Supporters</TabsTrigger>
          </TabsList>
          <TabsContent value="team-updates">
            <div className="py-4">
              <TeamUpdatesSection seedId={seed.id} updates={teamUpdates} />
            </div>
          </TabsContent>
          <TabsContent value="supporters">
            <div className="py-4">{supportersContent}</div>
          </TabsContent>
        </Tabs>
      ) : (
        supportersContent
      )}
    </div>
  );
}
