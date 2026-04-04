declare module 'html2canvas';
declare module 'jspdf';
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; logging?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
    pagebreak?: { mode?: string | string[] };
  }
  interface Html2PdfInstance {
    from(element: HTMLElement | string): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
    save(filename?: string): Promise<void>;
    output(type: string): Promise<unknown>;
    outputPdf(type: string): unknown;
  }
  function html2pdf(): Html2PdfInstance;
  export = html2pdf;
}
