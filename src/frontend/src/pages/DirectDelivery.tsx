import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CompleteDelivery, Vehicle } from "../App";

type Props = {
  onBack: () => void;
  vehicles: Vehicle[];
  onSave: (cd: Omit<CompleteDelivery, "id" | "createdAt">) => void;
};

const BRICK_TYPES = [
  "1 No Bricks",
  "2 No Bricks",
  "3 No Bricks",
  "1 No Picket",
  "2 No Picket",
  "Crack",
  "Goria",
  "Bats",
];

const labelStyle =
  "font-semibold text-[oklch(0.25_0.08_145)] uppercase text-xs tracking-wider";

const inputStyle = "border-border focus-visible:ring-[oklch(0.45_0.1_145)]";

export default function DirectDelivery({ onBack, vehicles, onSave }: Props) {
  const [date, setDate] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [invoice, setInvoice] = useState("");

  // Brick types: selected set
  const [selectedBricks, setSelectedBricks] = useState<Set<string>>(new Set());
  const [brickQty, setBrickQty] = useState<Record<string, string>>({});
  const [batsSafetyQty, setBatsSafetyQty] = useState("");

  // Location type
  const [locationType, setLocationType] = useState<"Local" | "Outside">(
    "Local",
  );

  // Vehicle flow
  const [vehicleType, setVehicleType] = useState<"Tractor" | "12 Wheel">(
    "Tractor",
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loadingLabours, setLoadingLabours] = useState<string[]>([]);
  const [unloadingLabours, setUnloadingLabours] = useState<string[]>([]);
  const [loadingInput, setLoadingInput] = useState("");
  const [unloadingInput, setUnloadingInput] = useState("");

  // Payment status
  const [paymentStatus, setPaymentStatus] = useState<"not-paid" | "paid">(
    "not-paid",
  );

  // Filter vehicles by type
  const filteredVehicles = vehicles.filter((v) => v.type === vehicleType);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // When vehicle selected, auto-load labours
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (selectedVehicle) {
      setLoadingLabours([...selectedVehicle.loadingLabours]);
      setUnloadingLabours([...selectedVehicle.unloadingLabours]);
    } else {
      setLoadingLabours([]);
      setUnloadingLabours([]);
    }
  }, [selectedVehicleId]);

  // Reset vehicle selection when type changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    setSelectedVehicleId("");
    setLoadingLabours([]);
    setUnloadingLabours([]);
  }, [vehicleType]);

  // Toggle brick type selection
  const toggleBrick = (type: string) => {
    setSelectedBricks((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
        // Clear qty
        setBrickQty((q) => {
          const n = { ...q };
          delete n[type];
          return n;
        });
        if (type === "Bats") setBatsSafetyQty("");
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Totals
  const totalBricks = BRICK_TYPES.filter(
    (t) => t !== "Bats" && selectedBricks.has(t),
  ).reduce((sum, t) => sum + (Number(brickQty[t]) || 0), 0);

  const totalBatsSafety = selectedBricks.has("Bats")
    ? (Number(brickQty.Bats) || 0) + (Number(batsSafetyQty) || 0)
    : 0;

  // Labour helpers
  const addLoadingLabour = () => {
    const trimmed = loadingInput.trim();
    if (!trimmed) return;
    setLoadingLabours((prev) => [...prev, trimmed]);
    setLoadingInput("");
  };
  const addUnloadingLabour = () => {
    const trimmed = unloadingInput.trim();
    if (!trimmed) return;
    setUnloadingLabours((prev) => [...prev, trimmed]);
    setUnloadingInput("");
  };
  const removeLoadingLabour = (i: number) =>
    setLoadingLabours((prev) => prev.filter((_, idx) => idx !== i));
  const removeUnloadingLabour = (i: number) =>
    setUnloadingLabours((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (selectedBricks.size === 0) {
      toast.error("Select at least one brick type");
      return;
    }

    // Load rate from settings
    let ratePerThousand = 0;
    let batsRate = 0;
    try {
      const savedRate = localStorage.getItem("sbf_rate");
      if (savedRate) {
        const rates = JSON.parse(savedRate);
        if (vehicleType === "Tractor") {
          const tr = rates.tractorRate || {};
          ratePerThousand =
            locationType === "Outside"
              ? Number(tr.outsidePerThousand || 0)
              : Number(tr.localPerThousand || 0);
          batsRate = Number(tr.batsRate || rates.batsRate || 0);
        } else {
          const wr = rates.wheelRate || {};
          ratePerThousand = Number(wr.perThousand || 0);
          batsRate = Number(wr.batsRate || rates.batsRate || 0);
        }
      }
    } catch {}

    // Build deliverItems in CompleteDelivery format
    const deliverItems = Array.from(selectedBricks).map((type) => ({
      type,
      deliverQty: Number(brickQty[type]) || 0,
    }));

    // Calculate totalAmount
    const isOnlyBats =
      deliverItems.length > 0 && deliverItems.every((i) => i.type === "Bats");
    let totalAmount = 0;
    if (isOnlyBats) {
      const batsQty =
        deliverItems.find((i) => i.type === "Bats")?.deliverQty || 0;
      totalAmount = (batsQty / 100) * batsRate;
    } else {
      totalAmount = deliverItems
        .filter((i) => i.type !== "Bats")
        .reduce((sum, i) => sum + (i.deliverQty / 1000) * ratePerThousand, 0);
    }

    // Labour calculation
    const allLabours = Array.from(
      new Set([...loadingLabours, ...unloadingLabours]),
    );
    const totalLabours = allLabours.length;
    const halfTotal = totalAmount / 2;
    const perLoadingLabour =
      loadingLabours.length > 0 ? halfTotal / loadingLabours.length : 0;
    const perUnloadingLabour =
      unloadingLabours.length > 0 ? halfTotal / unloadingLabours.length : 0;
    const labourBreakdown: Record<string, number> = {};
    for (const name of allLabours) {
      let amount = 0;
      if (loadingLabours.includes(name)) amount += perLoadingLabour;
      if (unloadingLabours.includes(name)) amount += perUnloadingLabour;
      labourBreakdown[name] = amount;
    }
    const perLabourAvg = totalLabours > 0 ? totalAmount / totalLabours : 0;

    const cd: Omit<CompleteDelivery, "id" | "createdAt"> = {
      pendingDeliveryId: `direct-${Date.now()}`,
      customerName: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      invoice: invoice.trim(),
      locationType,
      deliveryDate: format(date, "yyyy-MM-dd"),
      vehicleType,
      vehicleNumber: selectedVehicle?.number || "",
      loadingLabours,
      unloadingLabours,
      deliverItems,
      dueAmount: 0,
      ratePerThousand,
      batsRate,
      totalAmount,
      totalLabours,
      perLabourAvg,
      labourBreakdown,
      paymentStatus,
    };

    onSave(cd);
    toast.success("Direct delivery saved successfully");
    onBack();
  };

  return (
    <div className="flex flex-col flex-1 pb-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-[oklch(0.25_0.08_145)] text-white px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={onBack} className="hover:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold uppercase">Direct Delivery</h1>
          <p className="text-xs text-[oklch(0.8_0.06_145)]">SAHA BRICK FIELD</p>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* ── 1. Basic Information ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0.07_145)] border-b border-gray-100 pb-2">
            Basic Information
          </h2>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label className={labelStyle}>Date</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 border border-border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 w-full text-left"
                >
                  <CalendarIcon
                    size={15}
                    className="text-[oklch(0.45_0.07_145)]"
                  />
                  <span>{format(date, "dd MMM yyyy")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 2-column fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={labelStyle}>Customer Name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name"
                className={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelStyle}>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelStyle}>Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                type="tel"
                className={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelStyle}>Invoice Number</Label>
              <Input
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
                placeholder="Invoice #"
                className={inputStyle}
              />
            </div>
          </div>
        </section>

        {/* ── 2. Brick Types ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0.07_145)] border-b border-gray-100 pb-2">
            Brick Types
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {BRICK_TYPES.map((type) => {
              const isSelected = selectedBricks.has(type);
              return (
                <div key={type} className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBrick(type)}
                    className={`rounded-lg border-2 px-2 py-2.5 text-xs font-bold text-center transition-all ${
                      isSelected
                        ? "bg-[oklch(0.25_0.08_145)] border-[oklch(0.25_0.08_145)] text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-600 hover:border-[oklch(0.45_0.1_145)] hover:text-[oklch(0.25_0.08_145)]"
                    }`}
                  >
                    {type}
                  </button>

                  {isSelected && (
                    <div className="flex flex-col gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={brickQty[type] || ""}
                        onChange={(e) =>
                          setBrickQty((prev) => ({
                            ...prev,
                            [type]: e.target.value,
                          }))
                        }
                        className="text-xs h-8 text-center border-[oklch(0.45_0.1_145)]"
                      />
                      {type === "Bats" && (
                        <Input
                          type="number"
                          min="0"
                          placeholder="Safety Qty"
                          value={batsSafetyQty}
                          onChange={(e) => setBatsSafetyQty(e.target.value)}
                          className="text-xs h-8 text-center border-orange-400"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Totals ── */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0.07_145)] border-b border-gray-100 pb-2 mb-3">
            Totals
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[oklch(0.97_0.03_145)] rounded-lg p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0.07_145)]">
                Total Bricks
              </p>
              <p className="text-2xl font-extrabold text-[oklch(0.25_0.08_145)] mt-1">
                {totalBricks.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                Total Bats Safety
              </p>
              <p className="text-2xl font-extrabold text-orange-700 mt-1">
                {totalBatsSafety.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. Location Type ── */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0.07_145)] border-b border-gray-100 pb-2 mb-3">
            Location Type
          </h2>
          <div className="flex gap-2">
            {(["Local", "Outside"] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocationType(loc)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                  locationType === loc
                    ? "bg-[oklch(0.25_0.08_145)] border-[oklch(0.25_0.08_145)] text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[oklch(0.45_0.1_145)]"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </section>

        {/* ── 5. Vehicle Type → Number → Labour ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0.07_145)] border-b border-gray-100 pb-2">
            Vehicle
          </h2>

          {/* Step 1: Vehicle Type */}
          <div>
            <Label className={`${labelStyle} mb-2 block`}>Vehicle Type</Label>
            <div className="flex gap-2">
              {(["Tractor", "12 Wheel"] as const).map((vt) => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => setVehicleType(vt)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                    vehicleType === vt
                      ? "bg-[oklch(0.25_0.08_145)] border-[oklch(0.25_0.08_145)] text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-[oklch(0.45_0.1_145)]"
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Vehicle Number */}
          <div>
            <Label className={`${labelStyle} mb-2 block`}>Vehicle Number</Label>
            {filteredVehicles.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No vehicles saved for {vehicleType}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setSelectedVehicleId((prev) =>
                        prev === v.id ? "" : v.id,
                      )
                    }
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      selectedVehicleId === v.id
                        ? "bg-[oklch(0.25_0.08_145)] border-[oklch(0.25_0.08_145)] text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-[oklch(0.45_0.1_145)]"
                    }`}
                  >
                    {v.number}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Loading Labour */}
          <div>
            <Label className={`${labelStyle} mb-2 block`}>Loading Labour</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {loadingLabours.map((name, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: list item
                  key={i}
                  className="flex items-center gap-1 bg-[oklch(0.97_0.03_145)] text-[oklch(0.25_0.08_145)] text-xs font-semibold px-2.5 py-1 rounded-full border border-[oklch(0.85_0.04_145)]"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => removeLoadingLabour(i)}
                    className="hover:text-red-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={loadingInput}
                onChange={(e) => setLoadingInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLoadingLabour()}
                placeholder="Add loading labour"
                className={`${inputStyle} text-sm h-9`}
              />
              <button
                type="button"
                onClick={addLoadingLabour}
                className="h-9 w-9 flex items-center justify-center rounded-md bg-[oklch(0.25_0.08_145)] text-white hover:bg-[oklch(0.32_0.09_145)] shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Step 3: Unloading Labour */}
          <div>
            <Label className={`${labelStyle} mb-2 block`}>
              Unloading Labour
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {unloadingLabours.map((name, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: list item
                  key={i}
                  className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => removeUnloadingLabour(i)}
                    className="hover:text-red-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={unloadingInput}
                onChange={(e) => setUnloadingInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUnloadingLabour()}
                placeholder="Add unloading labour"
                className={`${inputStyle} text-sm h-9`}
              />
              <button
                type="button"
                onClick={addUnloadingLabour}
                className="h-9 w-9 flex items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-600 shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── 6. Payment Status ── */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0.07_145)] border-b border-gray-100 pb-2 mb-3">
            Payment Status
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus("not-paid")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                paymentStatus === "not-paid"
                  ? "bg-red-500 border-red-500 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-red-300"
              }`}
            >
              Not Paid
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus("paid")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                paymentStatus === "paid"
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
              }`}
            >
              Paid Money
            </button>
          </div>
        </section>

        {/* ── Save Button ── */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-base uppercase tracking-widest shadow-md transition-all"
        >
          Save
        </button>
      </main>
    </div>
  );
}
