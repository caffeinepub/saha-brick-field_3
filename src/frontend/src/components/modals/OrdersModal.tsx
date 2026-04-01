import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Order } from "../../App";

type Props = {
  orders: Order[];
  onClose: () => void;
  onCloseOrder: (id: string) => void;
};

export default function OrdersModal({ orders, onClose, onCloseOrder }: Props) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="total-orders.dialog"
        className="max-w-[460px] mx-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-[oklch(0.25_0.08_145)] uppercase tracking-wide">
            All Orders
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {orders.length === 0 ? (
            <p
              data-ocid="total-orders.empty_state"
              className="text-center text-muted-foreground py-8"
            >
              No orders yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3 pr-2">
              {orders.map((order, i) => (
                <div
                  key={order.id}
                  data-ocid={`total-orders.item.${i + 1}`}
                  className="bg-muted rounded-lg p-3 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {order.customerName}
                    </span>
                    <Badge
                      variant={
                        order.status === "closed" ? "secondary" : "default"
                      }
                      className={
                        order.status === "closed"
                          ? ""
                          : "bg-[oklch(0.25_0.08_145)] text-white"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  {order.address && (
                    <div className="text-xs text-muted-foreground">
                      📍 {order.address}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    📞 {order.phone}{" "}
                    {order.invoice ? `• Invoice: ${order.invoice}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Order: {order.orderDate}
                    {order.approxDeliveryDate
                      ? ` • Delivery: ${order.approxDeliveryDate}`
                      : ""}
                  </div>
                  {order.brickItems && order.brickItems.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {order.brickItems
                        .map((b) => `${b.type}: ${b.quantity}`)
                        .join(" | ")}
                    </div>
                  )}
                  <div className="text-xs font-semibold text-[#1a3c2a]">
                    Total Bricks: {order.totalBricks.toLocaleString()}
                    {order.batsSafety > 0
                      ? ` • Bats Safety: ${order.batsSafety}`
                      : ""}
                  </div>
                  <div className="text-xs">
                    Total: ₹{order.totalAmount.toLocaleString()} • Paid: ₹
                    {order.paidAmount.toLocaleString()} •{" "}
                    <span
                      className={
                        order.dueAmount > 0
                          ? "text-red-500 font-bold"
                          : "text-[#1a3c2a] font-bold"
                      }
                    >
                      Due: ₹{order.dueAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.locationType} • {order.createdAt}
                  </div>
                  {order.status === "open" && (
                    <Button
                      size="sm"
                      data-ocid={`total-orders.close.button.${i + 1}`}
                      onClick={() => onCloseOrder(order.id)}
                      className="mt-1 bg-[oklch(0.25_0.08_145)] hover:bg-[oklch(0.32_0.09_145)] text-white text-xs"
                    >
                      Mark as Closed
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
