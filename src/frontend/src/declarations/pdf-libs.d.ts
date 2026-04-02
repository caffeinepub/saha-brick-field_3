declare module "jspdf" {
  interface jsPDFOptions {
    unit?: string;
    format?: string | number[];
    orientation?: string;
  }
  interface TextOptions {
    align?: string;
    maxWidth?: number;
  }
  class jsPDF {
    constructor(options?: jsPDFOptions);
    setFontSize(size: number): this;
    setFont(fontName: string, fontStyle?: string): this;
    setTextColor(r: number, g: number, b: number): this;
    setDrawColor(r: number, g: number, b: number): this;
    setFillColor(r: number, g: number, b: number): this;
    text(text: string, x: number, y: number, options?: TextOptions): this;
    rect(x: number, y: number, w: number, h: number, style?: string): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    addPage(): this;
    addImage(imageData: string, format: string, x: number, y: number, w: number, h: number): this;
    save(filename: string): void;
    lastAutoTable: { finalY: number };
  }
  export default jsPDF;
}

declare module "jspdf-autotable" {
  import type jsPDF from "jspdf";
  interface UserOptions {
    startY?: number;
    head?: string[][];
    body?: string[][];
    theme?: string;
    styles?: Record<string, any>;
    headStyles?: Record<string, any>;
    columnStyles?: Record<string, any>;
    alternateRowStyles?: Record<string, any>;
    margin?: Record<string, number>;
    tableWidth?: number;
    didParseCell?: (data: any) => void;
  }
  function autoTable(doc: jsPDF, options: UserOptions): void;
  export default autoTable;
}

declare module "html2canvas" {
  interface Options {
    scale?: number;
    useCORS?: boolean;
    backgroundColor?: string | null;
    logging?: boolean;
    scrollX?: number;
    scrollY?: number;
    windowWidth?: number;
    windowHeight?: number;
  }
  function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export default html2canvas;
}
