// Matches the image content types accepted for Team attachment uploads
// (see IMAGE_TYPES in app/api/upload/route.ts). No mimetype is persisted on
// an attachment row, so both the upload accept-list and this check key off
// the filename extension instead.
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

export function isImageAttachment(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
