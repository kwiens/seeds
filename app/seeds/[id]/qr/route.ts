import { generateQrSvg } from "@/lib/qr";
import { getRequestOrigin } from "@/lib/site-url";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = await getRequestOrigin();
  const url = `${origin}/seeds/${id}`;
  const svg = generateQrSvg(url);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
