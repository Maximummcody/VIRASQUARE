export function attachmentDownloadUrl(url: string, filename: string, currentOrigin = window.location.origin) {
  const downloadUrl = new URL(url, currentOrigin);
  downloadUrl.searchParams.set("download", "1");
  downloadUrl.searchParams.set("filename", filename);
  return downloadUrl.toString();
}

export function requestAttachmentDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = attachmentDownloadUrl(url, filename);
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
