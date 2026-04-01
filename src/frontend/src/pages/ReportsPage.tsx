import { ArrowLeft, Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompleteDelivery } from "../App";

// jsPDF and jspdf-autotable are loaded via CDN in index.html
declare const window: Window & {
  jspdf: { jsPDF: new (opts: { unit: string; format: string }) => any };
};

type Props = { completeDeliveries: CompleteDelivery[]; onBack: () => void };

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function fmtDateShort(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}
function getWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().slice(0, 10),
    to: sun.toISOString().slice(0, 10),
  };
}

export default function ReportsPage({ completeDeliveries, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [fromDate, setFromDate] = useState(() => getTodayIso());
  const [toDate, setToDate] = useState(() => getTodayIso());

  function handleTabChange(tab: "daily" | "weekly") {
    setActiveTab(tab);
    if (tab === "daily") {
      setFromDate(getTodayIso());
      setToDate(getTodayIso());
    } else {
      const { from, to } = getWeekRange();
      setFromDate(from);
      setToDate(to);
    }
  }

  function handleFromChange(val: string) {
    setFromDate(val);
    if (!val && !toDate) {
      if (activeTab === "daily") {
        setFromDate(getTodayIso());
        setToDate(getTodayIso());
      } else {
        const { from, to } = getWeekRange();
        setFromDate(from);
        setToDate(to);
      }
    }
  }

  function handleToChange(val: string) {
    setToDate(val);
    if (!val && !fromDate) {
      if (activeTab === "daily") {
        setFromDate(getTodayIso());
        setToDate(getTodayIso());
      } else {
        const { from, to } = getWeekRange();
        setFromDate(from);
        setToDate(to);
      }
    }
  }

  // ── DAILY: filter by date range, group by vehicle ────────────────────────
  const dailyGrouped = useMemo(() => {
    const map = new Map<string, CompleteDelivery[]>();
    if (!fromDate || !toDate) return map;
    for (const d of completeDeliveries) {
      const dateKey = d.deliveryDate || "";
      if (!dateKey || dateKey < fromDate || dateKey > toDate) continue;
      const key = d.vehicleNumber || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [completeDeliveries, fromDate, toDate]);

  // ── WEEKLY: filter by date range, group by labour + date ─────────────────
  const weeklyData = useMemo(() => {
    if (!fromDate || !toDate)
      return {
        activeDates: [],
        allLabours: [],
        matrix: new Map<string, Map<string, number>>(),
        dayTotals: new Map<string, number>(),
        labourTotals: new Map<string, number>(),
        overallTotal: 0,
      };
    const filtered = completeDeliveries.filter(
      (d) =>
        d.deliveryDate &&
        d.deliveryDate >= fromDate &&
        d.deliveryDate <= toDate,
    );
    const dateSet = new Set<string>();
    const labourSet = new Set<string>();
    for (const d of filtered) {
      dateSet.add(d.deliveryDate);
      for (const name of d.loadingLabours || []) labourSet.add(name);
      for (const name of d.unloadingLabours || []) labourSet.add(name);
    }
    const activeDates = Array.from(dateSet).sort();
    const allLabours = Array.from(labourSet);
    const matrix = new Map<string, Map<string, number>>();
    const dayTotals = new Map<string, number>();
    const labourTotals = new Map<string, number>();
    for (const l of allLabours) matrix.set(l, new Map());
    for (const d of filtered) {
      const breakdown = d.labourBreakdown || {};
      const allNames = Array.from(
        new Set([...(d.loadingLabours || []), ...(d.unloadingLabours || [])]),
      );
      for (const name of allNames) {
        const amt = breakdown[name] || 0;
        const lmap = matrix.get(name);
        if (lmap)
          lmap.set(d.deliveryDate, (lmap.get(d.deliveryDate) || 0) + amt);
        dayTotals.set(
          d.deliveryDate,
          (dayTotals.get(d.deliveryDate) || 0) + amt,
        );
        labourTotals.set(name, (labourTotals.get(name) || 0) + amt);
      }
    }
    const overallTotal = Array.from(labourTotals.values()).reduce(
      (a, b) => a + b,
      0,
    );
    return { activeDates, allLabours, matrix, labourTotals, overallTotal };
  }, [completeDeliveries, fromDate, toDate]);

  const reportTitle =
    activeTab === "daily" ? "DAILY LABOURS REPORT" : "WEEKLY LABOURS REPORT";

  const dateLabel =
    fromDate && toDate
      ? fromDate === toDate
        ? fmtDate(fromDate)
        : `${fmtDate(fromDate)} → ${fmtDate(toDate)}`
      : "";

  // ── PRINT ────────────────────────────────────────────────────────────────
  function handlePrint() {
    const el = document.getElementById("report-print-area");
    if (!el) return;
    const win = window.open("", "", "width=900,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>${reportTitle}</title><style>
      body{font-family:Arial,sans-serif;margin:20px;font-size:13px;}
      h1{text-align:center;font-size:18px;font-weight:bold;margin:0;text-transform:uppercase;}
      h2{text-align:center;font-size:14px;font-weight:bold;margin:4px 0;text-transform:uppercase;}
      p.date-line{text-align:center;font-size:11px;color:#555;margin-bottom:12px;}
      table{width:100%;border-collapse:collapse;margin-bottom:6px;}
      th{background:#1b5e20;color:white;font-weight:bold;padding:8px;text-align:center;border:1px solid #999;text-transform:uppercase;}
      th.left{text-align:left;}
      td{border:1px solid #bbb;padding:7px 8px;font-size:12px;}
      tr:nth-child(even) td{background:#f5f5f5;}
      .vehicle-box{background:#fffde7;border:1px solid #ccc000;font-weight:bold;padding:7px 10px;margin:14px 0 4px 0;font-size:13px;text-transform:uppercase;}
      .grand-total{text-align:center;font-weight:bold;font-size:15px;margin:10px 0 6px 0;text-transform:uppercase;}
      .labour-summary{display:flex;flex-wrap:wrap;justify-content:center;gap:24px;font-size:13px;font-weight:700;margin:10px 0 16px 0;color:#1b5e20;text-transform:uppercase;padding:8px 0;border-top:2px solid #ccc;letter-spacing:0.5px;}
      @media print{@page{size:A4;margin:15mm;}}
    </style></head><body>`);
    win.document.write(el.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  // ── PDF ──────────────────────────────────────────────────────────────────
  function handleDownloadPdf() {
    if (!window.jspdf) {
      alert("PDF library not loaded. Please check your internet connection.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 15;
    const fileName =
      activeTab === "daily"
        ? `daily-report-${fromDate || new Date().toISOString().slice(0, 10)}.pdf`
        : `weekly-report-${toDate || new Date().toISOString().slice(0, 10)}.pdf`;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("S B C O BRICK FIELD", 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(13);
    doc.text(reportTitle, 105, y, { align: "center" });
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (dateLabel) {
      doc.text(dateLabel, 105, y, { align: "center" });
      y += 10;
    } else y += 4;

    if (activeTab === "daily") {
      if (dailyGrouped.size === 0) {
        doc.text("No data found", 105, y, { align: "center" });
        doc.save(fileName);
        return;
      }
      const globalLabourTotals = new Map<string, number>();

      for (const [vehicleNumber, rows] of dailyGrouped) {
        doc.setFillColor(255, 253, 231);
        doc.rect(10, y, 190, 9, "F");
        doc.setDrawColor(200, 192, 0);
        doc.rect(10, y, 190, 9);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`VEHICLE: ${vehicleNumber}`, 14, y + 6.5);
        y += 13;

        const vLabours = new Set<string>();
        for (const r of rows) {
          for (const name of r.loadingLabours || []) vLabours.add(name);
          for (const name of r.unloadingLabours || []) vLabours.add(name);
        }
        const lCols = Array.from(vLabours);
        const colTotals = new Map<string, number>();

        const head = [
          ["ADDRESS", "QTY", "RATE", ...lCols.map((n) => n.toUpperCase())],
        ];
        const body = rows.map((r) => {
          const qty = (r.deliverItems || []).reduce(
            (s, b) => s + (b.deliverQty || 0),
            0,
          );
          const rate = r.ratePerThousand ?? 0;
          const breakdown = r.labourBreakdown || {};
          return [
            (r.address || r.customerName || "-").toUpperCase(),
            String(qty),
            String(rate),
            ...lCols.map((name) => {
              const inRow = [
                ...(r.loadingLabours || []),
                ...(r.unloadingLabours || []),
              ].includes(name);
              const amt = inRow ? breakdown[name] || 0 : 0;
              if (inRow) {
                colTotals.set(name, (colTotals.get(name) || 0) + amt);
                globalLabourTotals.set(
                  name,
                  (globalLabourTotals.get(name) || 0) + amt,
                );
              }
              return inRow ? `${Math.round(amt)}` : "-";
            }),
          ];
        });
        const grandSum = rows.reduce((s, r) => s + (r.totalAmount || 0), 0);

        doc.autoTable({
          startY: y,
          head,
          body,
          theme: "grid",
          styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
          headStyles: {
            fillColor: [27, 94, 32],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: { 0: { halign: "left" } },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 10, right: 10 },
          tableWidth: 190,
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index > 0)
              data.cell.styles.halign = "center";
          },
        });
        y = doc.lastAutoTable.finalY + 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`GRAND TOTAL  \u20B9${grandSum}`, 105, y, { align: "center" });
        y += 12;
        if (y > 265) {
          doc.addPage();
          y = 15;
        }
      }
      const summaryParts = Array.from(globalLabourTotals.entries()).map(
        ([n, a]) => `${n.toUpperCase()}  \u20B9${Math.round(a)}`,
      );
      if (summaryParts.length > 0) {
        doc.setDrawColor(180, 180, 180);
        doc.line(10, y, 200, y);
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(summaryParts.join("      "), 105, y, {
          align: "center",
          maxWidth: 185,
        });
      }
    } else {
      // WEEKLY
      const { activeDates, allLabours, matrix, labourTotals, overallTotal } =
        weeklyData;
      if (activeDates.length === 0) {
        doc.text("No data found", 105, y, { align: "center" });
        doc.save(fileName);
        return;
      }
      const head = [["NAME", ...activeDates.map(fmtDateShort), "TOTAL"]];
      const body = allLabours.map((name) => [
        name.toUpperCase(),
        ...activeDates.map((date) => {
          const v = matrix.get(name)?.get(date);
          return v ? String(Math.round(v)) : "-";
        }),
        String(Math.round(labourTotals.get(name) || 0)),
      ]);

      doc.autoTable({
        startY: y,
        head,
        body,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
        headStyles: {
          fillColor: [27, 94, 32],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: { 0: { halign: "left" } },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 },
        tableWidth: 190,
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index > 0)
            data.cell.styles.halign = "center";
        },
      });
      y = doc.lastAutoTable.finalY + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`GRAND TOTAL  \u20B9${Math.round(overallTotal)}`, 105, y, {
        align: "center",
      });
    }
    doc.save(fileName);
  }

  const { activeDates, allLabours, matrix, labourTotals, overallTotal } =
    weeklyData;

  return (
    <div className="flex flex-col flex-1 pb-16">
      <div className="sticky top-0 z-10 bg-[oklch(0.25_0.08_145)] text-white px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <span className="font-bold text-base flex-1">REPORTS</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 bg-white">
        <button
          type="button"
          data-ocid="reports.daily.tab"
          className={`flex-1 py-3 font-bold text-sm transition-colors ${
            activeTab === "daily"
              ? "border-b-2 border-green-700 text-green-800"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("daily")}
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
          onClick={() => handleTabChange("weekly")}
        >
          WEEKLY REPORT
        </button>
      </div>

      <div className="p-4 bg-gray-50 flex-1">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-700">FROM:</span>
            <input
              type="date"
              data-ocid="reports.from_date.input"
              value={fromDate}
              onChange={(e) => handleFromChange(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <span className="text-gray-500 font-bold">→</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-700">TO:</span>
            <input
              type="date"
              data-ocid="reports.to_date.input"
              value={toDate}
              onChange={(e) => handleToChange(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Buttons */}
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

        {/* Print area */}
        <div id="report-print-area" className="bg-white rounded shadow p-4">
          <h1 className="text-center font-bold text-xl mb-1 uppercase">
            S B C O BRICK FIELD
          </h1>
          <h2 className="text-center font-bold text-base mb-1 uppercase">
            {reportTitle}
          </h2>
          <p className="text-center text-xs text-gray-500 mb-4">{dateLabel}</p>

          {activeTab === "daily" ? (
            dailyGrouped.size === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">
                {fromDate && toDate ? "কোনো ডেটা পাওয়া যায়নি" : "তারিখ সিলেক্ট করুন"}
              </div>
            ) : (
              (() => {
                const globalLabourTotals = new Map<string, number>();
                const sections = Array.from(dailyGrouped.entries()).map(
                  ([vehicleNumber, rows]) => {
                    const vLabours = new Set<string>();
                    for (const r of rows) {
                      for (const name of r.loadingLabours || [])
                        vLabours.add(name);
                      for (const name of r.unloadingLabours || [])
                        vLabours.add(name);
                    }
                    const lCols = Array.from(vLabours);
                    const grandSum = rows.reduce(
                      (s, r) => s + (r.totalAmount || 0),
                      0,
                    );
                    for (const r of rows) {
                      const brkd = r.labourBreakdown || {};
                      const rowNames = Array.from(
                        new Set([
                          ...(r.loadingLabours || []),
                          ...(r.unloadingLabours || []),
                        ]),
                      );
                      for (const name of rowNames) {
                        globalLabourTotals.set(
                          name,
                          (globalLabourTotals.get(name) || 0) +
                            (brkd[name] || 0),
                        );
                      }
                    }
                    return (
                      <div key={vehicleNumber} className="mb-6">
                        <div
                          className="w-full font-bold px-3 py-2 mb-1 text-sm uppercase"
                          style={{
                            backgroundColor: "#fffde7",
                            border: "1px solid #ccc000",
                          }}
                        >
                          VEHICLE: {vehicleNumber}
                        </div>
                        <div className="overflow-x-auto">
                          <table
                            className="w-full"
                            style={{
                              borderCollapse: "collapse",
                              fontSize: "13px",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  backgroundColor: "#1b5e20",
                                  color: "white",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "8px",
                                    border: "1px solid #999",
                                    textAlign: "left",
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  ADDRESS
                                </th>
                                <th
                                  style={{
                                    padding: "8px",
                                    border: "1px solid #999",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  QTY
                                </th>
                                <th
                                  style={{
                                    padding: "8px",
                                    border: "1px solid #999",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  RATE
                                </th>
                                {lCols.map((n) => (
                                  <th
                                    key={n}
                                    style={{
                                      padding: "8px",
                                      border: "1px solid #999",
                                      textAlign: "center",
                                      fontWeight: "bold",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {n.toUpperCase()}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((r, i) => {
                                const qty = (r.deliverItems || []).reduce(
                                  (s, b) => s + (b.deliverQty || 0),
                                  0,
                                );
                                const rate = r.ratePerThousand ?? 0;
                                const rowBreakdown = r.labourBreakdown || {};
                                return (
                                  <tr
                                    key={`${r.customerName}-${r.address}-${i}`}
                                    style={{
                                      backgroundColor:
                                        i % 2 === 0 ? "white" : "#f5f5f5",
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "7px 8px",
                                        border: "1px solid #bbb",
                                        textAlign: "left",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {r.address || r.customerName || "-"}
                                    </td>
                                    <td
                                      style={{
                                        padding: "7px 8px",
                                        border: "1px solid #bbb",
                                        textAlign: "center",
                                      }}
                                    >
                                      {qty}
                                    </td>
                                    <td
                                      style={{
                                        padding: "7px 8px",
                                        border: "1px solid #bbb",
                                        textAlign: "center",
                                      }}
                                    >
                                      {rate}
                                    </td>
                                    {lCols.map((name) => {
                                      const inRow = [
                                        ...(r.loadingLabours || []),
                                        ...(r.unloadingLabours || []),
                                      ].includes(name);
                                      return (
                                        <td
                                          key={name}
                                          style={{
                                            padding: "7px 8px",
                                            border: "1px solid #bbb",
                                            textAlign: "center",
                                          }}
                                        >
                                          {inRow
                                            ? `₹${Math.round(rowBreakdown[name] || 0)}`
                                            : "-"}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div
                          className="text-center font-bold text-base mt-3 mb-1 uppercase"
                          style={{ fontSize: "15px", letterSpacing: "0.5px" }}
                        >
                          GRAND TOTAL ₹{grandSum}
                        </div>
                      </div>
                    );
                  },
                );
                const summaryEntries = Array.from(globalLabourTotals.entries());
                return (
                  <>
                    {sections}
                    {summaryEntries.length > 0 && (
                      <div
                        className="labour-summary"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "center",
                          gap: "24px",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "#1b5e20",
                          textTransform: "uppercase",
                          borderTop: "2px solid #ccc",
                          paddingTop: "10px",
                          marginTop: "8px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {summaryEntries.map(([n, a]) => (
                          <span key={n}>
                            {n.toUpperCase()} ₹{Math.round(a)}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()
            )
          ) : activeDates.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">
              {fromDate && toDate
                ? "কোনো ডেটা পাওয়া যায়নি"
                : "তারিখ range সিলেক্ট করুন"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{ borderCollapse: "collapse", fontSize: "13px" }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#1b5e20", color: "white" }}>
                      <th
                        style={{
                          padding: "8px",
                          border: "1px solid #999",
                          textAlign: "left",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        NAME
                      </th>
                      {activeDates.map((d) => (
                        <th
                          key={d}
                          style={{
                            padding: "8px",
                            border: "1px solid #999",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {fmtDateShort(d)}
                        </th>
                      ))}
                      <th
                        style={{
                          padding: "8px",
                          border: "1px solid #999",
                          textAlign: "center",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLabours.map((name, i) => (
                      <tr
                        key={name}
                        style={{
                          backgroundColor: i % 2 === 0 ? "white" : "#f5f5f5",
                        }}
                      >
                        <td
                          style={{
                            padding: "7px 8px",
                            border: "1px solid #bbb",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          {name.toUpperCase()}
                        </td>
                        {activeDates.map((date) => {
                          const v = matrix.get(name)?.get(date);
                          return (
                            <td
                              key={date}
                              style={{
                                padding: "7px 8px",
                                border: "1px solid #bbb",
                                textAlign: "center",
                              }}
                            >
                              {v ? `₹${Math.round(v)}` : "-"}
                            </td>
                          );
                        })}
                        <td
                          style={{
                            padding: "7px 8px",
                            border: "1px solid #bbb",
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          ₹{Math.round(labourTotals.get(name) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="text-center font-bold uppercase mt-4 mb-3"
                style={{ fontSize: "15px", letterSpacing: "0.5px" }}
              >
                GRAND TOTAL ₹{Math.round(overallTotal)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
