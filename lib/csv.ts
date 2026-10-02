/** Encode a spreadsheet-safe CSV field, preserving actual numbers as numbers. */
export function csvField(value: string | number): string {
  const raw = String(value);
  // Ignore leading whitespace/control characters when detecting formulas.
  // CSV quoting alone does not stop spreadsheet applications evaluating them.
  const text =
    typeof value === "string" && /^[\s\p{Cc}]*[=+\-@]/u.test(raw)
      ? `'${raw}`
      : raw;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsvRow(fields: (string | number)[]): string {
  return fields.map(csvField).join(",");
}
