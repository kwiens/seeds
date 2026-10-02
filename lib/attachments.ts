// The image content types accepted for uploads (IMAGE_TYPES in
// app/api/upload/route.ts) and therefore safe to preview inline. SVG is
// deliberately absent: it can carry script and must never render inline.
export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

export function isImageContentType(contentType: string): boolean {
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  return IMAGE_CONTENT_TYPES.includes(mediaType);
}

// No mimetype is persisted on an attachment row, so the UI can only guess from
// the (client-supplied) filename. That guess only picks how the attachment is
// rendered; the file route decides inline vs. download from the blob's stored
// content type.
export function isImageAttachment(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
