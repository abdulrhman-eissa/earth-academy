/**
 * تصدير HTML إلى PDF
 */

export interface PdfExportOptions {
  filename: string;
  orientation?: "portrait" | "landscape";
  margin?: number;
}

export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = (html2pdfModule as { default?: unknown }).default ?? html2pdfModule;

  const opt = {
    margin: options.margin ?? 8,
    filename: options.filename.endsWith(".pdf") ? options.filename : `${options.filename}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: options.orientation ?? "portrait",
    },
    pagebreak: { mode: ["css", "legacy"] as const },
  };

  // @ts-expect-error - html2pdf types are loose
  await html2pdf().set(opt).from(element).save();
}

/**
 * إنشاء حاوية للطباعة — ظاهرة بشكل مؤقت في DOM
 * ضروري عشان html2canvas يقدر يرندرها
 */
export function createPrintContainer(html: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.id = "__earth_pdf_wrapper__";
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.width = "100vw";
  wrapper.style.height = "100vh";
  wrapper.style.overflow = "auto";
  wrapper.style.background = "#ffffff";
  wrapper.style.zIndex = "999999";
  wrapper.style.padding = "20px";

  const container = document.createElement("div");
  container.style.width = "210mm";
  container.style.minHeight = "297mm";
  container.style.background = "#ffffff";
  container.style.padding = "15mm";
  container.style.margin = "0 auto";
  container.style.fontFamily = "'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif";
  container.style.color = "#000000";
  container.style.fontSize = "13px";
  container.style.lineHeight = "1.6";
  container.dir = "rtl";
  container.innerHTML = html;

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  // إخفاء باقي الصفحة مؤقتاً
  const main = document.body.children;
  for (let i = 0; i < main.length; i++) {
    const el = main[i] as HTMLElement;
    if (el !== wrapper) {
      el.dataset.prevDisplay = el.style.display;
      el.style.display = "none";
    }
  }

  return wrapper;
}

export function removePrintContainer(container: HTMLElement) {
  // إرجاع باقي الصفحة
  const main = document.body.children;
  for (let i = 0; i < main.length; i++) {
    const el = main[i] as HTMLElement;
    if (el !== container && el.dataset.prevDisplay !== undefined) {
      el.style.display = el.dataset.prevDisplay;
      delete el.dataset.prevDisplay;
    }
  }

  if (container.parentNode) container.parentNode.removeChild(container);
}
