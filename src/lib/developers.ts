import documents from "../content/developers/docs.json";

export const developerDocuments = documents;
export const developerRepository =
  "https://github.com/twinhao/cross-developers";
export const developerPreviewVersion = "0.3.1";
export const partnerEmail = "office@twinhao.com";
export const partnerContact = `mailto:${partnerEmail}?subject=${encodeURIComponent("Cross Design Partner 合作")}`;

const resourceLinks: Record<string, string> = {
  "../openapi/cross-sandbox.openapi.json": "/developers/openapi.json",
  "../fixtures/ecg.json": "/developers/ecg.json",
  "../fixtures/ecg-waveform.json": "/developers/ecg-waveform.json",
  "../fixtures/heart-rate.json": "/developers/heart-rate.json",
  "../fixtures/patient.json": "/developers/patient.json",
  "../fixtures/device.json": "/developers/device.json",
};

export function developerDocLink(href: string): string | undefined {
  if (resourceLinks[href]) return resourceLinks[href];
  const [path, anchor] = href.split("#");
  const slug = path.replace(/^(\.\/)?/, "").replace(/\.md$/, "");
  if (developerDocuments.some((document) => document.slug === slug)) {
    return `/developers/docs/${slug}${anchor ? `#${anchor}` : ""}`;
  }
  if (
    href.startsWith("#") ||
    href.startsWith("https://") ||
    href.startsWith("http://127.0.0.1:")
  )
    return href;
  return undefined;
}
