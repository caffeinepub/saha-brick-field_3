// Shared PDF download utility using html2pdf.js
// Works on mobile Chrome, desktop, and all modern browsers
// Uses .save() method for direct download — no print dialog

export interface PdfOptions {
  filename: string;
  /** Width of the off-screen container in px. Default 800 */
  containerWidth?: number;
}

/**
 * Download an HTML string as a PDF file on all browsers including mobile Chrome.
 * Uses html2pdf.js which internally uses html2canvas + jsPDF but handles
 * the mobile download edge-case via Blob URL.
 */
export async function downloadHtmlAsPdf(
  htmlContent: string,
  opts: PdfOptions,
): Promise<void> {
  const { filename, containerWidth = 800 } = opts;

  // Create an off-screen container so html2canvas can render it
  const container = document.createElement("div");
  container.id = "report";
  container.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    `width:${containerWidth}px`,
    "background:white",
    "padding:20px",
    "font-family:'Noto Sans',Arial,sans-serif",
    "font-size:13px",
    "color:#000",
  ].join(";");
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    // biome-ignore lint/suspicious/noExplicitAny: third-party CJS module
    const html2pdf = (await import("html2pdf.js")).default as any;

    await html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      })
      .from(container)
      .save();
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
