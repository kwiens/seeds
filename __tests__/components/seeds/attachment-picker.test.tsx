import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { upload } from "@vercel/blob/client";
import {
  AttachmentPicker,
  type Attachment,
} from "@/components/seeds/attachment-picker";
import { discardTeamAttachment } from "@/lib/actions/project-updates";
import { TEAM_ATTACHMENT_MAX_SIZE } from "@/lib/constants";

vi.mock("@vercel/blob/client", () => ({
  upload: vi.fn(),
}));

vi.mock("@/lib/actions/project-updates", () => ({
  discardTeamAttachment: vi.fn().mockResolvedValue({}),
}));

const uploadMock = vi.mocked(upload);
const discardMock = vi.mocked(discardTeamAttachment);

function makeFile(name: string, size: number, type = "application/pdf") {
  const file = new File(["stub"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function attachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    name: "Site plan.pdf",
    url: "https://blob.example.com/site-plan.pdf",
    size: 2048,
    ...overrides,
  };
}

function renderPicker(
  props: Partial<React.ComponentProps<typeof AttachmentPicker>> = {},
) {
  const onChange = vi.fn();
  const onBusyChange = vi.fn();
  const view = render(
    <AttachmentPicker
      attachments={[]}
      onChange={onChange}
      onBusyChange={onBusyChange}
      projectId="project-1"
      {...props}
    />,
  );
  const input =
    view.container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not rendered");
  return { ...view, onChange, onBusyChange, input };
}

beforeEach(() => {
  vi.clearAllMocks();
  uploadMock.mockResolvedValue({
    url: "https://blob.example.com/uploaded.pdf",
  } as Awaited<ReturnType<typeof upload>>);
  discardMock.mockResolvedValue({ success: true });
});

describe("AttachmentPicker", () => {
  it("renders the attach button and no chips when empty", () => {
    renderPicker();

    expect(screen.getByRole("button", { name: /attach file/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /^remove/i })).toBeNull();
  });

  it("renders a chip with name and formatted size for each attachment", () => {
    renderPicker({
      attachments: [
        attachment({ name: "Site plan.pdf", size: 2048 }),
        attachment({
          name: "Budget.xlsx",
          size: 1_572_864,
          url: "https://blob.example.com/budget.xlsx",
        }),
      ],
    });

    expect(screen.getByText("Site plan.pdf")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.getByText("Budget.xlsx")).toBeInTheDocument();
    expect(screen.getByText("1.5 MB")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Site plan.pdf" }),
    ).toBeInTheDocument();
  });

  it("uploads a selected file and reports it through onChange", async () => {
    const { input, onChange } = renderPicker();

    fireEvent.change(input, {
      target: { files: [makeFile("Notes.pdf", 1024)] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    expect(uploadMock).toHaveBeenCalledOnce();
    const [path, file, options] = uploadMock.mock.calls[0];
    expect(path).toBe("projects/project-1/attachments/Notes.pdf");
    expect((file as File).name).toBe("Notes.pdf");
    expect(options).toMatchObject({
      access: "private",
      handleUploadUrl: "/api/upload",
      clientPayload: JSON.stringify({ projectId: "project-1" }),
    });
    expect(onChange).toHaveBeenCalledWith([
      {
        name: "Notes.pdf",
        url: "https://blob.example.com/uploaded.pdf",
        size: 1024,
      },
    ]);
  });

  it("appends uploads to the existing attachments", async () => {
    const existing = attachment();
    const { input, onChange } = renderPicker({ attachments: [existing] });

    fireEvent.change(input, {
      target: { files: [makeFile("Notes.pdf", 1024)] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    expect(onChange).toHaveBeenCalledWith([
      existing,
      {
        name: "Notes.pdf",
        url: "https://blob.example.com/uploaded.pdf",
        size: 1024,
      },
    ]);
  });

  it("percent-encodes the file name in the blob path", async () => {
    const { input } = renderPicker();

    fireEvent.change(input, {
      target: { files: [makeFile("site plan v2.pdf", 1024)] },
    });

    await waitFor(() => expect(uploadMock).toHaveBeenCalledOnce());
    expect(uploadMock.mock.calls[0][0]).toBe(
      "projects/project-1/attachments/site%20plan%20v2.pdf",
    );
  });

  it("toggles busy around an upload", async () => {
    const { input, onBusyChange } = renderPicker();

    fireEvent.change(input, {
      target: { files: [makeFile("Notes.pdf", 1024)] },
    });

    await waitFor(() => expect(onBusyChange).toHaveBeenCalledTimes(2));
    expect(onBusyChange.mock.calls.map(([busy]) => busy)).toEqual([
      true,
      false,
    ]);
  });

  it("shows the uploading state while the upload is in flight", async () => {
    let resolveUpload: (value: { url: string }) => void = () => {};
    uploadMock.mockReturnValue(
      new Promise<{ url: string }>((resolve) => {
        resolveUpload = resolve;
      }) as ReturnType<typeof upload>,
    );
    const { input } = renderPicker();

    fireEvent.change(input, {
      target: { files: [makeFile("Notes.pdf", 1024)] },
    });

    await screen.findByRole("button", { name: /uploading/i });
    expect(screen.getByRole("button", { name: /uploading/i })).toBeDisabled();

    resolveUpload({ url: "https://blob.example.com/uploaded.pdf" });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /attach file/i }),
      ).toBeEnabled(),
    );
  });

  it("ignores a change event with no files", () => {
    const { input, onChange } = renderPicker();

    fireEvent.change(input, { target: { files: [] } });

    expect(uploadMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit without uploading", async () => {
    const { input, onChange } = renderPicker();

    fireEvent.change(input, {
      target: {
        files: [makeFile("huge.pdf", TEAM_ATTACHMENT_MAX_SIZE + 1)],
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "huge.pdf exceeds the 20 MB limit.",
    );
    expect(uploadMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects the whole batch when any file is over the limit", async () => {
    const { input } = renderPicker();

    fireEvent.change(input, {
      target: {
        files: [
          makeFile("ok.pdf", 1024),
          makeFile("huge.pdf", TEAM_ATTACHMENT_MAX_SIZE + 1),
        ],
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "huge.pdf exceeds the 20 MB limit.",
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("only uploads up to the remaining slots", async () => {
    const existing = [
      attachment({ name: "a.pdf", url: "https://blob.example.com/a.pdf" }),
      attachment({ name: "b.pdf", url: "https://blob.example.com/b.pdf" }),
      attachment({ name: "c.pdf", url: "https://blob.example.com/c.pdf" }),
      attachment({ name: "d.pdf", url: "https://blob.example.com/d.pdf" }),
    ];
    const { input } = renderPicker({ attachments: existing });

    fireEvent.change(input, {
      target: {
        files: [makeFile("e.pdf", 1024), makeFile("f.pdf", 1024)],
      },
    });

    await waitFor(() => expect(uploadMock).toHaveBeenCalledOnce());
    expect(uploadMock.mock.calls[0][0]).toContain("e.pdf");
  });

  it("blocks selection once the maximum number of files is reached", async () => {
    const existing = ["a", "b", "c", "d", "e"].map((name) =>
      attachment({
        name: `${name}.pdf`,
        url: `https://blob.example.com/${name}.pdf`,
      }),
    );
    const { input } = renderPicker({ attachments: existing });

    expect(screen.getByRole("button", { name: /attach file/i })).toBeDisabled();

    fireEvent.change(input, {
      target: { files: [makeFile("f.pdf", 1024)] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Maximum 5 files allowed.",
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("surfaces an upload failure", async () => {
    uploadMock.mockRejectedValue(new Error("Blob store unavailable"));
    const { input, onChange, onBusyChange } = renderPicker();

    fireEvent.change(input, {
      target: { files: [makeFile("Notes.pdf", 1024)] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Blob store unavailable",
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(onBusyChange.mock.calls.map(([busy]) => busy)).toEqual([
      true,
      false,
    ]);
  });

  it("falls back to a generic message for a non-Error upload rejection", async () => {
    uploadMock.mockRejectedValue("boom");
    const { input } = renderPicker();

    fireEvent.change(input, {
      target: { files: [makeFile("Notes.pdf", 1024)] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Upload failed.",
    );
  });

  it("removes an attachment through the discard action", async () => {
    const first = attachment({
      name: "a.pdf",
      url: "https://blob.example.com/a.pdf",
    });
    const second = attachment({
      name: "b.pdf",
      url: "https://blob.example.com/b.pdf",
    });
    const { onChange, onBusyChange } = renderPicker({
      attachments: [first, second],
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove a.pdf" }));

    await waitFor(() => expect(discardMock).toHaveBeenCalledOnce());
    expect(discardMock).toHaveBeenCalledWith("project-1", first);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([second]));
    expect(onBusyChange.mock.calls.map(([busy]) => busy)).toEqual([
      true,
      false,
    ]);
  });

  it("surfaces a discard action error and keeps the attachment", async () => {
    discardMock.mockResolvedValue({ error: "You do not have access." });
    const { onChange } = renderPicker({ attachments: [attachment()] });

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Site plan.pdf" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have access.",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("surfaces a thrown discard error", async () => {
    discardMock.mockRejectedValue(new Error("Network down"));
    const { onChange } = renderPicker({ attachments: [attachment()] });

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Site plan.pdf" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the attach and remove controls when disabled", () => {
    renderPicker({ attachments: [attachment()], disabled: true });

    expect(screen.getByRole("button", { name: /attach file/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove Site plan.pdf" }),
    ).toBeDisabled();
  });

  it("works without an onBusyChange callback", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <AttachmentPicker
        attachments={[]}
        onChange={onChange}
        projectId="project-1"
      />,
    );
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');

    fireEvent.change(input!, {
      target: { files: [makeFile("Notes.pdf", 1024)] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledOnce());
  });
});
