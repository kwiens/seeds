"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projectParticipants, projects } from "@/lib/db/schema";
import { formParticipantInputs } from "@/lib/project-participants";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/validations/project";

function projectFormToDbFields(values: ProjectFormValues) {
  return {
    name: values.name,
    summary: values.summary,
    locationAddress: values.locationAddress ?? null,
    locationDescription: values.locationDescription ?? null,
    locationLat: values.locationLat ?? null,
    locationLng: values.locationLng ?? null,
    category: values.category,
    waterHave: values.waterHave,
    waterNeed: values.waterNeed,
    budgetEstimate: values.budgetEstimate ?? null,
    obstacles: values.obstacles ?? null,
    photos: values.photos,
    coverPhotoUrl: values.coverPhotoUrl ?? null,
    badges: values.badges,
  };
}

export async function createProject(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to plant a seed." };
  }

  const parsed = projectFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const projectId = randomUUID();
  const creatorName = session.user.name?.trim() || "Project Gardener";
  const participantInputs = formParticipantInputs(parsed.data, {
    gardener: [creatorName],
  });
  const participantRows = [
    {
      projectId,
      userId: session.user.id,
      displayName: creatorName,
      role: "gardener" as const,
      state: "active" as const,
      addedBy: session.user.id,
    },
    ...participantInputs.map((participant) => ({
      projectId,
      ...participant,
      addedBy: session.user.id,
    })),
  ];

  await db.batch([
    db.insert(projects).values({
      id: projectId,
      ...projectFormToDbFields(parsed.data),
      stage: "seed",
      approvalState: "pending",
      createdBy: session.user.id,
    }),
    db.insert(projectParticipants).values(participantRows),
  ]);

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${projectId}`);
}

export async function updateProject(id: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    columns: { id: true },
    with: {
      participants: {
        columns: { userId: true, displayName: true, role: true },
      },
    },
  });
  if (!project) return { error: "Project not found." };
  if (!(await canManageProject(session, project))) {
    return { error: "You don't have permission to edit this project." };
  }

  const parsed = projectFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const registeredNames = Object.fromEntries(
    (["gardener", "roots", "guide"] as const).map((role) => [
      role,
      project.participants.flatMap((participant) =>
        participant.userId && participant.role === role
          ? [participant.displayName]
          : [],
      ),
    ]),
  );
  const participantInputs = formParticipantInputs(parsed.data, registeredNames);
  const statements = [
    db
      .update(projects)
      .set({
        ...projectFormToDbFields(parsed.data),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id)),
    db
      .delete(projectParticipants)
      .where(
        and(
          eq(projectParticipants.projectId, id),
          isNull(projectParticipants.userId),
          inArray(projectParticipants.role, ["gardener", "roots", "guide"]),
        ),
      ),
    ...(participantInputs.length
      ? [
          db.insert(projectParticipants).values(
            participantInputs.map((participant) => ({
              projectId: id,
              ...participant,
              addedBy: session.user.id,
            })),
          ),
        ]
      : []),
  ] as const;

  await db.batch(statements);

  revalidatePath(`/seeds/${id}`);
  revalidatePath(`/dashboard/projects/${id}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${id}/edit`);
}
