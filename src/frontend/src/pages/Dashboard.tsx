import {
  BarChart2,
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
import CompleteDeliveryModal from "../components/modals/CompleteDeliveryModal";
import PendingDeliveryModal from "../components/modals/PendingDeliveryModal";

type Modal = "pending" | "complete" | null;

type Props = {
  orders: Order[];
  deliveries: Delivery[];
  pendingDeliveriesCount?: number;
  completeDeliveriesCount?: number;
  onGoCompleteDelivery?: () => void;
  onCompleteDelivery: (id: string) => void;
  onGoTotalOrders: () => void;
  onGoPendingDelivery?: () => void;
  onGoSettings: () => void;
  onGoReports?: () => void;
  closedOrders?: Order[];
};

export default function Dashboard({
  orders,
  deliveries,
  pendingDeliveriesCount,
  completeDeliveriesCount,
  onCompleteDelivery,
  onGoTotalOrders,
  onGoPendingDelivery,
  onGoCompleteDelivery,
  onGoSettings,
  onGoReports,
  closedOrders = [],
}: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const [showClosedOrders, setShowClosedOrders] = useState(false);

  const totalOrders = orders.filter((o) => o.status === "open").length;
  const closedOrdersCount = closedOrders.length;
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
    .reduce(
      (sum, o) =>
        sum + (o.bricksDue !== undefined ? o.bricksDue : o.totalBricks),
      0,
    );

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
      value: closedOrdersCount,
      Icon: CheckCircle,
      clickable: true,
      onClickOverride: () => setShowClosedOrders((v) => !v),
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
      value: completeDeliveriesCount ?? completeDelivery,
      Icon: Package,
      clickable: true,
      onClickOverride: onGoCompleteDelivery ?? (() => setModal("complete")),
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
    {
      id: "reports",
      label: "REPORTS",
      value: "",
      Icon: BarChart2,
      clickable: true,
      onClickOverride: onGoReports,
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
            const isActive = card.id === "closed-orders" && showClosedOrders;
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
                } ${isActive ? "ring-2 ring-[oklch(0.35_0.1_145)]" : ""}`}
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

        {showClosedOrders && (
          <div className="mt-3" data-ocid="closed_orders.panel">
            <div className="bg-[#1a3c2a] text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-widest">
                CLOSED ORDERS
              </h2>
              <div className="w-7 h-7 rounded-full bg-[#2e5c40] flex items-center justify-center text-white font-bold text-xs">
                {closedOrders.length}
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-[#edf5ed] p-3 rounded-b-xl">
              {closedOrders.length === 0 ? (
                <div
                  className="text-center text-gray-400 py-10 bg-white rounded-xl text-sm"
                  data-ocid="closed_orders.empty_state"
                >
                  কোনো বন্ধ অর্ডার নেই
                </div>
              ) : (
                closedOrders.map((order, idx) => (
                  <ClosedOrderCard
                    key={order.id}
                    order={order}
                    index={idx + 1}
                  />
                ))
              )}
            </div>
          </div>
        )}
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

function ClosedOrderCard({
  order,
  index,
}: {
  order: Order;
  index: number;
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden"
      data-ocid={`closed_orders.item.${index}`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <span className="font-extrabold text-base text-gray-900">
            {order.customerName}
          </span>
          <span className="text-[10px] font-bold tracking-wider bg-[#edf5ed] text-[#1a3c2a] border border-[#c5dfc5] rounded-full px-2 py-0.5 uppercase">
            CLOSED
          </span>
        </div>

        {order.address && (
          <div className="text-xs text-gray-500 mb-2">{order.address}</div>
        )}

        <div className="flex items-center gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>📅</span>
            <span className="font-semibold">{order.orderDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {[
            {
              label: "TOTAL",
              value: `₹${order.totalAmount.toLocaleString()}`,
              color: "text-gray-900",
            },
            {
              label: "PAID",
              value: `₹${order.paidAmount.toLocaleString()}`,
              color: "text-green-600",
            },
            {
              label: "BRICKS",
              value: order.totalBricks.toLocaleString(),
              color: "text-gray-700",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-2">
              <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                {label}
              </span>
              <span className={`text-sm font-extrabold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
