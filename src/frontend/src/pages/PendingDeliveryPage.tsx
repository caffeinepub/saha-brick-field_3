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
import type { PendingDelivery } from "../App";

type Props = {
  deliveries: PendingDelivery[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onCompleteDelivery: (id: string) => void;
};

export default function PendingDeliveryPage({
  deliveries,
  onBack,
  onDelete,
  onCompleteDelivery,
}: Props) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm("এই pending delivery টি ডিলিট করবেন?")) {
      onDelete(id);
      toast.success("ডিলিট হয়েছে");
    }
  };

  // Show only pending (not delivered) entries
  const displayed = deliveries
    .filter((d) => d.status === "pending")
    .filter((d) => {
      const matchSearch =
        !search.trim() ||
        d.customerName.toLowerCase().includes(search.toLowerCase());
      let matchDate = true;
      if (filterActive && fromDate && toDate) {
        const date = new Date(d.pendingDate);
        matchDate = date >= new Date(fromDate) && date <= new Date(toDate);
      }
      return matchSearch && matchDate;
    });

  return (
    <div className="flex flex-col flex-1 pb-16 bg-[#edf5ed] min-h-screen">
      <header className="bg-[#1a3c2a] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="hover:opacity-70">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-extrabold uppercase tracking-widest">
            PENDING DELIVERY
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-[#2e5c40] flex items-center justify-center hover:bg-[#3a7050]"
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-[#2e5c40] flex items-center justify-center hover:bg-[#3a7050]"
          >
            <Download size={15} />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#2e5c40] flex items-center justify-center font-bold text-sm">
            {displayed.length}
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
            কোনো pending delivery নেই
          </div>
        ) : (
          displayed.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm p-4">
              {/* Top row */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-extrabold text-lg text-gray-900 leading-tight">
                      {d.customerName}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {d.address && d.address}
                    {d.address && d.invoice ? " · " : ""}
                    {d.invoice}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Red PENDING button - click to complete delivery */}
                  <button
                    type="button"
                    onClick={() => onCompleteDelivery(d.id)}
                    className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider hover:bg-red-600 transition-colors"
                  >
                    PENDING
                  </button>
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
              </div>

              {/* Location badge */}
              {d.locationType && (
                <div className="mb-3">
                  <span className="border border-purple-300 text-purple-600 text-[11px] font-bold px-3 py-1 rounded-full">
                    📍 {d.locationType.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Details box */}
              <div className="border border-gray-100 rounded-2xl p-3 bg-[#f6fbf6]">
                <div className="flex items-center gap-5 mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-red-400">📅</span>
                    <span className="font-semibold text-gray-800">
                      {d.pendingDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-blue-500">📞</span>
                    <span className="font-semibold text-blue-600">
                      {d.phone}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {d.deliverItems.map((item) => (
                      <span
                        key={item.type}
                        className="border border-gray-200 rounded-full px-3 py-1 text-[11px] font-semibold text-gray-700 bg-white"
                      >
                        {item.type}: {item.deliverQty.toLocaleString()}
                      </span>
                    ))}
                  </div>
                  {d.approxDeliveryDate && d.approxDeliveryDate !== "" && (
                    <span className="bg-red-500 text-white font-bold text-sm px-4 py-1.5 rounded-full whitespace-nowrap">
                      Due: {d.dueAmount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
