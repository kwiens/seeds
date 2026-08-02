import { redirect } from "next/navigation";
import { projectWorkspacePath } from "@/lib/project-workspace-navigation";

export default async function LegacyEditUpdatePage(props: {
  params: Promise<{ id: string; updateId: string }>;
}) {
  const { id, updateId } = await props.params;
  redirect(`${projectWorkspacePath(id, "updates")}/${updateId}/edit`);
}
