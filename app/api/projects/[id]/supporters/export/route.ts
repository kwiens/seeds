import { auth } from "@/auth";
import {
  getSupporterExportProject,
  getSupporterExportChunk,
} from "@/lib/db/queries/projects";
import { getProjectAccess } from "@/lib/project-access";
import { toCsvRow } from "@/lib/csv";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const project = await getSupporterExportProject(id);
  if (!project) return new Response("Not found", { status: 404 });
  const { canManage } = await getProjectAccess(session, project);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const encoder = new TextEncoder();
  let afterId: string | undefined;
  let headerSent = false;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (request.signal.aborted) {
        controller.close();
        return;
      }
      try {
        const rows = await getSupporterExportChunk(id, afterId);
        const lines = rows.map((row) =>
          toCsvRow([row.name, row.email, row.createdAt.toISOString()]),
        );
        if (!headerSent) {
          lines.unshift("Name,Email,Supported On");
          headerSent = true;
        }
        controller.enqueue(encoder.encode(lines.join("\n") + "\n"));
        if (rows.length < 500) controller.close();
        else afterId = rows[rows.length - 1].participantId;
      } catch (error) {
        controller.error(error);
      }
    },
  });
  const filename = `${project.name.replace(/[^a-z0-9]/gi, "-")}-supporters.csv`;
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
