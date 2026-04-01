import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Delivery, Order } from "../../App";

type Props = {
  orders: Order[];
  deliveries: Delivery[];
  onClose: () => void;
};

export default function ReportsModal({ orders, deliveries, onClose }: Props) {
  const totalDue = orders
    .filter((o) => o.status !== "closed")
    .reduce((s, o) => s + o.dueAmount, 0);
  const totalBricks = orders.reduce((s, o) => s + o.totalBricks, 0);
  const delivBricks = deliveries.reduce((s, d) => s + d.brickQuantity, 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="reports.dialog"
        className="max-w-[460px] mx-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-[oklch(0.25_0.08_145)] uppercase tracking-wide">
            Reports
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { label: "Total Orders", value: orders.length },
            { label: "Total Bricks", value: totalBricks },
            {
              label: "Total Due",
              value: `₹${totalDue.toLocaleString("en-IN")}`,
            },
          ].map((s) => (
            <div key={s.label} className="bg-muted rounded-lg p-2 text-center">
              <div className="text-lg font-extrabold text-[oklch(0.25_0.08_145)]">
                {s.value}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="w-full">
            <TabsTrigger
              data-ocid="reports.orders.tab"
              value="orders"
              className="flex-1"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              data-ocid="reports.deliveries.tab"
              value="deliveries"
              className="flex-1"
            >
              Deliveries ({delivBricks} bricks)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <ScrollArea className="max-h-[40vh]">
              {orders.length === 0 ? (
                <p
                  data-ocid="reports.orders.empty_state"
                  className="text-center text-muted-foreground py-6 text-sm"
                >
                  No orders yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Bricks</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o, i) => (
                      <TableRow
                        key={o.id}
                        data-ocid={`reports.orders.row.${i + 1}`}
                      >
                        <TableCell className="font-medium text-xs">
                          {o.customerName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {o.totalBricks}
                        </TableCell>
                        <TableCell className="text-xs">
                          ₹{o.dueAmount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs capitalize">
                          {o.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="deliveries">
            <ScrollArea className="max-h-[40vh]">
              {deliveries.length === 0 ? (
                <p
                  data-ocid="reports.deliveries.empty_state"
                  className="text-center text-muted-foreground py-6 text-sm"
                >
                  No deliveries yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Bricks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((d, i) => (
                      <TableRow
                        key={d.id}
                        data-ocid={`reports.deliveries.row.${i + 1}`}
                      >
                        <TableCell className="font-medium text-xs">
                          {d.customerName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {d.brickQuantity}
                        </TableCell>
                        <TableCell className="text-xs capitalize">
                          {d.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
