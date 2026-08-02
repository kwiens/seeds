import { redirect } from "next/navigation";
import { projectWorkspacePath } from "@/lib/project-workspace-navigation";

export default async function LegacyEditSeedPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(projectWorkspacePath(id, "edit"));
}
