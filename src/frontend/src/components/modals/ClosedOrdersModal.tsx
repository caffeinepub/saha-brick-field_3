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
};

export default function ClosedOrdersModal({ orders, onClose }: Props) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="closed-orders.dialog"
        className="max-w-[460px] mx-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-[oklch(0.25_0.08_145)] uppercase tracking-wide">
            Closed Orders
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {orders.length === 0 ? (
            <p
              data-ocid="closed-orders.empty_state"
              className="text-center text-muted-foreground py-8"
            >
              No closed orders yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3 pr-2">
              {orders.map((order, i) => (
                <div
                  key={order.id}
                  data-ocid={`closed-orders.item.${i + 1}`}
                  className="bg-muted rounded-lg p-3 flex flex-col gap-1"
                >
                  <span className="font-bold text-sm">
                    {order.customerName}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    Bricks: {order.totalBricks.toLocaleString()} &bull; Due: ₹
                    {order.dueAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.createdAt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
