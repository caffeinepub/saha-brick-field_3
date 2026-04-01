import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Order } from "../../App";

type Props = {
  order: Order;
  onClose: () => void;
  onConfirm: (amount: number) => void;
};

export default function AddPaymentModal({ order, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] mx-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1a3c2a]">Add Payment</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            <span className="font-bold">{order.customerName}</span> — Due: ₹
            {order.dueAmount.toLocaleString()}
          </p>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter payment amount"
            className="text-sm"
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const n = Number(amount);
                if (n > 0) onConfirm(n);
              }}
              className="flex-1 py-2.5 bg-[#1a3c2a] text-white rounded-xl text-sm font-bold hover:bg-[#2a5c3a] transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
