import { Button } from "@/components/ui/button";
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
  onComplete: (id: string) => void;
};

export default function PendingDeliveryModal({
  deliveries,
  onClose,
  onComplete,
}: Props) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="pending-delivery.dialog"
        className="max-w-[460px] mx-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-[oklch(0.25_0.08_145)] uppercase tracking-wide">
            Pending Deliveries
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {deliveries.length === 0 ? (
            <p
              data-ocid="pending-delivery.empty_state"
              className="text-center text-muted-foreground py-8"
            >
              No pending deliveries.
            </p>
          ) : (
            <div className="flex flex-col gap-3 pr-2">
              {deliveries.map((d, i) => (
                <div
                  key={d.id}
                  data-ocid={`pending-delivery.item.${i + 1}`}
                  className="bg-muted rounded-lg p-3 flex flex-col gap-1"
                >
                  <span className="font-bold text-sm">{d.customerName}</span>
                  <div className="text-xs text-muted-foreground">
                    Bricks: {d.brickQuantity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.createdAt}
                  </div>
                  <Button
                    size="sm"
                    data-ocid={`pending-delivery.complete.button.${i + 1}`}
                    onClick={() => onComplete(d.id)}
                    className="mt-1 bg-[oklch(0.25_0.08_145)] hover:bg-[oklch(0.32_0.09_145)] text-white text-xs"
                  >
                    Mark as Complete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
