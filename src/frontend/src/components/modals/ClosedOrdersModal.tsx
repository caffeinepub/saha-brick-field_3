import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, CreditCard, Truck } from "lucide-react";
import { useState } from "react";
import type { Order } from "../../App";

type Props = {
  orders: Order[];
  onClose: () => void;
};

export default function ClosedOrdersModal({ orders, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[460px] mx-auto p-0 overflow-hidden">
        <div className="bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <DialogTitle className="text-base font-extrabold uppercase tracking-widest text-[#1a3c2a]">
              CLOSED ORDERS
            </DialogTitle>
            <span className="w-7 h-7 rounded-full bg-[#1a3c2a] text-white text-xs font-bold flex items-center justify-center">
              {orders.length}
            </span>
          </div>

          <ScrollArea className="max-h-[72vh]">
            {orders.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">
                কোনো closed order নেই
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {orders.map((order) => {
                  const isOpen = expandedId === order.id;
                  return (
                    <div key={order.id} className="px-4 py-3">
                      {/* Order summary toggle */}
                      <button
                        type="button"
                        className="w-full flex items-center justify-between cursor-pointer text-left"
                        onClick={() => toggle(order.id)}
                      >
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
                      </button>

                      {/* Stats row */}
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

                      {/* Expanded history */}
                      {isOpen && (
                        <div className="mt-3 flex flex-col gap-3">
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
                                <CreditCard
                                  size={12}
                                  className="text-red-500"
                                />
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
