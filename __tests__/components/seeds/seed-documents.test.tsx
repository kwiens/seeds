import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SeedDocuments } from "@/components/seeds/seed-documents";
import type { ProjectDocument } from "@/lib/db/queries/documents";

function makeDocument(
  overrides: Partial<ProjectDocument> = {},
): ProjectDocument {
  return {
    name: "Site plan.pdf",
    url: "https://blob.example.com/site-plan.pdf",
    size: 2048,
    updateId: "update-1",
    attachmentIndex: 0,
    posterName: "Ada Lovelace",
    createdAt: new Date(),
    ...overrides,
  };
}

function expandFiles() {
  fireEvent.click(screen.getByRole("button", { name: /files/i }));
}

describe("SeedDocuments", () => {
  it("summarizes an empty file list on the trigger", () => {
    render(<SeedDocuments seedId="seed-1" documents={[]} />);

    expect(screen.getByRole("button", { name: /files/i })).toHaveTextContent(
      "None yet",
    );
  });

  it("shows the empty state once expanded", () => {
    render(<SeedDocuments seedId="seed-1" documents={[]} />);

    expandFiles();

    expect(
      screen.getByText(
        "Files shared in Team Updates show up here automatically.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses the singular file count for one document", () => {
    render(<SeedDocuments seedId="seed-1" documents={[makeDocument()]} />);

    expect(screen.getByRole("button", { name: /files/i })).toHaveTextContent(
      "1 file",
    );
  });

  it("uses the plural file count for multiple documents", () => {
    render(
      <SeedDocuments
        seedId="seed-1"
        documents={[
          makeDocument(),
          makeDocument({ attachmentIndex: 1, name: "Budget.xlsx" }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /files/i })).toHaveTextContent(
      "2 files",
    );
  });

  it("renders one link per document pointing at its team update anchor", () => {
    render(
      <SeedDocuments
        seedId="seed-42"
        documents={[
          makeDocument({ name: "Site plan.pdf", updateId: "update-a" }),
          makeDocument({
            name: "Budget.xlsx",
            updateId: "update-b",
            attachmentIndex: 2,
          }),
        ]}
      />,
    );

    expandFiles();

    expect(
      screen.getByRole("link", { name: /site plan\.pdf/i }),
    ).toHaveAttribute(
      "href",
      "/dashboard/projects/seed-42/team#update-update-a",
    );
    expect(screen.getByRole("link", { name: /budget\.xlsx/i })).toHaveAttribute(
      "href",
      "/dashboard/projects/seed-42/team#update-update-b",
    );
  });

  it("shows the poster, relative time and formatted size for each document", () => {
    render(
      <SeedDocuments
        seedId="seed-1"
        documents={[
          makeDocument({
            posterName: "Grace Hopper",
            size: 2048,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          }),
        ]}
      />,
    );

    expandFiles();

    expect(
      screen.getByRole("link", { name: /grace hopper · 2h ago · 2 KB/i }),
    ).toBeInTheDocument();
  });

  it("formats sizes in bytes, kilobytes and megabytes", () => {
    render(
      <SeedDocuments
        seedId="seed-1"
        documents={[
          makeDocument({ name: "tiny.txt", size: 512, updateId: "u1" }),
          makeDocument({ name: "small.pdf", size: 1536, updateId: "u2" }),
          makeDocument({
            name: "big.zip",
            size: 3 * 1024 * 1024 + 512 * 1024,
            updateId: "u3",
          }),
        ]}
      />,
    );

    expandFiles();

    expect(
      screen.getByRole("link", { name: /tiny\.txt[\s\S]*512 B/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /small\.pdf[\s\S]*2 KB/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /big\.zip[\s\S]*3\.5 MB/i }),
    ).toBeInTheDocument();
  });

  it("keeps documents from the same update distinct by attachment index", () => {
    render(
      <SeedDocuments
        seedId="seed-1"
        documents={[
          makeDocument({ name: "first.pdf", attachmentIndex: 0 }),
          makeDocument({ name: "second.pdf", attachmentIndex: 1 }),
        ]}
      />,
    );

    expandFiles();

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
