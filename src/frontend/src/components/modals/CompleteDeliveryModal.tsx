import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Delivery } from "../../App";

type Props = {
  deliveries: Delivery[];
  onClose: () => void;
};

export default function CompleteDeliveryModal({ deliveries, onClose }: Props) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="complete-delivery.dialog"
        className="max-w-[460px] mx-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-[oklch(0.25_0.08_145)] uppercase tracking-wide">
            Complete Deliveries
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {deliveries.length === 0 ? (
            <p
              data-ocid="complete-delivery.empty_state"
              className="text-center text-muted-foreground py-8"
            >
              No completed deliveries yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3 pr-2">
              {deliveries.map((d, i) => (
                <div
                  key={d.id}
                  data-ocid={`complete-delivery.item.${i + 1}`}
                  className="bg-muted rounded-lg p-3 flex flex-col gap-1"
                >
                  <span className="font-bold text-sm">{d.customerName}</span>
                  <div className="text-xs text-muted-foreground">
                    Bricks: {d.brickQuantity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.createdAt}
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
