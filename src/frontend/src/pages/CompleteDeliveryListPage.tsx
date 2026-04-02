import {
  ArrowLeft,
  Calendar,
  Download,
  Edit2,
  Printer,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CompleteDelivery } from "../App";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Props = {
  deliveries: CompleteDelivery[];
  onBack: () => void;
  onDelete: (id: string) => void;
};

export default function CompleteDeliveryListPage({
  deliveries,
  onBack,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm("এই complete delivery টি ডিলিট করবেন?")) {
      onDelete(id);
      toast.success("ডিলিট হয়েছে");
    }
  };

  const displayed = deliveries.filter((d) => {
    const matchSearch =
      !search.trim() ||
      d.customerName.toLowerCase().includes(search.toLowerCase());
    let matchDate = true;
    if (filterActive && fromDate && toDate) {
      const date = new Date(d.deliveryDate);
      matchDate = date >= new Date(fromDate) && date <= new Date(toDate);
    }
    return matchSearch && matchDate;
  });

  function buildPrintHtml() {
    const today = new Date().toLocaleDateString("en-GB");
    let rows = "";
    for (const d of displayed) {
      const items = (d.deliverItems || [])
        .map((i) => `${i.type}: ${i.deliverQty.toLocaleString()}`)
        .join(", ");
      const labours = Array.from(
        new Set([...(d.loadingLabours || []), ...(d.unloadingLabours || [])]),
      ).join(", ");
      const dateStr = d.deliveryDate
        ? new Date(d.deliveryDate).toLocaleDateString("en-GB")
        : "-";
      rows += `<tr>
        <td>${d.customerName}</td>
        <td>${d.address || "-"}</td>
        <td>${dateStr}</td>
        <td>${d.vehicleType || "-"} ${d.vehicleNumber || ""}</td>
        <td>${items || "-"}</td>
        <td>${d.ratePerThousand || "-"}</td>
        <td>${labours || "-"}</td>
      </tr>`;
    }
    return `<html><head><title>COMPLETE DELIVERY</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap');
      body{font-family:'Noto Sans',Arial,sans-serif;margin:20px;font-size:12px;}
      h1{text-align:center;font-size:18px;font-weight:bold;margin:0;text-transform:uppercase;}
      h2{text-align:center;font-size:14px;font-weight:bold;margin:4px 0;text-transform:uppercase;}
      p.date-line{text-align:center;font-size:11px;color:#555;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th{background:#1b5e20;color:white;font-weight:bold;padding:7px 8px;text-align:left;border:1px solid #999;text-transform:uppercase;font-size:11px;}
      td{border:1px solid #bbb;padding:6px 8px;font-size:11px;vertical-align:top;}
      tr:nth-child(even) td{background:#f5f5f5;}
      @media print{@page{size:A4 landscape;margin:10mm;}}
    </style></head><body>
      <h1>S B C O BRICK FIELD</h1>
      <h2>COMPLETE DELIVERY</h2>
      <p class="date-line">Generated: ${today} &nbsp;|&nbsp; Total: ${displayed.length}</p>
      <table>
        <thead><tr>
          <th>CUSTOMER</th><th>ADDRESS</th><th>DATE</th><th>VEHICLE</th><th>ITEMS</th><th>RATE</th><th>LABOURS</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
  }

  function handlePrint() {
    const win = window.open("", "", "width=1000,height=700");
    if (!win) return;
    win.document.write(buildPrintHtml());
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  async function handleDownloadPdf() {
    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;left:-9999px;top:0;width:900px;background:white;padding:20px;font-family:Arial,sans-serif;font-size:12px;";
    const today = new Date().toLocaleDateString("en-GB");
    const rows = displayed
      .map((d) => {
        const items = (d.deliverItems || [])
          .map((i) => `${i.type}: ${i.deliverQty.toLocaleString()}`)
          .join(", ");
        const labours = Array.from(
          new Set([...(d.loadingLabours || []), ...(d.unloadingLabours || [])]),
        ).join(", ");
        const dateStr = d.deliveryDate
          ? new Date(d.deliveryDate).toLocaleDateString("en-GB")
          : "-";
        return `<tr>
        <td style="border:1px solid #bbb;padding:5px 7px;">${d.customerName}</td>
        <td style="border:1px solid #bbb;padding:5px 7px;">${d.address || "-"}</td>
        <td style="border:1px solid #bbb;padding:5px 7px;">${dateStr}</td>
        <td style="border:1px solid #bbb;padding:5px 7px;">${d.vehicleType || "-"} ${d.vehicleNumber || ""}</td>
        <td style="border:1px solid #bbb;padding:5px 7px;">${items || "-"}</td>
        <td style="border:1px solid #bbb;padding:5px 7px;text-align:center;">${d.ratePerThousand || "-"}</td>
        <td style="border:1px solid #bbb;padding:5px 7px;">${labours || "-"}</td>
      </tr>`;
      })
      .join("");
    container.innerHTML = `
      <h1 style="text-align:center;font-size:18px;font-weight:bold;margin:0;text-transform:uppercase;">S B C O BRICK FIELD</h1>
      <h2 style="text-align:center;font-size:14px;font-weight:bold;margin:4px 0 2px;text-transform:uppercase;">COMPLETE DELIVERY</h2>
      <p style="text-align:center;font-size:11px;color:#555;margin-bottom:14px;">Generated: ${today} | Total: ${displayed.length}</p>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="background:#1b5e20;color:white;">
          <th style="border:1px solid #999;padding:7px 8px;text-align:left;">CUSTOMER</th>
          <th style="border:1px solid #999;padding:7px 8px;text-align:left;">ADDRESS</th>
          <th style="border:1px solid #999;padding:7px 8px;text-align:left;">DATE</th>
          <th style="border:1px solid #999;padding:7px 8px;text-align:left;">VEHICLE</th>
          <th style="border:1px solid #999;padding:7px 8px;text-align:left;">ITEMS</th>
          <th style="border:1px solid #999;padding:7px 8px;text-align:center;">RATE</th>
          <th style="border:1px solid #999;padding:7px 8px;text-align:left;">LABOURS</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    document.body.removeChild(container);
    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "landscape",
    });
    const margin = 10;
    const pageWidth = 297;
    const pageHeight = 210;
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
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`complete-delivery-${dateStr}.pdf`);
  }

  return (
    <div className="flex flex-col flex-1 pb-16 bg-[#edf5ed] min-h-screen">
      <header className="bg-[#1a3c2a] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="hover:opacity-70">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-extrabold uppercase tracking-widest">
            COMPLETE DELIVERY
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="w-8 h-8 rounded-full bg-[#2e5c40] flex items-center justify-center hover:bg-[#3a7050]"
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-8 h-8 rounded-full bg-[#2e5c40] flex items-center justify-center hover:bg-[#3a7050]"
          >
            <Download size={15} />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#2e5c40] flex items-center justify-center font-bold text-sm">
            {deliveries.length}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-3">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name..."
            className="w-full border-0 outline-none text-sm py-3 px-4 text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
          <span className="text-[11px] font-bold tracking-widest text-gray-600 uppercase">
            FILTER BY DATE
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">
                FROM
              </span>
              <div className="flex items-center border border-[#c5dfc5] rounded-xl px-3 py-2 gap-2 bg-[#f6fbf6]">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-xs flex-1 outline-none bg-transparent"
                />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">
                TO
              </span>
              <div className="flex items-center border border-[#c5dfc5] rounded-xl px-3 py-2 gap-2 bg-[#f6fbf6]">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-xs flex-1 outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterActive(true)}
            className="bg-[#1a3c2a] text-white font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl mt-1"
          >
            APPLY FILTER
          </button>
        </div>

        {/* List */}
        {displayed.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white rounded-xl">
            কোনো complete delivery নেই
          </div>
        ) : (
          displayed.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm p-4">
              {/* Top row */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-extrabold text-lg text-gray-900 leading-tight">
                    {d.customerName}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="bg-[#1a3c2a] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {d.locationType?.toUpperCase() || "LOCAL"}
                    </span>
                    {d.invoice && (
                      <span className="border border-purple-300 text-purple-600 text-[11px] font-bold px-3 py-1 rounded-full">
                        INV #{d.invoice}
                      </span>
                    )}
                  </div>
                  {d.address && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <span>📍</span>
                      <span>{d.address}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-50 bg-white shadow-sm"
                  >
                    <Edit2 size={14} className="text-blue-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 bg-white shadow-sm"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>

              {/* Info row */}
              <div className="bg-[#f6fbf6] border border-gray-100 rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 text-xs mb-3">
                {d.invoice && (
                  <span className="text-gray-500">#{d.invoice}</span>
                )}
                {d.invoice && <span className="text-gray-300">·</span>}
                <span className="font-semibold text-gray-700">
                  {d.vehicleType} {d.vehicleNumber}
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-gray-600">
                  <span>📅</span>
                  {d.deliveryDate
                    ? new Date(d.deliveryDate)
                        .toLocaleDateString("en-GB")
                        .replace(/\//g, "/")
                    : ""}
                </span>
                <span className="text-gray-300">·</span>
                <span className="bg-[#1a3c2a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {d.locationType?.toUpperCase() || "LOCAL"}
                </span>
              </div>

              {/* Labour tags */}
              {(d.loadingLabours.length > 0 ||
                (d.unloadingLabours || []).length > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Array.from(
                    new Set([
                      ...d.loadingLabours,
                      ...(d.unloadingLabours || []),
                    ]),
                  ).map((name, idx) => (
                    <span
                      key={`lb-${d.id}-${idx}`}
                      className="border border-gray-300 rounded-full px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    BRICKS
                  </div>
                  <div className="font-extrabold text-gray-900">
                    {d.deliverItems
                      .reduce((s, i) => s + i.deliverQty, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    RATE
                  </div>
                  <div className="font-extrabold text-gray-900">
                    {d.ratePerThousand}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    PER LABOR
                  </div>
                  <div className="font-extrabold text-gray-900 text-xs">
                    {d.labourBreakdown &&
                    Object.keys(d.labourBreakdown).length > 0
                      ? Object.entries(d.labourBreakdown).map(([n, v]) => (
                          <div key={n}>
                            {n}: {(v as number).toFixed(2)}
                          </div>
                        ))
                      : d.perLabourAvg.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
