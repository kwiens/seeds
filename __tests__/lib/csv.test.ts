import { describe, expect, it } from "vitest";
import { csvField, toCsvRow } from "@/lib/csv";

describe("spreadsheet-safe CSV", () => {
  it.each([
    "=1+1",
    "+1+1",
    "-1+1",
    "@SUM(A1)",
    " \t=1+1",
    "\u0000\u001b=1+1",
  ])("neutralizes formula text %j", (input) => {
    expect(csvField(input)).toBe(`'${input}`);
  });

  it("quotes record separators and doubles quotes without changing text", () => {
    expect(toCsvRow(["safe\r=1+1", "a\nb", 'a,"b"'])).toBe(
      '"safe\r=1+1","a\nb","a,""b"""',
    );
  });

  it("keeps numbers numeric while protecting negative text", () => {
    expect(toCsvRow([-10, 0, 1.5, "-10", "ordinary", ""])).toBe(
      "-10,0,1.5,'-10,ordinary,",
    );
  });
});
