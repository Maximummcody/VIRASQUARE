import JSZip from "jszip";
import { storageGetSignedUrl, storagePut } from "./storage";

type ExportSlide = {
  slideNumber: number;
  assetKey: string | null;
};

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "virasquare-visuals";
}

export async function createVisualArchive({ title, slides, userId }: { title: string; slides: ExportSlide[]; userId: number }) {
  const readySlides = slides.filter((slide): slide is ExportSlide & { assetKey: string } => Boolean(slide.assetKey));
  if (!readySlides.length) throw new Error("There are no finished visual slides to export yet.");

  const archive = new JSZip();
  for (const slide of readySlides) {
    const signedUrl = await storageGetSignedUrl(slide.assetKey);
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error(`Slide ${slide.slideNumber} could not be read for export.`);
    const buffer = Buffer.from(await response.arrayBuffer());
    archive.file(`${safeName(title)}-slide-${slide.slideNumber}.png`, buffer);
  }

  const zip = await archive.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
  const { key, url } = await storagePut(`exports/${userId}/${safeName(title)}-${Date.now()}.zip`, zip, "application/zip");
  return { key, url, slideCount: readySlides.length };
}
