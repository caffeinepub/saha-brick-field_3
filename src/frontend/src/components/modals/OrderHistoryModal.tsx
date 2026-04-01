import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, Truck, X } from "lucide-react";
import type { Order } from "../../App";

type Props = {
  order: Order;
  onClose: () => void;
};

export default function OrderHistoryModal({ order, onClose }: Props) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[460px] mx-auto p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-2">
            <div>
              <DialogTitle className="text-xl font-extrabold text-gray-900">
                Order History
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                {order.customerName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="p-5 pt-3 flex flex-col gap-5">
              {/* Delivery History */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Truck size={18} className="text-green-600" />
                  </div>
                  <span className="text-green-600 font-extrabold text-sm uppercase tracking-widest">
                    Delivery History
                  </span>
                </div>

                <div className="border border-green-200 rounded-xl overflow-hidden bg-green-50">
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-green-100">
                    {["DATE", "BRICK TYPE", "QTY", "VEHICLE"].map((h) => (
                      <span
                        key={h}
                        className="text-[10px] font-extrabold text-green-700 uppercase tracking-wide"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  {order.deliveryHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-xs">
                      কোনো ডেলিভারি নেই
                    </div>
                  ) : (
                    order.deliveryHistory.map((d) => (
                      <div
                        key={d.id}
                        className="grid grid-cols-4 gap-2 px-3 py-2.5 border-t border-green-100"
                      >
                        <span className="text-xs text-gray-700">{d.date}</span>
                        <span className="text-xs text-gray-700">
                          {d.brickType}
                        </span>
                        <span className="text-xs text-gray-700">
                          {d.qty.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-700">
                          {d.vehicle}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-red-500" />
                  </div>
                  <span className="text-red-500 font-extrabold text-sm uppercase tracking-widest">
                    Payment History
                  </span>
                </div>

                <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50">
                  <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-red-100">
                    {["DATE", "TIME", "AMOUNT PAID"].map((h) => (
                      <span
                        key={h}
                        className="text-[10px] font-extrabold text-red-700 uppercase tracking-wide"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  {order.paymentHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-xs">
                      কোনো পেমেন্ট নেই
                    </div>
                  ) : (
                    order.paymentHistory.map((p) => (
                      <div
                        key={p.id}
                        className="grid grid-cols-3 gap-2 px-3 py-2.5 border-t border-red-100"
                      >
                        <span className="text-xs text-gray-700">{p.date}</span>
                        <span className="text-xs text-gray-700">{p.time}</span>
                        <span className="text-xs font-bold text-red-600">
                          ₹{p.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
