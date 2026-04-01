import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";

type BrickItem = {
  type: string;
  quantity: number;
  rate: number;
  total: number;
};
type LabourItem = { name: string; amount: number };
type Delivery = {
  customerName: string;
  address: string;
  date: string;
  vehicleType: string;
  vehicleNumber: string;
  bricks: BrickItem[];
  labours: LabourItem[];
  grandTotal: number;
};

type Props = {
  completeDeliveries: unknown[];
  onBack: () => void;
};

export default function ReportsPage({ completeDeliveries, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const deliveries = completeDeliveries as Delivery[];

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (!d.date) return false;
      if (fromDate && d.date < fromDate) return false;
      if (toDate && d.date > toDate) return false;
      return true;
    });
  }, [deliveries, fromDate, toDate]);

  // Group by vehicle number
  const grouped = useMemo(() => {
    const map = new Map<string, Delivery[]>();
    for (const d of filtered) {
      const key = d.vehicleNumber || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [filtered]);

  const reportTitle =
    activeTab === "daily" ? "DAILY LABOURS REPORT" : "WEEKLY LABOURS REPORT";
  const fileName =
    activeTab === "daily"
      ? `daily-report-${toDate || new Date().toISOString().slice(0, 10)}.pdf`
      : `weekly-report-${toDate || new Date().toISOString().slice(0, 10)}.pdf`;

  function handlePrint() {
    const printContent = document.getElementById("report-print-area");
    if (!printContent) return;
    const win = window.open("", "", "width=900,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>${reportTitle}</title><style>
      body { font-family: Arial, sans-serif; margin: 20px; font-size: 13px; }
      h1 { text-align: center; font-size: 18px; font-weight: bold; margin: 0; }
      h2 { text-align: center; font-size: 14px; font-weight: bold; margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th { background: #1b5e20; color: white; font-weight: bold; padding: 8px; text-align: center; border: 1px solid #ccc; }
      td { border: 1px solid #ccc; padding: 8px; font-size: 13px; }
      tr:nth-child(even) td { background: #f5f5f5; }
      .vehicle-header { background: #fffde7; font-weight: bold; padding: 8px 10px; width: 100%; box-sizing: border-box; display: block; margin: 14px 0 4px 0; border: 1px solid #e0d000; font-size: 13px; }
      .grand-total { text-align: center; font-weight: bold; font-size: 16px; margin: 10px 0; }
      .labour-summary { font-size: 12px; margin: 6px 0 14px 0; text-align: center; font-weight: 600; }
      @media print { @page { size: A4; margin: 15mm; } }
    </style></head><body>`);
    win.document.write(printContent.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  function handleDownloadPdf() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 15;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("S B C O BRICK FIELD", 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(13);
    doc.text(reportTitle, 105, y, { align: "center" });
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateLabel =
      fromDate && toDate
        ? `${fromDate}  to  ${toDate}`
        : fromDate || toDate || new Date().toISOString().slice(0, 10);
    doc.text(`Date: ${dateLabel}`, 105, y, { align: "center" });
    y += 10;

    if (grouped.size === 0) {
      doc.text("No data found", 105, y, { align: "center" });
      doc.save(fileName);
      return;
    }

    for (const [vehicleNumber, rows] of grouped) {
      doc.setFillColor(255, 253, 231);
      doc.rect(10, y, 190, 9, "F");
      doc.setDrawColor(200, 180, 0);
      doc.rect(10, y, 190, 9);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`VEHICLE: ${vehicleNumber}`, 14, y + 6.5);
      y += 13;

      const vehicleLabourNames = new Set<string>();
      for (const r of rows)
        for (const l of r.labours || []) vehicleLabourNames.add(l.name);
      const labourCols = Array.from(vehicleLabourNames);

      const head = [["ADDRESS", "QUANTITY", "RATE", ...labourCols, "TOTAL"]];
      const body = rows.map((r) => {
        const qty = (r.bricks || []).reduce((s, b) => s + (b.quantity || 0), 0);
        const rate = (r.bricks || [])[0]?.rate ?? 0;
        const labourAmounts = labourCols.map((name) => {
          const l = (r.labours || []).find((x) => x.name === name);
          return l ? `Rs${l.amount}` : "-";
        });
        return [
          r.address || r.customerName || "-",
          String(qty),
          String(rate),
          ...labourAmounts,
          `Rs${r.grandTotal ?? 0}`,
        ];
      });

      autoTable(doc, {
        startY: y,
        head,
        body,
        theme: "grid",
        styles: { fontSize: 12, cellPadding: 3, textColor: [0, 0, 0] },
        headStyles: {
          fillColor: [27, 94, 32],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: { 0: { halign: "left", cellWidth: 40 } },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 },
        tableWidth: 190,
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index > 0) {
            data.cell.styles.halign = "center";
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 6;

      const grandSum = rows.reduce((s, r) => s + (r.grandTotal || 0), 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`GRAND TOTAL  Rs${grandSum}`, 105, y, { align: "center" });
      y += 8;

      const labourTotals = new Map<string, number>();
      for (const r of rows) {
        for (const l of r.labours || []) {
          labourTotals.set(l.name, (labourTotals.get(l.name) || 0) + l.amount);
        }
      }
      const labourLine = Array.from(labourTotals.entries())
        .map(([n, a]) => `${n} Rs${a}`)
        .join("  |  ");
      if (labourLine) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(labourLine, 105, y, { align: "center", maxWidth: 185 });
        y += 10;
      }

      y += 6;
      if (y > 260) {
        doc.addPage();
        y = 15;
      }
    }

    doc.save(fileName);
  }

  return (
    <div className="flex flex-col flex-1 pb-16">
      <div className="sticky top-0 z-10 bg-[oklch(0.25_0.08_145)] text-white px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <span className="font-bold text-base flex-1">REPORTS</span>
      </div>

      <div className="flex border-b border-gray-300 bg-white">
        <button
          type="button"
          data-ocid="reports.daily.tab"
          className={`flex-1 py-3 font-bold text-sm transition-colors ${
            activeTab === "daily"
              ? "border-b-2 border-green-700 text-green-800"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("daily")}
        >
          DAILY REPORT
        </button>
        <button
          type="button"
          data-ocid="reports.weekly.tab"
          className={`flex-1 py-3 font-bold text-sm transition-colors ${
            activeTab === "weekly"
              ? "border-b-2 border-green-700 text-green-800"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("weekly")}
        >
          WEEKLY REPORT
        </button>
      </div>

      <div className="p-4 bg-gray-50 flex-1">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">FROM:</span>
          <input
            id="from-date"
            type="date"
            data-ocid="reports.from_date.input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <span className="text-gray-500 font-bold">→</span>
          <span className="text-sm font-semibold text-gray-700">TO:</span>
          <input
            id="to-date"
            type="date"
            data-ocid="reports.to_date.input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="flex gap-3 mb-5">
          <button
            type="button"
            data-ocid="reports.print.button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold px-5 py-2 rounded shadow text-sm"
          >
            <Printer size={16} />
            PRINT
          </button>
          <button
            type="button"
            data-ocid="reports.download_pdf.button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white font-bold px-5 py-2 rounded shadow text-sm"
          >
            <Download size={16} />
            DOWNLOAD PDF
          </button>
        </div>

        <div id="report-print-area" className="bg-white rounded shadow p-4">
          <h1 className="text-center font-bold text-xl mb-1">
            S B C O BRICK FIELD
          </h1>
          <h2 className="text-center font-bold text-base mb-1">
            {reportTitle}
          </h2>
          <p className="text-center text-xs text-gray-500 mb-4">
            {fromDate && toDate
              ? `${fromDate}  →  ${toDate}`
              : fromDate || toDate || ""}
          </p>

          {grouped.size === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">
              কোনো ডেটা পাওয়া যায়নি
            </div>
          ) : (
            Array.from(grouped.entries()).map(([vehicleNumber, rows]) => {
              const vehicleLabourNames = new Set<string>();
              for (const r of rows)
                for (const l of r.labours || []) vehicleLabourNames.add(l.name);
              const labourCols = Array.from(vehicleLabourNames);
              const grandSum = rows.reduce(
                (s, r) => s + (r.grandTotal || 0),
                0,
              );
              const labourTotals = new Map<string, number>();
              for (const r of rows)
                for (const l of r.labours || [])
                  labourTotals.set(
                    l.name,
                    (labourTotals.get(l.name) || 0) + l.amount,
                  );
              const labourLine = Array.from(labourTotals.entries())
                .map(([n, a]) => `${n} ₹${a}`)
                .join(" | ");

              return (
                <div key={vehicleNumber} className="mb-6">
                  <div
                    className="w-full font-bold px-3 py-2 mb-1 text-sm"
                    style={{
                      backgroundColor: "#fffde7",
                      border: "1px solid #e0d000",
                    }}
                  >
                    VEHICLE: {vehicleNumber}
                  </div>

                  <div className="overflow-x-auto">
                    <table
                      className="w-full"
                      style={{ borderCollapse: "collapse", fontSize: "13px" }}
                    >
                      <thead>
                        <tr
                          style={{ backgroundColor: "#1b5e20", color: "white" }}
                        >
                          <th
                            style={{
                              padding: "8px",
                              border: "1px solid #ccc",
                              textAlign: "left",
                              fontWeight: "bold",
                            }}
                          >
                            ADDRESS
                          </th>
                          <th
                            style={{
                              padding: "8px",
                              border: "1px solid #ccc",
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            QUANTITY
                          </th>
                          <th
                            style={{
                              padding: "8px",
                              border: "1px solid #ccc",
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            RATE
                          </th>
                          {labourCols.map((name) => (
                            <th
                              key={name}
                              style={{
                                padding: "8px",
                                border: "1px solid #ccc",
                                textAlign: "center",
                                fontWeight: "bold",
                              }}
                            >
                              {name}
                            </th>
                          ))}
                          <th
                            style={{
                              padding: "8px",
                              border: "1px solid #ccc",
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            TOTAL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => {
                          const qty = (r.bricks || []).reduce(
                            (s, b) => s + (b.quantity || 0),
                            0,
                          );
                          const rate = (r.bricks || [])[0]?.rate ?? 0;
                          const rowKey = `${vehicleNumber}-${r.date}-${r.customerName}-${i}`;
                          return (
                            <tr
                              key={rowKey}
                              style={{
                                backgroundColor:
                                  i % 2 === 0 ? "white" : "#f5f5f5",
                              }}
                            >
                              <td
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ccc",
                                  textAlign: "left",
                                }}
                              >
                                {r.address || r.customerName || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ccc",
                                  textAlign: "center",
                                }}
                              >
                                {qty}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ccc",
                                  textAlign: "center",
                                }}
                              >
                                {rate}
                              </td>
                              {labourCols.map((name) => {
                                const l = (r.labours || []).find(
                                  (x) => x.name === name,
                                );
                                return (
                                  <td
                                    key={name}
                                    style={{
                                      padding: "8px",
                                      border: "1px solid #ccc",
                                      textAlign: "center",
                                    }}
                                  >
                                    {l ? `₹${l.amount}` : "-"}
                                  </td>
                                );
                              })}
                              <td
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ccc",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                }}
                              >
                                ₹{r.grandTotal ?? 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center font-bold text-base mt-3 mb-1">
                    GRAND TOTAL ₹{grandSum}
                  </div>

                  {labourLine && (
                    <div
                      className="text-sm text-gray-700 text-center mt-1 mb-2"
                      style={{ fontWeight: 600 }}
                    >
                      {labourLine}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
