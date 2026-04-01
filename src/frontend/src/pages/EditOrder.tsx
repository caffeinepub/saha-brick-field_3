import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parse } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { BrickItem, Order } from "../App";

type Props = {
  order: Order;
  onSave: (updates: Partial<Order>) => void;
  onBack: () => void;
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

function parseDate(str: string): Date {
  try {
    return parse(str, "dd/MM/yyyy", new Date());
  } catch {
    return new Date();
  }
}

export default function EditOrder({ order, onSave, onBack }: Props) {
  const [orderDate, setOrderDate] = useState<Date>(parseDate(order.orderDate));
  const [approxDate, setApproxDate] = useState<Date | undefined>(
    order.approxDeliveryDate ? parseDate(order.approxDeliveryDate) : undefined,
  );
  const [orderDateOpen, setOrderDateOpen] = useState(false);
  const [approxDateOpen, setApproxDateOpen] = useState(false);

  const [customerName, setCustomerName] = useState(order.customerName);
  const [address, setAddress] = useState(order.address);
  const [phone, setPhone] = useState(order.phone);
  const [invoice, setInvoice] = useState(order.invoice);

  const initBricks: Record<string, number> = {};
  for (const b of order.brickItems) {
    initBricks[b.type] = b.quantity;
  }
  const [selectedBricks, setSelectedBricks] =
    useState<Record<string, number>>(initBricks);

  const [totalAmount, setTotalAmount] = useState(String(order.totalAmount));
  const [paidAmount, setPaidAmount] = useState(String(order.paidAmount));
  const [locationType, setLocationType] = useState<"Local" | "Outside">(
    order.locationType,
  );

  const toggleBrick = (type: string) => {
    setSelectedBricks((prev) => {
      if (prev[type] !== undefined) {
        const next = { ...prev };
        delete next[type];
        return next;
      }
      return { ...prev, [type]: 0 };
    });
  };

  const setBrickQty = (type: string, qty: number) => {
    setSelectedBricks((prev) => ({ ...prev, [type]: qty }));
  };

  const totalBricks = Object.entries(selectedBricks)
    .filter(([t]) => t !== "Bats")
    .reduce((sum, [, qty]) => sum + (qty || 0), 0);

  const batsSafety = selectedBricks.Bats || 0;
  const due = (Number(totalAmount) || 0) - (Number(paidAmount) || 0);

  const handleSave = () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const brickItems: BrickItem[] = Object.entries(selectedBricks).map(
      ([type, quantity]) => ({ type, quantity }),
    );
    onSave({
      orderDate: format(orderDate, "dd/MM/yyyy"),
      approxDeliveryDate: approxDate ? format(approxDate, "dd/MM/yyyy") : "",
      customerName: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      invoice: invoice.trim(),
      brickItems,
      totalBricks,
      batsSafety,
      totalAmount: Number(totalAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      dueAmount: due,
      locationType,
    });
    toast.success("Order updated!");
  };

  return (
    <div className="flex flex-col flex-1 pb-20 bg-[#f0f5f0]">
      <header className="bg-[#1a3c2a] text-white px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onBack} className="hover:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-base font-extrabold uppercase tracking-widest">
          EDIT ORDER
        </h1>
      </header>

      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <Label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            ORDER DATE
          </Label>
          <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="mt-2 w-full flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#1a3c2a] hover:border-[#1a3c2a] transition-colors"
              >
                <CalendarIcon size={16} className="text-[#1a3c2a]" />
                {format(orderDate, "dd/MM/yyyy")}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={orderDate}
                onSelect={(d) => {
                  if (d) {
                    setOrderDate(d);
                    setOrderDateOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <Label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            CUSTOMER INFORMATION
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                NAME *
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                ADDRESS
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                PHONE
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="mt-1 text-sm"
                type="tel"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                INVOICE
              </Label>
              <Input
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
                placeholder="Invoice no."
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              APPROX DELIVERY DATE
            </Label>
            <Popover open={approxDateOpen} onOpenChange={setApproxDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="mt-2 w-full flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#1a3c2a] hover:border-[#1a3c2a] transition-colors"
                >
                  <CalendarIcon size={16} className="text-[#1a3c2a]" />
                  {approxDate
                    ? format(approxDate, "dd/MM/yyyy")
                    : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={approxDate}
                  onSelect={(d) => {
                    setApproxDate(d);
                    setApproxDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <Label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            BRICK TYPES
          </Label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {BRICK_TYPES.map((type) => {
              const isSelected = selectedBricks[type] !== undefined;
              const isBats = type === "Bats";
              return (
                <div key={type} className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleBrick(type)}
                    className={`w-full py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                      isSelected
                        ? "bg-[#1a3c2a] text-white border-[#1a3c2a]"
                        : "bg-white text-[#1a3c2a] border-[#c5dfc5] hover:border-[#1a3c2a]"
                    }`}
                  >
                    {type}
                  </button>
                  {isSelected && (
                    <Input
                      type="number"
                      min={0}
                      value={selectedBricks[type] || ""}
                      onChange={(e) =>
                        setBrickQty(type, Number(e.target.value))
                      }
                      placeholder={isBats ? "Safety qty" : "Quantity"}
                      className={`text-center font-semibold text-sm rounded-xl ${
                        isBats
                          ? "border-[#d4a843] bg-[#fffbf0] focus-visible:ring-[#d4a843]"
                          : "border-[#c5dfc5] bg-[#f6fbf6] focus-visible:ring-[#1a3c2a]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#1a3c2a] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-white font-bold text-sm tracking-widest uppercase">
            TOTAL BRICKS
          </span>
          <span className="text-white font-extrabold text-lg">
            {totalBricks.toLocaleString()}
          </span>
        </div>

        {batsSafety > 0 && (
          <div className="bg-[#fffbf0] border border-[#e8d5a0] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-[#b87333] font-bold text-sm tracking-widest uppercase">
              TOTAL BATS SAFETY
            </span>
            <span className="text-[#b87333] font-extrabold text-lg">
              {batsSafety}
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <Label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            PAYMENT DETAILS
          </Label>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              TOTAL AMOUNT
            </span>
            <Input
              type="number"
              min={0}
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="w-28 text-right text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              PAID AMOUNT
            </span>
            <Input
              type="number"
              min={0}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0"
              className="w-28 text-right text-sm"
            />
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-sm font-bold text-gray-700">DUE AMOUNT</span>
            <span
              className={`text-base font-extrabold ${
                due > 0 ? "text-red-500" : "text-[#1a3c2a]"
              }`}
            >
              ₹{due.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <Label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            LOCATION TYPE
          </Label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(["Local", "Outside"] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocationType(loc)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  locationType === loc
                    ? "bg-[#1a3c2a] text-white border-[#1a3c2a]"
                    : "bg-white text-[#1a3c2a] border-[#c5dfc5] hover:border-[#1a3c2a]"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="bg-[#1a3c2a] text-white font-bold uppercase tracking-widest py-4 rounded-xl text-sm hover:bg-[#2a5c3a] transition-colors shadow-md"
        >
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
}
