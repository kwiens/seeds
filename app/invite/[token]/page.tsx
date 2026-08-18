import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AcceptInviteButton } from "@/components/auth/accept-invite-button";
import { SignInButton } from "@/components/auth/sign-in-button";
import { getInviteByToken } from "@/lib/db/queries/invites";
import { namesLikelyMatch } from "@/lib/invite-match";

export const metadata: Metadata = {
  title: "You're invited | Seeds",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <StatusCard title="This invite link isn't valid">
        Double-check the link, or ask whoever invited you to send a new one.
      </StatusCard>
    );
  }
  if (invite.canceledAt) {
    return (
      <StatusCard title="This invite has been canceled">
        Ask whoever invited you to send a new link if you still want to join.
      </StatusCard>
    );
  }
  if (invite.acceptedAt) {
    return (
      <StatusCard title="This invite has already been used">
        If you think this is a mistake, ask whoever invited you to send a new
        link.
      </StatusCard>
    );
  }

  const accountName = session?.user?.name ?? null;
  const isMatch = accountName
    ? namesLikelyMatch(invite.invitedName, accountName)
    : true;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          You&apos;re invited
        </p>
        <h1 className="mb-1 text-xl font-bold">Join {invite.project.name}</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          as{" "}
          <span className="text-foreground font-medium">
            {invite.roleLabel}
          </span>
        </p>
        <p className="mb-6 text-sm">
          This invite was sent to{" "}
          <span className="font-medium">{invite.invitedName}</span>.
        </p>

        {!session?.user?.id ? (
          <div className="space-y-3">
            <SignInButton />
            <p className="text-muted-foreground text-xs">
              You&apos;ll come right back here after signing in.
            </p>
          </div>
        ) : isMatch ? (
          <div className="space-y-3">
            <div className="bg-muted flex items-center justify-center gap-2 rounded-md py-2 text-sm">
              <CheckCircle2 className="text-primary size-4" />
              Signed in as {session.user.email}
            </div>
            <AcceptInviteButton
              token={invite.token}
              roleLabel={invite.roleLabel}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                This invite was made out to{" "}
                <strong>{invite.invitedName}</strong>, but you&apos;re signed in
                as <strong>{session.user.email}</strong>. Make sure this is the
                right account before continuing.
              </p>
            </div>
            <AcceptInviteButton
              token={invite.token}
              roleLabel={`${invite.roleLabel} anyway`}
              variant="outline"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-lg border p-6 text-center">
        <h1 className="mb-1 text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{children}</p>
      </div>
    </div>
  );
}
