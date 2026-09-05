import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { TeamUpdatesSection } from "@/components/seeds/team-updates-section";
import {
  createTeamProjectUpdate,
  deleteProjectUpdate,
  replyToTeamProjectUpdate,
} from "@/lib/actions/project-updates";

vi.mock("@/lib/actions/project-updates", () => ({
  createTeamProjectUpdate: vi.fn().mockResolvedValue({}),
  replyToTeamProjectUpdate: vi.fn().mockResolvedValue({}),
  deleteProjectUpdate: vi.fn().mockResolvedValue({}),
}));

// The real AttachmentPicker uploads via @vercel/blob/client; replace it with a
// stand-in that exposes an "Add attachment" button so tests can inject files.
vi.mock("@/components/seeds/attachment-picker", () => ({
  AttachmentPicker: ({
    attachments,
    onChange,
  }: {
    attachments: { name: string; url: string; size: number }[];
    onChange: (
      attachments: { name: string; url: string; size: number }[],
    ) => void;
  }) => (
    <div>
      {attachments.map((a) => (
        <span key={a.url}>{a.name}</span>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...attachments,
            {
              name: "mock.pdf",
              url: "https://blob.example/mock.pdf",
              size: 1234,
            },
          ])
        }
      >
        Add attachment
      </button>
    </div>
  ),
}));

const HOUR = 60 * 60 * 1000;
const MAX_LABEL = (2000).toLocaleString();

const reply = {
  id: "reply-1",
  title: null,
  body: "Agreed, soil looks good.",
  parentId: "update-1",
  attachments: [],
  createdAt: new Date(Date.now() - 1 * HOUR),
  userId: "user-2",
  userName: "Sam Lee",
  userImage: null,
};

const topUpdate = {
  id: "update-1",
  title: "Site visit complete",
  body: "We walked the site and it looks great.",
  parentId: null,
  attachments: [
    { name: "survey.pdf", url: "https://blob.example/survey.pdf", size: 2048 },
  ],
  createdAt: new Date(Date.now() - 2 * HOUR),
  userId: "user-1",
  userName: "Jordan Rivera",
  userImage: null,
  replies: [reply],
};

function renderSection({
  updates = [topUpdate],
  isAdmin = false,
  rolesByUserId = { "user-1": "Gardener" },
} = {}) {
  return render(
    <TeamUpdatesSection
      seedId="seed-1"
      updates={updates}
      isAdmin={isAdmin}
      rolesByUserId={rolesByUserId}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeamUpdatesSection rendering", () => {
  it("renders updates with author, role badge, timestamp, title, and body", () => {
    renderSection();

    expect(screen.getByText("Jordan R.")).toBeInTheDocument();
    expect(screen.getByText("Gardener")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
    expect(screen.getByText("Site visit complete")).toBeInTheDocument();
    expect(
      screen.getByText("We walked the site and it looks great."),
    ).toBeInTheDocument();
    // Nested reply
    expect(screen.getByText("Sam L.")).toBeInTheDocument();
    expect(screen.getByText("Agreed, soil looks good.")).toBeInTheDocument();
  });

  it("links attachments to the team-files endpoint", () => {
    renderSection();

    const link = screen.getByRole("link", { name: /survey\.pdf/ });
    expect(link).toHaveAttribute("href", "/api/team-files/update-1/0");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows an image attachment as a preview button instead of a download link", () => {
    renderSection({
      updates: [
        {
          ...topUpdate,
          attachments: [
            {
              name: "site-photo.png",
              url: "https://blob.example/site-photo.png",
              size: 1024,
            },
          ],
        },
      ],
    });

    expect(
      screen.queryByRole("link", { name: /site-photo\.png/ }),
    ).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "View site-photo.png" });
    // The thumbnail <img> is decorative (alt="") since the button already
    // carries the accessible name, so query the DOM directly rather than by role.
    expect(trigger.querySelector("img")).toHaveAttribute(
      "src",
      "/api/team-files/update-1/0",
    );
  });

  it("shows the empty state when there are no updates", () => {
    renderSection({ updates: [] });

    expect(
      screen.getByText(
        "No updates yet — post the first one to get the conversation going.",
      ),
    ).toBeInTheDocument();
  });

  it("hides delete buttons for non-admins and only offers Reply on top-level updates", () => {
    renderSection();

    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    // One top-level update card gets a Reply button; the nested reply does not.
    expect(screen.getAllByRole("button", { name: "Reply" })).toHaveLength(1);
  });

  it("shows delete buttons for admins on both updates and replies", () => {
    renderSection({ isAdmin: true });

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });
});

