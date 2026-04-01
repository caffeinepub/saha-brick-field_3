import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order, PendingDelivery } from "../App";

type Props = {
  order: Order;
  onBack: () => void;
  onSave: (delivery: Omit<PendingDelivery, "id" | "createdAt">) => void;
};

export default function PendingOrderPage({ order, onBack, onSave }: Props) {
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false);

  // Compute already delivered qty per brick type
  const deliveredQty: Record<string, number> = {};
  for (const rec of order.deliveryHistory) {
    deliveredQty[rec.brickType] = (deliveredQty[rec.brickType] || 0) + rec.qty;
  }

  // Compute remaining brick items (exclude fully delivered)
  const remainingItems = order.brickItems
    .map((b) => ({
      ...b,
      remaining: b.quantity - (deliveredQty[b.type] || 0),
    }))
    .filter((b) => b.remaining > 0);

  const [deliverQtys, setDeliverQtys] = useState<Record<string, string>>(
    Object.fromEntries(remainingItems.map((b) => [b.type, ""])),
  );
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>(
    Object.fromEntries(remainingItems.map((b) => [b.type, true])),
  );

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const totalDueBricks = remainingItems
    .filter((b) => b.type !== "Bats")
    .reduce((s, b) => s + b.remaining, 0);
  const dueBats = remainingItems.find((b) => b.type === "Bats")?.remaining || 0;

  const handleSave = () => {
    const items = remainingItems
      .filter((b) => selectedTypes[b.type])
      .map((b) => ({
        type: b.type,
        maxQty: b.remaining,
        deliverQty: Number(deliverQtys[b.type]) || 0,
      }))
      .filter((b) => b.deliverQty > 0);

    if (items.length === 0) {
      toast.error("কমপক্ষে একটি brick type-এর quantity দিন");
      return;
    }

    // Read rate from settings to carry forward into the pending delivery
    const savedRate = (() => {
      try {
        const hasBats = items.some((i) => i.type === "Bats");
        if (hasBats) {
          const raw = localStorage.getItem("sbf_bricks_rate");
          if (raw) return Number(JSON.parse(raw).bats100) || 0;
        } else {
          const raw = localStorage.getItem("sbf_rate");
          if (raw) {
            const parsed = JSON.parse(raw);
            const isLocal = order.locationType === "Local";
            return Number(isLocal ? parsed.local : parsed.outside) || 0;
          }
        }
      } catch {}
      return 0;
    })();

    onSave({
      orderId: order.id,
      customerName: order.customerName,
      address: order.address,
      phone: order.phone,
      invoice: order.invoice,
      locationType: order.locationType,
      pendingDate: format(pendingDate, "yyyy-MM-dd"),
      deliverItems: items.map((b) => ({
        type: b.type,
        deliverQty: b.deliverQty,
      })),
      dueAmount: order.dueAmount,
      rate: savedRate,
      status: "pending",
    });
    toast.success("Pending delivery যোগ হয়েছে!");
    // Navigation is handled by onSave in App.tsx (goes to pending-delivery page)
  };

  return (
    <div className="flex flex-col flex-1 pb-20 bg-[#edf5ed] min-h-screen">
      <header className="bg-[#1a3c2a] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="hover:opacity-70">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-extrabold uppercase tracking-widest">
            PENDING ORDER
          </h1>
        </div>
        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
          PENDING
        </span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {/* Pending Date */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-[#1a3c2a]" />
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              PENDING DATE
            </span>
          </div>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 border border-[#c5dfc5] rounded-full px-4 py-1.5 text-sm font-semibold text-[#1a3c2a] hover:border-[#1a3c2a] transition-colors"
              >
                {format(pendingDate, "dd/MM/yyyy")}
                <span className="text-xs">▾</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={pendingDate}
                onSelect={(d) => {
                  if (d) {
                    setPendingDate(d);
                    setDateOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-extrabold text-sm uppercase tracking-widest text-gray-800 mb-3">
            CUSTOMER INFORMATION
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                NAME
              </span>
              <div className="border border-[#c5dfc5] rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 bg-[#f6fbf6]">
                {order.customerName}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                ADDRESS
              </span>
              <div className="border border-[#c5dfc5] rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 bg-[#f6fbf6]">
                {order.address || "-"}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                PHONE
              </span>
              <div className="border border-[#c5dfc5] rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 bg-[#f6fbf6]">
                {order.phone}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                INVOICE
              </span>
              <div className="border border-[#c5dfc5] rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 bg-[#f6fbf6]">
                {order.invoice || "-"}
              </div>
            </div>
          </div>

          {/* Due Summary */}
          <div className="border border-[#c5dfc5] rounded-xl px-4 py-3 bg-[#f6fbf6] flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                DUE BRICKS
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {totalDueBricks.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {remainingItems
                  .filter((b) => b.type !== "Bats")
                  .map((b) => `${b.type}: ${b.remaining.toLocaleString()}`)
                  .join(" · ")}
              </div>
            </div>
            {dueBats > 0 && (
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  DUE BATS
                </div>
                <div className="text-2xl font-extrabold text-orange-500">
                  {dueBats}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Safety Bats</div>
              </div>
            )}
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                DUE AMOUNT
              </div>
              <div className="mt-1 bg-red-500 text-white font-extrabold text-base px-4 py-2 rounded-full text-center">
                {order.dueAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Brick Types */}
        {remainingItems.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-extrabold text-sm uppercase tracking-widest text-gray-800 mb-3">
              BRICK TYPES
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {remainingItems.map((b) => {
                const isBats = b.type === "Bats";
                const isSelected = selectedTypes[b.type];
                return (
                  <div
                    key={b.type}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      isBats
                        ? "border-orange-400 bg-[#fff8ee]"
                        : isSelected
                          ? "border-[#1a3c2a] bg-white"
                          : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleType(b.type)}
                      className="flex items-center justify-between mb-2 w-full text-left"
                    >
                      <span
                        className={`font-extrabold text-sm ${
                          isBats ? "text-orange-500" : "text-gray-900"
                        }`}
                      >
                        {b.type}
                      </span>
                      {isBats ? (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          DUE: {b.remaining}
                        </span>
                      ) : (
                        isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#1a3c2a] flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </span>
                        )
                      )}
                    </button>
                    {isBats ? (
                      <div className="text-xs text-orange-400 mb-2">
                        Safety Bats
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 mb-1">
                        Deliver Qty (max: {b.remaining.toLocaleString()})
                      </div>
                    )}
                    {!isBats && (
                      <div className="text-[10px] text-gray-400 mb-1">
                        Deliver Qty
                      </div>
                    )}
                    <input
                      type="number"
                      min={0}
                      max={b.remaining}
                      value={deliverQtys[b.type]}
                      onChange={(e) =>
                        setDeliverQtys((prev) => ({
                          ...prev,
                          [b.type]: e.target.value,
                        }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      placeholder="0"
                      className={`w-full border rounded-lg px-3 py-2 text-center text-sm font-semibold outline-none ${
                        isBats
                          ? "border-orange-300 bg-white focus:border-orange-500"
                          : "border-[#c5dfc5] bg-[#f6fbf6] focus:border-[#1a3c2a]"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {remainingItems.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            সব brick delivery সম্পন্ন হয়েছে
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#1a3c2a] text-white font-bold uppercase tracking-widest py-4 rounded-xl text-sm hover:bg-[#2a5c3a] transition-colors shadow-md flex items-center justify-center gap-3"
        >
          <Truck size={18} />
          PENDING ডেলিভারি যোগ করন
        </button>
      </div>
    </div>
  );
}
