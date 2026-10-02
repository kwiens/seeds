import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SupporterExport } from "@/components/dashboard/supporter-list";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("downloads supporter values as literal CSV fields", async () => {
  let capturedBlob: Blob | undefined;
  vi.stubGlobal(
    "URL",
    Object.assign(Object.create(URL), {
      createObjectURL: vi.fn((blob: Blob) => {
        capturedBlob = blob;
        return "blob:test";
      }),
      revokeObjectURL: vi.fn(),
    }),
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(
    <SupporterExport
      seedName="Garden"
      supporters={[
        {
          id: "user-1",
          name: '=HYPERLINK("https://example.com")',
          email: "+member@example.com",
          createdAt: new Date("2024-06-01T00:00:00Z"),
        },
      ]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
  expect(await capturedBlob!.text()).toBe(
    'Name,Email,Supported On\n"\'=HYPERLINK(""https://example.com"")",\'+member@example.com,2024-06-01T00:00:00.000Z',
  );
});
