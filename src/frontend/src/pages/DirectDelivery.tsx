import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Delivery } from "../App";

type Props = {
  onSubmit: (delivery: Omit<Delivery, "id" | "createdAt">) => void;
  onBack: () => void;
};

export default function DirectDelivery({ onSubmit, onBack }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [brickQuantity, setBrickQuantity] = useState("");
  const [status, setStatus] = useState<"pending" | "complete">("pending");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !brickQuantity) {
      toast.error("Please fill in all fields");
      return;
    }
    onSubmit({
      customerName: customerName.trim(),
      brickQuantity: Number(brickQuantity),
      status,
    });
    toast.success("Delivery recorded successfully");
    setCustomerName("");
    setBrickQuantity("");
    setStatus("pending");
    onBack();
  };

  return (
    <div className="flex flex-col flex-1 pb-20">
      <header className="bg-[oklch(0.25_0.08_145)] text-white px-4 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          data-ocid="delivery.back.button"
          className="hover:opacity-70"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold uppercase">Direct Delivery</h1>
          <p className="text-xs text-[oklch(0.8_0.06_145)]">SAHA BRICK FIELD</p>
        </div>
      </header>

      <main className="flex-1 p-5">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 bg-white rounded-xl shadow-md p-5"
        >
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="delivCustomer"
              className="font-semibold text-[oklch(0.25_0.08_145)] uppercase text-xs tracking-wider"
            >
              Customer Name
            </Label>
            <Input
              id="delivCustomer"
              data-ocid="delivery.customerName.input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="border-border focus-visible:ring-[oklch(0.45_0.1_145)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="delivQty"
              className="font-semibold text-[oklch(0.25_0.08_145)] uppercase text-xs tracking-wider"
            >
              Brick Quantity
            </Label>
            <Input
              id="delivQty"
              data-ocid="delivery.brickQuantity.input"
              type="number"
              min="1"
              value={brickQuantity}
              onChange={(e) => setBrickQuantity(e.target.value)}
              placeholder="Enter brick quantity"
              className="border-border focus-visible:ring-[oklch(0.45_0.1_145)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold text-[oklch(0.25_0.08_145)] uppercase text-xs tracking-wider">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "pending" | "complete")}
            >
              <SelectTrigger
                data-ocid="delivery.status.select"
                className="border-border"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            data-ocid="delivery.submit.button"
            className="bg-[oklch(0.25_0.08_145)] hover:bg-[oklch(0.32_0.09_145)] text-white font-bold uppercase tracking-wider"
          >
            Record Delivery
          </Button>
        </form>
      </main>
    </div>
  );
}