describe("posting a new update", () => {
  it("posts with trimmed title and clears the form on success", async () => {
    renderSection();

    const title = screen.getByRole("textbox", { name: "Title (optional)" });
    const body = screen.getByRole("textbox", { name: "Update details" });
    fireEvent.change(title, { target: { value: "  Site visit  " } });
    fireEvent.change(body, { target: { value: "Hello team" } });
    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    await waitFor(() => expect(createTeamProjectUpdate).toHaveBeenCalledOnce());
    expect(createTeamProjectUpdate).toHaveBeenCalledWith("seed-1", {
      title: "Site visit",
      body: "Hello team",
      attachments: [],
    });
    await waitFor(() => expect(body).toHaveValue(""));
    expect(title).toHaveValue("");
  });

  it("omits the title when it is blank", async () => {
    renderSection();

    fireEvent.change(screen.getByRole("textbox", { name: "Update details" }), {
      target: { value: "No title here" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    await waitFor(() => expect(createTeamProjectUpdate).toHaveBeenCalledOnce());
    expect(createTeamProjectUpdate).toHaveBeenCalledWith("seed-1", {
      title: undefined,
      body: "No title here",
      attachments: [],
    });
  });

  it("disables Post Update until the body has non-whitespace content", () => {
    renderSection();

    const postButton = screen.getByRole("button", { name: "Post Update" });
    const body = screen.getByRole("textbox", { name: "Update details" });

    expect(postButton).toBeDisabled();
    fireEvent.change(body, { target: { value: "   " } });
    expect(postButton).toBeDisabled();
    fireEvent.change(body, { target: { value: "Real content" } });
    expect(postButton).toBeEnabled();
  });

  it("counts down remaining characters as the body grows", () => {
    renderSection({ updates: [] });

    expect(screen.getByText(`${MAX_LABEL}/${MAX_LABEL}`)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Update details" }), {
      target: { value: "12345" },
    });
    expect(
      screen.getByText(`${(1995).toLocaleString()}/${MAX_LABEL}`),
    ).toBeInTheDocument();
  });

  it("shows the action error and keeps the draft", async () => {
    vi.mocked(createTeamProjectUpdate).mockResolvedValueOnce({
      error: "You do not have permission to post team updates.",
    });
    renderSection();

    const body = screen.getByRole("textbox", { name: "Update details" });
    fireEvent.change(body, { target: { value: "Draft text" } });
    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    expect(
      await screen.findByText(
        "You do not have permission to post team updates.",
      ),
    ).toHaveAttribute("role", "alert");
    expect(body).toHaveValue("Draft text");
  });

  it("sends picked attachments with the post", async () => {
    renderSection({ updates: [] });

    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Update details" }), {
      target: { value: "With a file" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post Update" }));

    await waitFor(() => expect(createTeamProjectUpdate).toHaveBeenCalledOnce());
    expect(createTeamProjectUpdate).toHaveBeenCalledWith("seed-1", {
      title: undefined,
      body: "With a file",
      attachments: [
        { name: "mock.pdf", url: "https://blob.example/mock.pdf", size: 1234 },
      ],
    });
  });
});

describe("replying", () => {
  it("opens the reply form, posts the reply, and closes the form", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    const replyBox = screen.getByRole("textbox", { name: "Reply" });
    fireEvent.change(replyBox, { target: { value: "On my way" } });

    // Two "Reply" buttons now: the card toggle (first) and the form submit (last).
    const replyButtons = screen.getAllByRole("button", { name: "Reply" });
    fireEvent.click(replyButtons[replyButtons.length - 1]);

    await waitFor(() =>
      expect(replyToTeamProjectUpdate).toHaveBeenCalledOnce(),
    );
    expect(replyToTeamProjectUpdate).toHaveBeenCalledWith("update-1", {
      body: "On my way",
      attachments: [],
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "Reply" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("toggles the reply form closed on a second click", () => {
    renderSection();

    const toggle = screen.getByRole("button", { name: "Reply" });
    fireEvent.click(toggle);
    expect(screen.getByRole("textbox", { name: "Reply" })).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(
      screen.queryByRole("textbox", { name: "Reply" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the reply form open and shows the error when the reply fails", async () => {
    vi.mocked(replyToTeamProjectUpdate).mockResolvedValueOnce({
      error: "Replies to replies are not supported.",
    });
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    const replyBox = screen.getByRole("textbox", { name: "Reply" });
    fireEvent.change(replyBox, { target: { value: "Oops" } });
    const replyButtons = screen.getAllByRole("button", { name: "Reply" });
    fireEvent.click(replyButtons[replyButtons.length - 1]);

    expect(
      await screen.findByText("Replies to replies are not supported."),
    ).toHaveAttribute("role", "alert");
    expect(screen.getByRole("textbox", { name: "Reply" })).toHaveValue("Oops");
  });
});

describe("deleting", () => {
  it("confirms in a dialog and calls the delete action for a top-level update", async () => {
    renderSection({ isAdmin: true });

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Delete this update?" });
    expect(dialog).toHaveTextContent("and any replies to it");

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteProjectUpdate).toHaveBeenCalledOnce());
    expect(deleteProjectUpdate).toHaveBeenCalledWith("update-1");
  });

  it("does not warn about replies when deleting a reply", () => {
    renderSection({ isAdmin: true });

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]);
    const dialog = screen.getByRole("dialog", { name: "Delete this update?" });
    expect(dialog).not.toHaveTextContent("and any replies to it");
  });

  it("surfaces delete errors inside the dialog", async () => {
    vi.mocked(deleteProjectUpdate).mockResolvedValueOnce({
      error: "Only admins can delete Team Updates.",
    });
    renderSection({ isAdmin: true });

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Delete this update?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await within(dialog).findByText("Only admins can delete Team Updates."),
    ).toHaveAttribute("role", "alert");
  });

  it("closes the dialog with Cancel without calling the action", () => {
    renderSection({ isAdmin: true });

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Delete this update?" }),
    ).not.toBeInTheDocument();
    expect(deleteProjectUpdate).not.toHaveBeenCalled();
  });
});
