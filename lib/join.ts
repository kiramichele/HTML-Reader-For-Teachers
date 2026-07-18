import { headers } from "next/headers";
import QRCode from "qrcode";

// Absolute origin of the current request (works on Vercel and locally).
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type JoinInfo = {
  code: string; // display form (uppercase)
  joinUrl: string; // where students type the code
  directUrl: string; // where the QR points (opens the activity directly)
  qrSvg: string; // inline <svg> markup
};

export async function buildJoinInfo(
  slug: string,
  origin: string,
  qrWidth = 220
): Promise<JoinInfo> {
  const directUrl = `${origin}/p/${slug}`;
  const qrSvg = await QRCode.toString(directUrl, {
    type: "svg",
    margin: 1,
    width: qrWidth,
    color: { dark: "#2b2723", light: "#ffffff" },
  });
  return {
    code: slug.toUpperCase(),
    joinUrl: `${origin}/join`,
    directUrl,
    qrSvg,
  };
}
