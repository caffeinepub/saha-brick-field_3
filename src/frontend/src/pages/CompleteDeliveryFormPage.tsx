import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CompleteDelivery, PendingDelivery, Vehicle } from "../App";

type Props = {
  delivery: PendingDelivery;
  vehicles: Vehicle[];
  onBack: () => void;
  onSave: (cd: Omit<CompleteDelivery, "id" | "createdAt">) => void;
};

export default function CompleteDeliveryFormPage({
  delivery,
  vehicles,
  onBack,
  onSave,
}: Props) {
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState<"Tractor" | "12 Wheel">(
    "Tractor",
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [loadingLabours, setLoadingLabours] = useState<string[]>([]);
  const [unloadingLabours, setUnloadingLabours] = useState<string[]>([]);
  const [customLoadingInput, setCustomLoadingInput] = useState("");
  const [customUnloadingInput, setCustomUnloadingInput] = useState("");
  const [ratePerThousand, setRatePerThousand] = useState("230");
  const [paymentStatus, setPaymentStatus] = useState<"not-paid" | "paid">(
    "not-paid",
  );

  const filteredVehicles = vehicles.filter((v) => v.type === vehicleType);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const v = vehicles.find((vv) => vv.id === vehicleId);
    if (v) {
      setLoadingLabours([...v.loadingLabours]);
      setUnloadingLabours([...v.unloadingLabours]);
    }
  };

  const removeLoadingLabour = (idx: number) =>
    setLoadingLabours((prev) => prev.filter((_, i) => i !== idx));
  const removeUnloadingLabour = (idx: number) =>
    setUnloadingLabours((prev) => prev.filter((_, i) => i !== idx));

  const addCustomLoading = () => {
    const name = customLoadingInput.trim();
    if (!name) return;
    setLoadingLabours((prev) => [...prev, name]);
    setCustomLoadingInput("");
  };
  const addCustomUnloading = () => {
    const name = customUnloadingInput.trim();
    if (!name) return;
    setUnloadingLabours((prev) => [...prev, name]);
    setCustomUnloadingInput("");
  };

  // Load batsRate from settings (bats100)
  const batsRate = (() => {
    try {
      const saved = localStorage.getItem("sbf_bricks_rate");
      if (saved) return Number(JSON.parse(saved).bats100) || 0;
    } catch {}
    return 0;
  })();

  const batsItem = delivery.deliverItems.find((i) => i.type === "Bats");
  const hasBats = !!batsItem;

  // Bricks qty (exclude Bats)
  const totalBricks = delivery.deliverItems
    .filter((i) => i.type !== "Bats")
    .reduce((s, i) => s + i.deliverQty, 0);

  const rate = Number(ratePerThousand) || 0;

  // Bats: (batsQty / 100) * batsRate  |  Bricks: (bricksQty / 1000) * rate
  const batsTotal = hasBats
    ? Math.round((batsItem!.deliverQty / 100) * batsRate)
    : 0;
  const bricksTotal = Math.round((totalBricks / 1000) * rate);
  const totalAmount = batsTotal + bricksTotal;
  const allLabourNames = Array.from(
    new Set([...loadingLabours, ...unloadingLabours]),
  );
  const totalLabours = allLabourNames.length;
  const loadingHalf = totalAmount / 2;
  const unloadingHalf = totalAmount / 2;
  const perLoadingLabour =
    loadingLabours.length > 0 ? loadingHalf / loadingLabours.length : 0;
  const perUnloadingLabour =
    unloadingLabours.length > 0 ? unloadingHalf / unloadingLabours.length : 0;
  const labourBreakdown: Record<string, number> = {};
  for (const name of allLabourNames) {
    const inLoading = loadingLabours.includes(name);
    const inUnloading = unloadingLabours.includes(name);
    labourBreakdown[name] =
      Math.round(
        ((inLoading ? perLoadingLabour : 0) +
          (inUnloading ? perUnloadingLabour : 0)) *
          100,
      ) / 100;
  }
  const perLabourAvg =
    totalLabours > 0 ? Math.round((totalAmount / totalLabours) * 100) / 100 : 0;

  const handleSave = () => {
    if (!selectedVehicle && filteredVehicles.length > 0) {
      toast.error("একটি vehicle number সিলেক্ট করুন");
      return;
    }
    onSave({
      pendingDeliveryId: delivery.id,
      customerName: delivery.customerName,
      address: delivery.address,
      phone: delivery.phone,
      invoice: delivery.invoice,
      locationType: delivery.locationType,
      deliveryDate: format(deliveryDate, "yyyy-MM-dd"),
      vehicleType,
      vehicleNumber: selectedVehicle?.number || "",
      loadingLabours,
      unloadingLabours,
      deliverItems: delivery.deliverItems,
      dueAmount: delivery.dueAmount,
      ratePerThousand: rate,
      totalAmount,
      totalLabours,
      perLabourAvg,
      labourBreakdown,
      paymentStatus,
    });
    toast.success("Complete Delivery সেভ হয়েছে!");
  };

  return (
    <div className="flex flex-col flex-1 pb-24 bg-[#edf5ed] min-h-screen">
      <header className="bg-[#1a3c2a] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="hover:opacity-70">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-widest">
              COMPLETE DELIVERY
            </h1>
            <p className="text-[11px] text-green-300 font-medium">
              Assign Vehicle &amp; Labour
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="w-9 h-9 rounded-full bg-[#2e5c40] flex items-center justify-center hover:bg-[#3a7050]"
        >
          <Check size={18} />
        </button>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {/* Customer Info Card */}
        <div className="bg-[#1a3c2a] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2e5c40] flex items-center justify-center font-extrabold text-lg">
                {delivery.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-extrabold text-base">
                  {delivery.customerName}
                </div>
                {delivery.address && (
                  <div className="text-[12px] text-green-300 flex items-center gap-1">
                    <span>📍</span>
                    {delivery.address}
                  </div>
                )}
              </div>
            </div>
            {delivery.locationType && (
              <span className="border border-green-400 text-green-300 text-[11px] font-bold px-3 py-1 rounded-lg">
                {delivery.locationType.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-300">📞 {delivery.phone}</span>
            {delivery.invoice && (
              <span className="text-green-300">
                Invoice: {delivery.invoice}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {delivery.deliverItems.map((item) => (
              <span
                key={item.type}
                className="bg-[#2e5c40] text-white text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {item.type}: {item.deliverQty.toLocaleString()}
              </span>
            ))}
            <span className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
              Due: {delivery.dueAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Delivery Date */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📅</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              DELIVERY DATE
            </span>
          </div>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between border border-[#c5dfc5] rounded-xl px-4 py-3 text-sm font-semibold text-[#1a3c2a] hover:border-[#1a3c2a] transition-colors bg-[#f6fbf6]"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-[#1a3c2a]" />
                  <span>{format(deliveryDate, "dd MMMM yyyy")}</span>
                </div>
                <span className="text-xs">▾</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deliveryDate}
                onSelect={(d) => {
                  if (d) {
                    setDeliveryDate(d);
                    setDateOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Vehicle Type */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚛</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              VEHICLE TYPE
            </span>
          </div>
          <div className="flex gap-3">
            {(["Tractor", "12 Wheel"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setVehicleType(type);
                  setSelectedVehicleId("");
                  setLoadingLabours([]);
                  setUnloadingLabours([]);
                }}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
                  vehicleType === type
                    ? "bg-[#1a3c2a] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Number */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔢</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              VEHICLE NUMBER
            </span>
          </div>
          {filteredVehicles.length === 0 ? (
            <p className="text-sm text-gray-400">
              Settings থেকে {vehicleType} vehicle যোগ করুন
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredVehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVehicle(v.id)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                    selectedVehicleId === v.id
                      ? "bg-[#1a3c2a] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {v.number}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Labour */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">👷</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              LOADING LABOUR
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {loadingLabours.map((name, idx) => (
              <span
                key={`ll-${idx}-${name}`}
                className="bg-[#1a3c2a] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeLoadingLabour(idx)}
                  className="ml-1 opacity-70 hover:opacity-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customLoadingInput}
              onChange={(e) => setCustomLoadingInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomLoading()}
              placeholder="লেবার নাম লিখুন..."
              className="flex-1 border border-[#c5dfc5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a3c2a] bg-[#f6fbf6]"
            />
            <button
              type="button"
              onClick={addCustomLoading}
              className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xl hover:bg-blue-600"
            >
              +
            </button>
          </div>
        </div>

        {/* Unloading Labour */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤝</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              UNLOADING LABOUR
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {unloadingLabours.map((name, idx) => (
              <span
                key={`ul-${idx}-${name}`}
                className="bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeUnloadingLabour(idx)}
                  className="ml-1 opacity-70 hover:opacity-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customUnloadingInput}
              onChange={(e) => setCustomUnloadingInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomUnloading()}
              placeholder="লেবার নাম লিখুন..."
              className="flex-1 border border-[#c5dfc5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a3c2a] bg-[#f6fbf6]"
            />
            <button
              type="button"
              onClick={addCustomUnloading}
              className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xl hover:bg-blue-600"
            >
              +
            </button>
          </div>
        </div>

        {/* Auto Calculated Amounts */}
        <div className="bg-[#eaf7ea] rounded-xl p-4 shadow-sm border border-[#c5dfc5]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧮</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              AUTO CALCULATED AMOUNTS
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                RATE (PER 1000)
              </div>
              <input
                type="number"
                value={ratePerThousand}
                onChange={(e) => setRatePerThousand(e.target.value)}
                className="text-xl font-extrabold text-gray-900 w-full text-center outline-none border-b border-dashed border-gray-300 pb-1"
              />
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                TOTAL AMOUNT
              </div>
              <div className="text-xl font-extrabold text-gray-900">
                {totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                TOTAL LABOURS
              </div>
              <div className="text-xl font-extrabold text-gray-900">
                {totalLabours}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                PER LABOUR (AVG)
              </div>
              <div className="text-xl font-extrabold text-gray-900">
                {perLabourAvg.toFixed(2)}
              </div>
            </div>
          </div>
          {allLabourNames.length > 0 && (
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                LABOUR BREAKDOWN
              </div>
              {allLabourNames.map((name, idx) => (
                <div
                  key={`lb-${idx}-${name}`}
                  className="flex justify-between text-sm py-0.5"
                >
                  <span className="text-gray-700">{name}</span>
                  <span className="font-bold text-gray-900">
                    {(labourBreakdown[name] || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💰</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#1a3c2a]">
              PAYMENT STATUS
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentStatus("not-paid")}
              className={`py-3 rounded-full font-bold text-sm transition-all ${
                paymentStatus === "not-paid"
                  ? "bg-red-500 text-white"
                  : "border-2 border-gray-200 text-gray-500 hover:border-red-300"
              }`}
            >
              Not Paid
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus("paid")}
              className={`py-3 rounded-full font-bold text-sm transition-all ${
                paymentStatus === "paid"
                  ? "bg-green-600 text-white"
                  : "border-2 border-gray-200 text-gray-500 hover:border-green-400"
              }`}
            >
              Paid Money
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#1a3c2a] text-white font-bold uppercase tracking-widest py-4 rounded-xl text-sm hover:bg-[#2a5c3a] transition-colors shadow-md flex items-center justify-center gap-3"
        >
          <Check size={18} />
          SAVE AS COMPLETE
        </button>
      </div>
    </div>
  );
}
