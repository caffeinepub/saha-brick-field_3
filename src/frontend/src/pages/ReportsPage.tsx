import jsPDF from "jspdf";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useState } from "react";
import type { CompleteDelivery } from "../App";

type Props = {
  completeDeliveries: CompleteDelivery[];
  onBack: () => void;
};

function formatDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB");
}

function isBetween(dateStr: string, from: string, to: string) {
  const d = new Date(dateStr);
  const f = from ? new Date(from) : null;
  const t = to ? new Date(to) : null;
  if (f && d < f) return false;
  if (t && d > t) return false;
  return true;
}

function getWeekStart(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function groupByVehicle(deliveries: CompleteDelivery[]) {
  const map: Record<string, CompleteDelivery[]> = {};
  for (const d of deliveries) {
    const key = `${d.vehicleType} - ${d.vehicleNumber}`;
    if (!map[key]) map[key] = [];
    map[key].push(d);
  }
  return map;
}

function collectLabourNames(deliveries: CompleteDelivery[]) {
  const names = new Set<string>();
  for (const d of deliveries) {
    for (const n of d.loadingLabours) names.add(n);
    for (const n of d.unloadingLabours) names.add(n);
  }
  return Array.from(names);
}

function calcLabourShare(deliveries: CompleteDelivery[], labourName: string) {
  let total = 0;
  for (const d of deliveries) {
    const allLabours = [...d.loadingLabours, ...d.unloadingLabours];
    if (allLabours.includes(labourName)) {
      total += d.perLabourAvg;
    }
  }
  return total;
}

interface ReportRow {
  address: string;
  qty: number;
  rate: number;
  labourAmounts: Record<string, number>;
  total: number;
}

function buildRows(
  deliveries: CompleteDelivery[],
  labourNames: string[],
): ReportRow[] {
  return deliveries.map((d) => {
    const qty = d.deliverItems.reduce((s, i) => s + i.deliverQty, 0);
    const labourAmounts: Record<string, number> = {};
    for (const name of labourNames) {
      const allLabours = [...d.loadingLabours, ...d.unloadingLabours];
      labourAmounts[name] = allLabours.includes(name) ? d.perLabourAvg : 0;
    }
    return {
      address: d.address,
      qty,
      rate: d.ratePerThousand,
      labourAmounts,
      total: d.totalAmount,
    };
  });
}

function buildDailyPdfHtml(
  dateLabel: string,
  groupedData: Record<string, CompleteDelivery[]>,
  allLabourNames: string[],
) {
  let body = "";
  let grandTotal = 0;
  const labourTotals: Record<string, number> = {};
  for (const n of allLabourNames) labourTotals[n] = 0;

  const headerCols = ["ADDRESS", "QUANTITY", "RATE", ...allLabourNames]
    .map(
      (h) =>
        `<th style="background:#1a5c2a;color:#fff;font-weight:bold;padding:8px;border:1px solid #000;text-align:center;font-size:13px">${h}</th>`,
    )
    .join("");

  for (const [vehicleKey, deliveries] of Object.entries(groupedData)) {
    const rows = buildRows(deliveries, allLabourNames);
    body += `<div style="background:#fffacd;padding:8px 10px;margin:10px 0 4px 0;font-weight:bold;font-size:13px;border:1px solid #ccc">VEHICLE: ${vehicleKey}</div>`;
    body += `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:6px"><thead><tr>${headerCols}</tr></thead><tbody>`;
    rows.forEach((row, idx) => {
      const bg = idx % 2 === 0 ? "#fff" : "#f3f8f3";
      grandTotal += row.total;
      let cols = `<td style="padding:8px;border:1px solid #000;text-align:left;background:${bg}">${row.address}</td>`;
      cols += `<td style="padding:8px;border:1px solid #000;text-align:center;background:${bg}">${row.qty}</td>`;
      cols += `<td style="padding:8px;border:1px solid #000;text-align:center;background:${bg}">${row.rate}</td>`;
      for (const name of allLabourNames) {
        const amt = row.labourAmounts[name] ?? 0;
        labourTotals[name] = (labourTotals[name] ?? 0) + amt;
        cols += `<td style="padding:8px;border:1px solid #000;text-align:center;background:${bg}">${amt > 0 ? `\u20b9${amt.toFixed(0)}` : "-"}</td>`;
      }
      body += `<tr>${cols}</tr>`;
    });
    body += "</tbody></table>";
  }

  const labourSummary = allLabourNames
    .map((n) => `${n} \u20b9${(labourTotals[n] ?? 0).toFixed(0)}`)
    .join(" | ");

  return `<div style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:16px">
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:18px;font-weight:bold">S B C O BRICK FIELD</div>
      <div style="font-size:15px;font-weight:bold;margin-top:2px">DAILY LABOURS REPORT</div>
      <div style="font-size:12px;color:#555;margin-top:2px">${dateLabel}</div>
    </div>
    ${body}
    <div style="text-align:center;font-size:15px;font-weight:bold;margin:12px 0 6px">GRAND TOTAL \u20b9${grandTotal.toLocaleString("en-IN")}</div>
    <div style="font-size:12px;font-weight:600;text-align:center;color:#333">${labourSummary}</div>
  </div>`;
}

function buildWeeklyPdfHtml(
  weekLabel: string,
  deliveries: CompleteDelivery[],
  allLabourNames: string[],
) {
  const rows = buildRows(deliveries, allLabourNames);
  let grandTotal = 0;
  const labourTotals: Record<string, number> = {};
  for (const n of allLabourNames) labourTotals[n] = 0;

  const headerCols = ["NAME", "ADDRESS", "QUANTITY", "RATE", ...allLabourNames]
    .map(
      (h) =>
        `<th style="background:#1a5c2a;color:#fff;font-weight:bold;padding:8px;border:1px solid #000;text-align:center;font-size:13px">${h}</th>`,
    )
    .join("");

  let tableRows = "";
  deliveries.forEach((d, idx) => {
    const row = rows[idx];
    const bg = idx % 2 === 0 ? "#fff" : "#f3f8f3";
    grandTotal += row.total;
    let cols = `<td style="padding:8px;border:1px solid #000;text-align:left;background:${bg}">${d.customerName}</td>`;
    cols += `<td style="padding:8px;border:1px solid #000;text-align:left;background:${bg}">${row.address}</td>`;
    cols += `<td style="padding:8px;border:1px solid #000;text-align:center;background:${bg}">${row.qty}</td>`;
    cols += `<td style="padding:8px;border:1px solid #000;text-align:center;background:${bg}">${row.rate}</td>`;
    for (const name of allLabourNames) {
      const amt = row.labourAmounts[name] ?? 0;
      labourTotals[name] = (labourTotals[name] ?? 0) + amt;
      cols += `<td style="padding:8px;border:1px solid #000;text-align:center;background:${bg}">${amt > 0 ? `\u20b9${amt.toFixed(0)}` : "-"}</td>`;
    }
    tableRows += `<tr>${cols}</tr>`;
  });

  const labourSummary = allLabourNames
    .map((n) => `${n} \u20b9${(labourTotals[n] ?? 0).toFixed(0)}`)
    .join(" | ");

  return `<div style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:16px">
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:18px;font-weight:bold">S B C O BRICK FIELD</div>
      <div style="font-size:15px;font-weight:bold;margin-top:2px">WEEKLY LABOURS REPORT</div>
      <div style="font-size:12px;color:#555;margin-top:2px">${weekLabel}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:6px">
      <thead><tr>${headerCols}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div style="text-align:center;font-size:15px;font-weight:bold;margin:12px 0 6px">GRAND TOTAL \u20b9${grandTotal.toLocaleString("en-IN")}</div>
    <div style="font-size:12px;font-weight:600;text-align:center;color:#333">${labourSummary}</div>
  </div>`;
}

function downloadPdf(htmlContent: string, filename: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.html(htmlContent, {
    callback: (d) => d.save(filename),
    x: 5,
    y: 5,
    width: 287,
    windowWidth: 900,
  });
}

function printHtml(htmlContent: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<html><head><title>Report</title><style>body{margin:0;padding:0}@media print{body{margin:0}}</style></head><body>${htmlContent}</body></html>`,
  );
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
}

export default function ReportsPage({ completeDeliveries, onBack }: Props) {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  const sortedDates = completeDeliveries
    .map((d) => d.deliveryDate)
    .filter(Boolean)
    .sort();
  const firstDate =
    sortedDates.length > 0 ? new Date(sortedDates[0]) : new Date();
  const weekStart = getWeekStart(
    new Date(firstDate.getTime() + weekOffset * 7 * 24 * 3600 * 1000),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const dailyDeliveries = completeDeliveries.filter((d) =>
    isBetween(d.deliveryDate, fromDate, toDate),
  );
  const dailyGrouped = groupByVehicle(dailyDeliveries);
  const dailyLabourNames = collectLabourNames(dailyDeliveries);

  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  const weeklyDeliveries = completeDeliveries.filter((d) =>
    isBetween(d.deliveryDate, weekStartStr, weekEndStr),
  );
  const weeklyLabourNames = collectLabourNames(weeklyDeliveries);

  const dailyDateLabel =
    fromDate || toDate
      ? `${fromDate ? formatDate(fromDate) : ""} - ${toDate ? formatDate(toDate) : ""}`
      : "All Dates";
  const weeklyLabel = `${formatDate(weekStartStr)} - ${formatDate(weekEndStr)}`;

  function renderDailyTable() {
    if (dailyDeliveries.length === 0)
      return (
        <div className="text-center text-gray-400 py-8">
          No data found for selected dates
        </div>
      );
    return (
      <div>
        {Object.entries(dailyGrouped).map(([vehicleKey, vehicleDeliveries]) => {
          const rows = buildRows(vehicleDeliveries, dailyLabourNames);
          return (
            <div key={vehicleKey} className="mb-4">
              <div className="bg-yellow-100 px-3 py-2 font-bold text-sm border border-gray-300 mb-1">
                VEHICLE: {vehicleKey}
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800">
                      ADDRESS
                    </th>
                    <th className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800">
                      QTY
                    </th>
                    <th className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800">
                      RATE
                    </th>
                    {dailyLabourNames.map((n) => (
                      <th
                        key={n}
                        className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800"
                      >
                        {n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static order
                    <tr
                      key={`${row.address}-${idx}`}
                      className={idx % 2 === 0 ? "bg-white" : "bg-green-50"}
                    >
                      <td className="px-2 py-1 border border-gray-300 text-left">
                        {row.address}
                      </td>
                      <td className="px-2 py-1 border border-gray-300 text-center">
                        {row.qty}
                      </td>
                      <td className="px-2 py-1 border border-gray-300 text-center">
                        {row.rate}
                      </td>
                      {dailyLabourNames.map((name) => (
                        <td
                          key={name}
                          className="px-2 py-1 border border-gray-300 text-center"
                        >
                          {(row.labourAmounts[name] ?? 0) > 0
                            ? `₹${(row.labourAmounts[name] ?? 0).toFixed(0)}`
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        <div className="text-center font-bold text-base mt-3">
          GRAND TOTAL ₹
          {dailyDeliveries
            .reduce((s, d) => s + d.totalAmount, 0)
            .toLocaleString("en-IN")}
        </div>
        <div className="text-center text-xs font-semibold mt-2 text-gray-600">
          {dailyLabourNames
            .map(
              (n) => `${n} ₹${calcLabourShare(dailyDeliveries, n).toFixed(0)}`,
            )
            .join(" | ")}
        </div>
      </div>
    );
  }

  function renderWeeklyTable() {
    if (weeklyDeliveries.length === 0)
      return (
        <div className="text-center text-gray-400 py-8">
          No data for this week
        </div>
      );
    const rows = buildRows(weeklyDeliveries, weeklyLabourNames);
    return (
      <div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800">
                NAME
              </th>
              <th className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800">
                ADDRESS
              </th>
              <th className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800">
                QTY
              </th>
              <th className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800">
                RATE
              </th>
              {weeklyLabourNames.map((n) => (
                <th
                  key={n}
                  className="bg-green-800 text-white font-bold px-2 py-2 border border-gray-800"
                >
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeklyDeliveries.map((d, idx) => {
              const row = rows[idx];
              return (
                <tr
                  key={d.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-green-50"}
                >
                  <td className="px-2 py-1 border border-gray-300">
                    {d.customerName}
                  </td>
                  <td className="px-2 py-1 border border-gray-300">
                    {row.address}
                  </td>
                  <td className="px-2 py-1 border border-gray-300 text-center">
                    {row.qty}
                  </td>
                  <td className="px-2 py-1 border border-gray-300 text-center">
                    {row.rate}
                  </td>
                  {weeklyLabourNames.map((name) => (
                    <td
                      key={name}
                      className="px-2 py-1 border border-gray-300 text-center"
                    >
                      {(row.labourAmounts[name] ?? 0) > 0
                        ? `₹${(row.labourAmounts[name] ?? 0).toFixed(0)}`
                        : "-"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-center font-bold text-base mt-3">
          GRAND TOTAL ₹
          {weeklyDeliveries
            .reduce((s, d) => s + d.totalAmount, 0)
            .toLocaleString("en-IN")}
        </div>
        <div className="text-center text-xs font-semibold mt-2 text-gray-600">
          {weeklyLabourNames
            .map(
              (n) => `${n} ₹${calcLabourShare(weeklyDeliveries, n).toFixed(0)}`,
            )
            .join(" | ")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-16">
      <div className="sticky top-0 z-10 bg-[oklch(0.25_0.08_145)] text-white px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <span className="font-bold text-base flex-1">REPORTS</span>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            tab === "daily"
              ? "border-b-2 border-green-700 text-green-800"
              : "text-gray-500"
          }`}
          onClick={() => setTab("daily")}
        >
          Daily Report
        </button>
        <button
          type="button"
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            tab === "weekly"
              ? "border-b-2 border-green-700 text-green-800"
              : "text-gray-500"
          }`}
          onClick={() => setTab("weekly")}
        >
          Weekly Report
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {tab === "daily" && (
          <div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-semibold mb-1">
                  FROM
                </div>
                <input
                  id="daily-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-semibold mb-1">
                  TO
                </div>
                <input
                  id="daily-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1 bg-green-700 text-white py-2 rounded font-bold text-sm"
                onClick={() =>
                  printHtml(
                    buildDailyPdfHtml(
                      dailyDateLabel,
                      dailyGrouped,
                      dailyLabourNames,
                    ),
                  )
                }
              >
                <Printer size={16} /> Print
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1 bg-blue-700 text-white py-2 rounded font-bold text-sm"
                onClick={() =>
                  downloadPdf(
                    buildDailyPdfHtml(
                      dailyDateLabel,
                      dailyGrouped,
                      dailyLabourNames,
                    ),
                    `daily-report-${fromDate || "all"}.pdf`,
                  )
                }
              >
                <Download size={16} /> PDF Download
              </button>
            </div>
            <div className="text-center mb-3">
              <div className="font-bold text-base">S B C O BRICK FIELD</div>
              <div className="font-bold text-sm">DAILY LABOURS REPORT</div>
              <div className="text-xs text-gray-500">{dailyDateLabel}</div>
            </div>
            {renderDailyTable()}
          </div>
        )}

        {tab === "weekly" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                className="px-3 py-1 bg-gray-200 rounded font-bold text-sm"
                onClick={() => setWeekOffset((o) => o - 1)}
              >
                &#9664; Prev
              </button>
              <span className="text-sm font-bold">{weeklyLabel}</span>
              <button
                type="button"
                className="px-3 py-1 bg-gray-200 rounded font-bold text-sm"
                onClick={() => setWeekOffset((o) => o + 1)}
              >
                Next &#9654;
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1 bg-green-700 text-white py-2 rounded font-bold text-sm"
                onClick={() =>
                  printHtml(
                    buildWeeklyPdfHtml(
                      weeklyLabel,
                      weeklyDeliveries,
                      weeklyLabourNames,
                    ),
                  )
                }
              >
                <Printer size={16} /> Print
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1 bg-blue-700 text-white py-2 rounded font-bold text-sm"
                onClick={() =>
                  downloadPdf(
                    buildWeeklyPdfHtml(
                      weeklyLabel,
                      weeklyDeliveries,
                      weeklyLabourNames,
                    ),
                    `weekly-report-${weeklyLabel.replace(/\//g, "-")}.pdf`,
                  )
                }
              >
                <Download size={16} /> PDF Download
              </button>
            </div>
            <div className="text-center mb-3">
              <div className="font-bold text-base">S B C O BRICK FIELD</div>
              <div className="font-bold text-sm">WEEKLY LABOURS REPORT</div>
              <div className="text-xs text-gray-500">{weeklyLabel}</div>
            </div>
            {renderWeeklyTable()}
          </div>
        )}
      </div>
    </div>
  );
}
