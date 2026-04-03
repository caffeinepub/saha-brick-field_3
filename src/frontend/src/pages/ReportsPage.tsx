import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompleteDelivery } from "../App";

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
        : `${fmtDate(fromDate)} \u2192 ${fmtDate(toDate)}`
      : "";

  // ── PRINT ────────────────────────────────────────────────────────────────
  function handlePrint() {
    const el = document.getElementById("report-print-area");
    if (!el) return;
    const win = window.open("", "", "width=900,height=700");
    if (!win) return;
    win.document.write(`<html><head><meta charset="UTF-8"><title>${reportTitle}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap');
      @page{size:A4;margin:10mm;}
      *{box-sizing:border-box;}
      body{font-family:'Noto Sans',Arial,sans-serif;margin:0;padding:10mm;font-size:12px;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      h1{text-align:center;font-size:18px;font-weight:bold;margin:0 0 4px;text-transform:uppercase;}
      h2{text-align:center;font-size:14px;font-weight:bold;margin:0 0 4px;text-transform:uppercase;}
      p.date-line{text-align:center;font-size:11px;color:#555;margin:0 0 14px;}
      .section{margin-bottom:20px;page-break-inside:avoid;}
      .vehicle-label{background:#000!important;color:#fff!important;font-weight:bold;padding:6px 10px;font-size:12px;text-transform:uppercase;margin-bottom:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      table{width:100%;border-collapse:collapse;margin-bottom:0;}
      thead{display:table-header-group;}
      tbody tr{page-break-inside:avoid;}
      th{background:#000!important;color:#fff!important;font-weight:bold;padding:8px 10px;font-size:12px;border:1px solid #333;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      th.left{text-align:left;}
      th.right{text-align:right;}
      th.center{text-align:center;}
      td{border:1px solid #ccc;padding:6px 8px;font-size:11px;vertical-align:top;color:#000;}
      td.left{text-align:left;}
      td.right{text-align:right;}
      td.center{text-align:center;}
      tr.even td{background:#f4f4f4!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .grand-total{text-align:center;font-weight:bold;font-size:14px;margin:10px 0 6px;text-transform:uppercase;border-top:2px solid #000;padding-top:8px;}
      .labour-summary{display:flex;flex-wrap:wrap;justify-content:center;gap:20px;font-weight:700;font-size:12px;text-transform:uppercase;border-top:1px solid #ccc;padding:8px 0;letter-spacing:0.5px;}
      @media print{@page{size:A4;margin:10mm;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.section{page-break-inside:avoid;}tbody tr{page-break-inside:avoid;}th{background:#000!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}tr.even td{background:#f4f4f4!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.vehicle-label{background:#000!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style></head><body>`);
    win.document.write(el.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  // ── PDF ──────────────────────────────────────────────────────────────────
  function buildReportHtml(): string {
    const thBase =
      "background:#000000;color:#fff;font-weight:bold;padding:8px 10px;font-size:12px;text-align:center;border:1px solid #333;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact;";
    const thLeft = `${thBase}text-align:left;`;
    const tdBase =
      "border:1px solid #ccc;padding:6px 8px;font-size:11px;text-align:right;font-family:'Noto Sans',Arial,sans-serif;color:#000;";
    const tdLeft = `${tdBase}text-align:left;text-transform:uppercase;`;

    let html = `<h1 style="text-align:center;font-size:18px;font-weight:bold;margin:0;text-transform:uppercase;">S B C O BRICK FIELD</h1>
<h2 style="text-align:center;font-size:14px;font-weight:bold;margin:4px 0;text-transform:uppercase;">${reportTitle}</h2>
<p style="text-align:center;font-size:11px;color:#555;margin-bottom:12px;">${dateLabel}</p>`;

    if (activeTab === "daily") {
      const globalLabourTotals = new Map<string, number>();
      for (const [vehicleNumber, rows] of Array.from(dailyGrouped.entries())) {
        const lColSet = new Set<string>();
        for (const r of rows) {
          for (const n of r.loadingLabours || []) lColSet.add(n);
          for (const n of r.unloadingLabours || []) lColSet.add(n);
        }
        const lCols = Array.from(lColSet);
        let grandSum = 0;
        for (const r of rows) {
          const bd = r.labourBreakdown || {};
          grandSum += Object.values(bd).reduce(
            (a: number, b) => a + (b as number),
            0,
          );
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
                ((bd as Record<string, number>)[name] || 0),
            );
          }
        }
        html += `<div style="margin-bottom:20px;page-break-inside:avoid;border:1px solid #ccc;">
<div style="margin-bottom:8px;"><span style="display:inline-block;background:#fffde7;border:2px solid #cccc00;font-weight:bold;padding:4px 12px;font-size:12px;text-transform:uppercase;">VEHICLE: ${vehicleNumber}</span></div>
<table style="border-collapse:collapse;width:100%;">
<thead><tr>
<th style="${thLeft}">ADDRESS</th>
<th style="${thBase}">QTY</th>
<th style="${thBase}">RATE</th>
${lCols.map((n) => `<th style="${thBase}">${n.toUpperCase()}</th>`).join("")}
</tr></thead>
<tbody>`;
        rows.forEach((r, i) => {
          const qty = (r.deliverItems || []).reduce(
            (s, b) => s + (b.deliverQty || 0),
            0,
          );
          const hasBatsItem = (r.deliverItems || []).some(
            (item) => item.type === "Bats",
          );
          const rate = hasBatsItem
            ? (r.batsRate ?? 0)
            : (r.ratePerThousand ?? 0);
          const bd = r.labourBreakdown || {};
          const bg = i % 2 === 1 ? "#f4f4f4" : "#ffffff";
          html += `<tr style="background:${bg};-webkit-print-color-adjust:exact;">
<td style="${tdLeft}">${r.address || r.customerName || "-"}</td>
<td style="${tdBase}">${qty}</td>
<td style="${tdBase}">${rate}</td>
${lCols
  .map((name) => {
    const inRow = [
      ...(r.loadingLabours || []),
      ...(r.unloadingLabours || []),
    ].includes(name);
    return `<td style="${tdBase}">${inRow ? `₹${Math.round((bd as Record<string, number>)[name] || 0)}` : "-"}</td>`;
  })
  .join("")}
</tr>`;
        });
        html += `</tbody></table>
<div style="text-align:center;font-weight:bold;font-size:14px;margin:10px 0 6px;text-transform:uppercase;border-top:2px solid #000;padding-top:8px;">GRAND TOTAL ₹${grandSum}</div>
</div>`;
      }
      const summaryEntries = Array.from(globalLabourTotals.entries());
      if (summaryEntries.length > 0) {
        html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:20px;font-weight:700;font-size:12px;color:#000000;text-transform:uppercase;border-top:1px solid #ccc;padding:8px 0;letter-spacing:0.5px;">
${summaryEntries.map(([n, a]) => `<span>${n.toUpperCase()} ₹${Math.round(a)}</span>`).join("")}
</div>`;
      }
    } else {
      const {
        activeDates: wDates,
        allLabours: wLabours,
        matrix: wMatrix,
        labourTotals: wLabourTotals,
        overallTotal: wTotal,
      } = weeklyData;
      html += `<table style="border-collapse:collapse;width:100%;">
<thead><tr>
<th style="${thLeft}">NAME</th>
${wDates.map((d) => `<th style="${thBase}">${fmtDateShort(d)}</th>`).join("")}
<th style="${thBase}">TOTAL</th>
</tr></thead>
<tbody>`;
      wLabours.forEach((name, i) => {
        const bg = i % 2 === 1 ? "#f4f4f4" : "#ffffff";
        const lMap = wMatrix.get(name);
        const total = wLabourTotals.get(name) || 0;
        html += `<tr style="background:${bg};">
<td style="${tdLeft};font-weight:600;">${name.toUpperCase()}</td>
${wDates
  .map((date) => {
    const v = lMap?.get(date);
    return `<td style="${tdBase}">${v ? `₹${Math.round(v)}` : "-"}</td>`;
  })
  .join("")}
<td style="${tdBase};font-weight:bold;">₹${Math.round(total)}</td>
</tr>`;
      });
      html += `</tbody></table>
<div style="text-align:center;font-weight:bold;font-size:14px;margin:10px 0 6px;text-transform:uppercase;border-top:2px solid #000;padding-top:8px;">GRAND TOTAL ₹${Math.round(wTotal)}</div>`;
    }
    return html;
  }

  async function handleDownloadPdf() {
    try {
      const fileName =
        activeTab === "daily"
          ? `daily-report-${fromDate || new Date().toISOString().slice(0, 10)}.pdf`
          : `weekly-report-${toDate || new Date().toISOString().slice(0, 10)}.pdf`;

      const reportHtml = buildReportHtml();

      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-9999px;top:0;width:800px;background:white;padding:20px;font-family:'Noto Sans',Arial,sans-serif;font-size:13px;";
      container.innerHTML = reportHtml;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      const margin = 10;
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - margin * 2;
      const imgAspect = canvas.height / canvas.width;
      const totalImgHeight = contentWidth * imgAspect;
      const contentHeight = pageHeight - margin * 2;
      let renderedHeight = 0;
      let pageNum = 0;
      while (renderedHeight < totalImgHeight) {
        if (pageNum > 0) doc.addPage();
        doc.addImage(
          imgData,
          "PNG",
          margin,
          margin - renderedHeight,
          contentWidth,
          totalImgHeight,
        );
        renderedHeight += contentHeight;
        pageNum++;
        if (pageNum > 20) break;
      }
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  }

  const { activeDates, allLabours, matrix, labourTotals, overallTotal } =
    weeklyData;

  // Common th styles
  const thStyle: React.CSSProperties = {
    padding: "9px 10px",
    border: "1px solid #999",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
    textTransform: "uppercase",
  };
  const thLeftStyle: React.CSSProperties = { ...thStyle, textAlign: "left" };
  const tdStyle: React.CSSProperties = {
    padding: "6px 8px",
    border: "1px solid #ccc",
    fontSize: "13px",
    textAlign: "center",
    fontFamily: "'Noto Sans', Arial, sans-serif",
  };
  const tdLeftStyle: React.CSSProperties = {
    ...tdStyle,
    textAlign: "left",
    textTransform: "uppercase",
  };

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
          <span className="text-gray-500 font-bold">&rarr;</span>
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
        <div
          id="report-print-area"
          className="bg-white rounded shadow p-4"
          style={{ fontFamily: "'Noto Sans', Arial, sans-serif" }}
        >
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
                {fromDate && toDate
                  ? "\u0995\u09CB\u09A8\u09CB \u09A1\u09C7\u099F\u09BE \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF"
                  : "\u09A4\u09BE\u09B0\u09BF\u0996 \u09B8\u09BF\u09B2\u09C7\u0995\u09CD\u099F \u0995\u09B0\u09C1\u09A8"}
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
                      <div
                        key={vehicleNumber}
                        className="vehicle-section"
                        style={{
                          marginBottom: "25px",
                        }}
                      >
                        <div style={{ marginBottom: "8px" }}>
                          <span
                            className="font-bold text-sm uppercase"
                            style={{
                              display: "inline-block",
                              backgroundColor: "#fffde7",
                              border: "2px solid #cccc00",
                              padding: "4px 12px",
                            }}
                          >
                            VEHICLE: {vehicleNumber}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table
                            className="w-full"
                            style={{
                              borderCollapse: "collapse",
                              width: "100%",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  backgroundColor: "#000000",
                                  color: "white",
                                }}
                              >
                                <th style={thLeftStyle}>ADDRESS</th>
                                <th style={thStyle}>QTY</th>
                                <th style={thStyle}>RATE</th>
                                {lCols.map((n) => (
                                  <th key={n} style={thStyle}>
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
                                const hasBatsItem = (r.deliverItems || []).some(
                                  (item) => item.type === "Bats",
                                );
                                const rate = hasBatsItem
                                  ? (r.batsRate ?? 0)
                                  : (r.ratePerThousand ?? 0);
                                const rowBreakdown = r.labourBreakdown || {};
                                return (
                                  <tr
                                    key={`${r.customerName}-${r.address}-${i}`}
                                    style={{
                                      backgroundColor:
                                        i % 2 === 0 ? "white" : "#f5f5f5",
                                    }}
                                  >
                                    <td style={tdLeftStyle}>
                                      {r.address || r.customerName || "-"}
                                    </td>
                                    <td style={tdStyle}>{qty}</td>
                                    <td style={tdStyle}>{rate}</td>
                                    {lCols.map((name) => {
                                      const inRow = [
                                        ...(r.loadingLabours || []),
                                        ...(r.unloadingLabours || []),
                                      ].includes(name);
                                      return (
                                        <td key={name} style={tdStyle}>
                                          {inRow
                                            ? `\u20B9${Math.round(rowBreakdown[name] || 0)}`
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
                          className="text-center font-bold text-base uppercase"
                          style={{
                            fontSize: "15px",
                            letterSpacing: "0.5px",
                            marginTop: "16px",
                            marginBottom: "16px",
                          }}
                        >
                          GRAND TOTAL &#x20B9;{grandSum}
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
                          color: "#000000",
                          textTransform: "uppercase",
                          borderTop: "2px solid #ccc",
                          paddingTop: "10px",
                          marginTop: "8px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {summaryEntries.map(([n, a]) => (
                          <span key={n}>
                            {n.toUpperCase()} &#x20B9;{Math.round(a)}
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
                ? "\u0995\u09CB\u09A8\u09CB \u09A1\u09C7\u099F\u09BE \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF"
                : "\u09A4\u09BE\u09B0\u09BF\u0996 range \u09B8\u09BF\u09B2\u09C7\u0995\u09CD\u099F \u0995\u09B0\u09C1\u09A8"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{ borderCollapse: "collapse", width: "100%" }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#000000", color: "white" }}>
                      <th style={thLeftStyle}>NAME</th>
                      {activeDates.map((d) => (
                        <th key={d} style={thStyle}>
                          {fmtDateShort(d)}
                        </th>
                      ))}
                      <th style={thStyle}>TOTAL</th>
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
                            ...tdLeftStyle,
                            fontWeight: 600,
                          }}
                        >
                          {name.toUpperCase()}
                        </td>
                        {activeDates.map((date) => {
                          const v = matrix.get(name)?.get(date);
                          return (
                            <td key={date} style={tdStyle}>
                              {v ? `\u20B9${Math.round(v)}` : "-"}
                            </td>
                          );
                        })}
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          &#x20B9;{Math.round(labourTotals.get(name) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="text-center font-bold uppercase mt-6 mb-4"
                style={{ fontSize: "15px", letterSpacing: "0.5px" }}
              >
                GRAND TOTAL &#x20B9;{Math.round(overallTotal)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
