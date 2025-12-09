import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

interface ExportOptions {
  element: HTMLElement;
  filename?: string;
}

export async function exportToPDF({
  element,
  filename,
}: ExportOptions): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const marginSides = 15;
    const marginTop = 15;
    const marginBottom = 20;
    const contentWidth = pageWidth - 2 * marginSides;
    const contentHeight = pageHeight - marginTop - marginBottom;

    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    const totalPages = Math.ceil(imgHeight / contentHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      const sourceY = page * contentHeight * (canvas.width / contentWidth);
      const sourceHeight = contentHeight * (canvas.width / contentWidth);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(sourceHeight, canvas.height - sourceY);

      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );

        const pageImgHeight =
          (pageCanvas.height * contentWidth) / pageCanvas.width;

        pdf.addImage(
          pageCanvas.toDataURL("image/png"),
          "PNG",
          marginSides,
          marginTop,
          contentWidth,
          pageImgHeight
        );
      }

      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        "INGRES AI - Groundwater Resource Information",
        marginSides,
        pageHeight - 10
      );
      pdf.text(
        `Page ${page + 1} of ${totalPages}`,
        pageWidth - marginSides - 30,
        pageHeight - 10
      );
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    pdf.save(filename || `INGRES-AI-Chat-${timestamp}.pdf`);
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
}
