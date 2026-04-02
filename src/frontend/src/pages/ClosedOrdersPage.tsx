import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { useState } from "react";
import type { Order } from "../App";

type Props = {
  orders: Order[];
  onBack: () => void;
  onDelete: (id: string) => void;
};

export default function ClosedOrdersPage({ orders, onBack, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const filtered = orders.filter((o) => {
    const matchName = o.customerName
      .toLowerCase()
      .includes(search.toLowerCase());
    const orderDate = o.orderDate || "";
    const matchFrom = fromDate ? orderDate >= fromDate : true;
    const matchTo = toDate ? orderDate <= toDate : true;
    return matchName && matchFrom && matchTo;
  });

  const handleDelete = (id: string) => {
    onDelete(id);
    setConfirmDeleteId(null);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a3c2a] text-white px-4 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-extrabold uppercase tracking-widest">
            CLOSED ORDERS
          </h1>
        </div>
        <span className="w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
          {filtered.length}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="নাম দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3c2a]/30"
          />
        </div>
        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3c2a]/30"
          />
          <span className="text-gray-400 text-xs font-bold">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3c2a]/30"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="text-xs text-gray-400 hover:text-red-500 px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center text-gray-400 py-16 text-sm">
            কোনো বন্ধ অর্ডার নেই
          </div>
        ) : (
          filtered.map((order) => {
            const isOpen = expandedId === order.id;
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                {/* Summary row */}
                <button
                  type="button"
                  className="w-full text-left px-4 py-3"
                  onClick={() => toggle(order.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {order.address && <span>{order.address} · </span>}
                        <span>📅 {order.orderDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Closed
                      </span>
                      {isOpen ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      {
                        label: "TOTAL",
                        value: `₹${order.totalAmount.toLocaleString()}`,
                      },
                      {
                        label: "PAID",
                        value: `₹${order.paidAmount.toLocaleString()}`,
                      },
                      {
                        label: "BRICKS",
                        value: order.totalBricks.toLocaleString(),
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"
                      >
                        <div className="text-[9px] font-bold text-gray-400 uppercase">
                          {label}
                        </div>
                        <div className="text-xs font-extrabold text-gray-800">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </button>

                {/* Expanded history + Delete */}
                {isOpen && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    {/* Delivery History */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Truck size={12} className="text-green-600" />
                        </div>
                        <span className="text-[11px] font-extrabold text-green-700 uppercase tracking-widest">
                          Delivery History
                        </span>
                      </div>
                      <div className="border border-green-200 rounded-xl overflow-hidden bg-green-50">
                        <div className="grid grid-cols-4 gap-1 px-3 py-1.5 bg-green-100">
                          {["DATE", "TYPE", "QTY", "VEHICLE"].map((h) => (
                            <span
                              key={h}
                              className="text-[9px] font-extrabold text-green-700 uppercase"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                        {order.deliveryHistory.length === 0 ? (
                          <div className="text-center text-gray-400 py-3 text-xs">
                            কোনো ডেলিভারি নেই
                          </div>
                        ) : (
                          order.deliveryHistory.map((d) => (
                            <div
                              key={d.id}
                              className="grid grid-cols-4 gap-1 px-3 py-2 border-t border-green-100"
                            >
                              <span className="text-[11px] text-gray-700">
                                {d.date}
                              </span>
                              <span className="text-[11px] text-gray-700">
                                {d.brickType}
                              </span>
                              <span className="text-[11px] text-gray-700">
                                {d.qty.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-gray-700">
                                {d.vehicle}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Payment History */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <CreditCard size={12} className="text-red-500" />
                        </div>
                        <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-widest">
                          Payment History
                        </span>
                      </div>
                      <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50">
                        <div className="grid grid-cols-3 gap-1 px-3 py-1.5 bg-red-100">
                          {["DATE", "TIME", "AMOUNT"].map((h) => (
                            <span
                              key={h}
                              className="text-[9px] font-extrabold text-red-700 uppercase"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                        {order.paymentHistory.length === 0 ? (
                          <div className="text-center text-gray-400 py-3 text-xs">
                            কোনো পেমেন্ট নেই
                          </div>
                        ) : (
                          order.paymentHistory.map((p) => (
                            <div
                              key={p.id}
                              className="grid grid-cols-3 gap-1 px-3 py-2 border-t border-red-100"
                            >
                              <span className="text-[11px] text-gray-700">
                                {p.date}
                              </span>
                              <span className="text-[11px] text-gray-700">
                                {p.time}
                              </span>
                              <span className="text-[11px] font-bold text-red-600">
                                ₹{p.amount.toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Delete button / confirm */}
                    {confirmDeleteId === order.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-600 font-semibold flex-1">
                          নিশ্চিতভাবে ডিলিট করবেন?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                        >
                          হ্যাঁ, ডিলিট
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg"
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(order.id)}
                        className="flex items-center gap-2 justify-center w-full border border-red-300 text-red-600 text-xs font-bold py-2 rounded-xl hover:bg-red-50 transition-colors mt-1"
                      >
                        <Trash2 size={13} />
                        DELETE ORDER
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
