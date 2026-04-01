import {
  CheckCircle,
  ClipboardList,
  Layers,
  Package,
  Settings,
  Truck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { Delivery, Order } from "../App";
import Header from "../components/Header";
import ClosedOrdersModal from "../components/modals/ClosedOrdersModal";
import CompleteDeliveryModal from "../components/modals/CompleteDeliveryModal";
import PendingDeliveryModal from "../components/modals/PendingDeliveryModal";

type Modal = "closed-orders" | "pending" | "complete" | null;

type Props = {
  orders: Order[];
  deliveries: Delivery[];
  pendingDeliveriesCount?: number;
  onCompleteDelivery: (id: string) => void;
  onGoTotalOrders: () => void;
  onGoPendingDelivery?: () => void;
  onGoSettings: () => void;
};

export default function Dashboard({
  orders,
  deliveries,
  pendingDeliveriesCount,
  onCompleteDelivery,
  onGoTotalOrders,
  onGoPendingDelivery,
  onGoSettings,
}: Props) {
  const [modal, setModal] = useState<Modal>(null);

  const totalOrders = orders.length;
  const closedOrders = orders.filter((o) => o.status === "closed").length;
  const pendingDelivery = deliveries.filter(
    (d) => d.status === "pending",
  ).length;
  const completeDelivery = deliveries.filter(
    (d) => d.status === "complete",
  ).length;
  const totalDueAmount = orders
    .filter((o) => o.status !== "closed")
    .reduce((sum, o) => sum + o.dueAmount, 0);
  const bricksDue = orders
    .filter((o) => o.status !== "closed")
    .reduce((sum, o) => sum + o.totalBricks, 0);

  const cards: {
    id: string;
    label: string;
    value: string | number;
    Icon: React.ComponentType<{
      size?: number;
      strokeWidth?: number;
      className?: string;
    }>;
    clickable: boolean;
    modal?: Modal;
    onClickOverride?: () => void;
  }[] = [
    {
      id: "total-orders",
      label: "TOTAL ORDERS",
      value: totalOrders,
      Icon: ClipboardList,
      clickable: true,
      onClickOverride: onGoTotalOrders,
    },
    {
      id: "closed-orders",
      label: "CLOSED ORDERS",
      value: closedOrders,
      Icon: CheckCircle,
      clickable: true,
      modal: "closed-orders",
    },
    {
      id: "pending-delivery",
      label: "PENDING DELIVERY",
      value: pendingDeliveriesCount ?? pendingDelivery,
      Icon: Truck,
      clickable: true,
      onClickOverride: onGoPendingDelivery ?? (() => setModal("pending")),
    },
    {
      id: "complete-delivery",
      label: "COMPLETE DELIVERY",
      value: completeDelivery,
      Icon: Package,
      clickable: true,
      modal: "complete",
    },
    {
      id: "total-due-amount",
      label: "TOTAL DUE AMOUNT",
      value: `₹${totalDueAmount.toLocaleString("en-IN")}`,
      Icon: Wallet,
      clickable: false,
    },
    {
      id: "bricks-due",
      label: "BRICKS DUE",
      value: bricksDue,
      Icon: Layers,
      clickable: false,
    },
    {
      id: "settings",
      label: "SETTINGS",
      value: "",
      Icon: Settings,
      clickable: true,
      onClickOverride: onGoSettings,
    },
  ];

  return (
    <div className="flex flex-col flex-1 pb-16">
      <Header />
      <main className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card) => {
            const handleOpen = card.clickable
              ? card.onClickOverride
                ? card.onClickOverride
                : card.modal
                  ? () => setModal(card.modal!)
                  : undefined
              : undefined;
            return (
              <div
                key={card.id}
                role={card.clickable ? "button" : undefined}
                tabIndex={card.clickable ? 0 : undefined}
                data-ocid={`dashboard.${card.id}.card`}
                onClick={handleOpen}
                onKeyDown={
                  handleOpen
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") handleOpen();
                      }
                    : undefined
                }
                className={`bg-white rounded-xl shadow-md p-2 flex flex-col items-center gap-1 ${
                  card.clickable
                    ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all"
                    : "cursor-default"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[oklch(0.88_0.07_145)] flex items-center justify-center">
                  <card.Icon
                    size={22}
                    strokeWidth={1.8}
                    className="text-[oklch(0.28_0.1_145)]"
                  />
                </div>
                <span className="text-xs font-bold tracking-wide text-center text-[oklch(0.35_0.07_145)] uppercase leading-tight">
                  {card.label}
                </span>
                {card.value !== "" && (
                  <span className="text-lg font-extrabold text-[oklch(0.25_0.09_145)]">
                    {card.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-3 pb-4">
        &copy; {new Date().getFullYear()}{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Built with ♥ using caffeine.ai
        </a>
      </footer>

      {modal === "closed-orders" && (
        <ClosedOrdersModal
          orders={orders.filter((o) => o.status === "closed")}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "pending" && (
        <PendingDeliveryModal
          deliveries={deliveries.filter((d) => d.status === "pending")}
          onClose={() => setModal(null)}
          onComplete={onCompleteDelivery}
        />
      )}
      {modal === "complete" && (
        <CompleteDeliveryModal
          deliveries={deliveries.filter((d) => d.status === "complete")}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
