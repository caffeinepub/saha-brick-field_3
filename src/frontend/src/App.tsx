import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import BottomNav from "./components/BottomNav";
import AddOrder from "./pages/AddOrder";
import ClosedOrdersPage from "./pages/ClosedOrdersPage";
import CompleteDeliveryFormPage from "./pages/CompleteDeliveryFormPage";
import CompleteDeliveryListPage from "./pages/CompleteDeliveryListPage";
import Dashboard from "./pages/Dashboard";
import DirectDelivery from "./pages/DirectDelivery";
import EditOrder from "./pages/EditOrder";
import PendingDeliveryPage from "./pages/PendingDeliveryPage";
import PendingOrderPage from "./pages/PendingOrderPage";
import ReportsPage from "./pages/ReportsPage";
import Settings from "./pages/Settings";
import TotalOrders from "./pages/TotalOrders";

export type BrickItem = {
  type: string;
  quantity: number;
};

export type PaymentRecord = {
  id: string;
  date: string;
  time: string;
  amount: number;
};

export type DeliveryRecord = {
  id: string;
  date: string;
  brickType: string;
  qty: number;
  vehicle: string;
};

export type Order = {
  id: string;
  orderDate: string;
  approxDeliveryDate: string;
  customerName: string;
  address: string;
  phone: string;
  invoice: string;
  brickItems: BrickItem[];
  totalBricks: number;
  batsSafety: number;
  bricksDue: number;
  batsDue: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  locationType: "Local" | "Outside";
  status: "open" | "closed";
  createdAt: string;
  paymentHistory: PaymentRecord[];
  deliveryHistory: DeliveryRecord[];
};

export type PendingDelivery = {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  phone: string;
  invoice: string;
  locationType: "Local" | "Outside";
  pendingDate: string;
  deliverItems: { type: string; deliverQty: number }[];
  dueAmount: number;
  rate?: number;
  approxDeliveryDate?: string;
  status: "pending" | "delivered";
  createdAt: string;
};

export type Vehicle = {
  id: string;
  type: "Tractor" | "12 Wheel";
  number: string;
  loadingLabours: string[];
  unloadingLabours: string[];
};

export type CompleteDelivery = {
  id: string;
  pendingDeliveryId: string;
  customerName: string;
  address: string;
  phone: string;
  invoice: string;
  locationType: "Local" | "Outside";
  deliveryDate: string;
  vehicleType: "Tractor" | "12 Wheel";
  vehicleNumber: string;
  loadingLabours: string[];
  unloadingLabours: string[];
  deliverItems: { type: string; deliverQty: number }[];
  dueAmount: number;
  ratePerThousand: number;
  batsRate?: number;
  totalAmount: number;
  totalLabours: number;
  perLabourAvg: number;
  labourBreakdown?: Record<string, number>;
  paymentStatus: "not-paid" | "paid";
  createdAt: string;
};

export type Delivery = {
  id: string;
  customerName: string;
  brickQuantity: number;
  status: "pending" | "complete";
  createdAt: string;
};

export type Page =
  | "dashboard"
  | "add-order"
  | "direct-delivery"
  | "total-orders"
  | "edit-order"
  | "settings"
  | "reports"
  | "pending-order"
  | "pending-delivery"
  | "complete-delivery-form"
  | "complete-delivery"
  | "closed-orders";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => loadFromStorage(key, initial));
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState] as const;
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [orders, setOrders] = usePersistedState<Order[]>("sbf_orders", []);
  const [deliveries, setDeliveries] = usePersistedState<Delivery[]>(
    "sbf_deliveries",
    [],
  );
  const [pendingDeliveries, setPendingDeliveries] = usePersistedState<
    PendingDelivery[]
  >("sbf_pending_deliveries", []);
  const [completeDeliveries, setCompleteDeliveries] = usePersistedState<
    CompleteDelivery[]
  >("sbf_complete_deliveries", []);
  const [vehicles, setVehicles] = usePersistedState<Vehicle[]>(
    "sbf_vehicles",
    [],
  );
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [completingDeliveryId, setCompletingDeliveryId] = useState<
    string | null
  >(null);

  const addOrder = (
    order: Omit<
      Order,
      | "id"
      | "createdAt"
      | "status"
      | "paymentHistory"
      | "deliveryHistory"
      | "bricksDue"
      | "batsDue"
    >,
  ) => {
    setOrders((prev) => [
      ...prev,
      {
        ...order,
        id: crypto.randomUUID(),
        status: "open",
        bricksDue: order.totalBricks,
        batsDue: order.batsSafety,
        createdAt: new Date().toLocaleString(),
        paymentHistory: [],
        deliveryHistory: [],
      },
    ]);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const addPayment = (orderId: string, amount: number) => {
    const now = new Date();
    const record: PaymentRecord = {
      id: crypto.randomUUID(),
      date: now.toLocaleDateString("en-GB"),
      time: now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount,
    };
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newPaid = o.paidAmount + amount;
        const newDue = o.totalAmount - newPaid;
        const currentBricksDue = o.bricksDue ?? o.totalBricks;
        const currentBatsDue = o.batsDue ?? o.batsSafety;
        const shouldClose =
          newDue === 0 && currentBricksDue === 0 && currentBatsDue === 0;
        return {
          ...o,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: shouldClose ? "closed" : o.status,
          paymentHistory: [...o.paymentHistory, record],
        };
      }),
    );
  };

  // biome-ignore lint/correctness/noUnusedVariables: kept for potential future use
  const addDelivery = (delivery: Omit<Delivery, "id" | "createdAt">) => {
    setDeliveries((prev) => [
      ...prev,
      {
        ...delivery,
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleString(),
      },
    ]);
  };

  const completeDelivery = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "complete" } : d)),
    );
  };

  const addPendingDelivery = (
    delivery: Omit<PendingDelivery, "id" | "createdAt">,
  ) => {
    setPendingDeliveries((prev) => [
      ...prev,
      {
        ...delivery,
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleString(),
      },
    ]);
  };

  const deletePendingDelivery = (id: string) => {
    setPendingDeliveries((prev) => prev.filter((d) => d.id !== id));
  };

  const saveVehicle = (vehicle: Omit<Vehicle, "id">) => {
    setVehicles((prev) => [...prev, { ...vehicle, id: crypto.randomUUID() }]);
  };

  const editVehicle = (id: string, updated: Omit<Vehicle, "id">) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updated } : v)),
    );
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const addCompleteDelivery = (
    cd: Omit<CompleteDelivery, "id" | "createdAt">,
  ) => {
    setCompleteDeliveries((prev) => [
      ...prev,
      {
        ...cd,
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleString(),
      },
    ]);

    // Mark the pending delivery as delivered
    setPendingDeliveries((prev) =>
      prev.map((d) =>
        d.id === cd.pendingDeliveryId ? { ...d, status: "delivered" } : d,
      ),
    );

    // Find the pending delivery to get orderId
    const pendingDel = pendingDeliveries.find(
      (d) => d.id === cd.pendingDeliveryId,
    );
    if (pendingDel?.orderId) {
      const deliveredBricks = cd.deliverItems
        .filter((i) => i.type !== "Bats")
        .reduce((s, i) => s + i.deliverQty, 0);
      const deliveredBats = cd.deliverItems
        .filter((i) => i.type === "Bats")
        .reduce((s, i) => s + i.deliverQty, 0);

      const now = new Date();
      const deliveryRecords: DeliveryRecord[] = cd.deliverItems.map((item) => ({
        id: crypto.randomUUID(),
        date: now.toLocaleDateString("en-GB"),
        brickType: item.type,
        qty: item.deliverQty,
        vehicle: cd.vehicleNumber,
      }));

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== pendingDel.orderId) return o;
          const currentBricksDue =
            o.bricksDue !== undefined ? o.bricksDue : o.totalBricks;
          const currentBatsDue =
            o.batsDue !== undefined ? o.batsDue : o.batsSafety;
          const newBricksDue = Math.max(0, currentBricksDue - deliveredBricks);
          const newBatsDue = Math.max(0, currentBatsDue - deliveredBats);
          const shouldClose =
            o.dueAmount === 0 && newBricksDue === 0 && newBatsDue === 0;
          return {
            ...o,
            bricksDue: newBricksDue,
            batsDue: newBatsDue,
            status: shouldClose ? "closed" : o.status,
            deliveryHistory: [...o.deliveryHistory, ...deliveryRecords],
          };
        }),
      );
    }
  };

  const deleteCompleteDelivery = (id: string) => {
    setCompleteDeliveries((prev) => prev.filter((d) => d.id !== id));
  };

  const goEdit = (id: string) => {
    setEditingOrderId(id);
    setPage("edit-order");
  };

  const goPendingOrder = (id: string) => {
    setPendingOrderId(id);
    setPage("pending-order");
  };

  const goCompleteDeliveryForm = (id: string) => {
    setCompletingDeliveryId(id);
    setPage("complete-delivery-form");
  };

  const activeOrders = orders.filter((o) => o.status === "open");
  const closedOrders = orders.filter((o) => o.status === "closed");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative">
        {page === "dashboard" && (
          <Dashboard
            orders={orders}
            deliveries={deliveries}
            onCompleteDelivery={completeDelivery}
            onGoTotalOrders={() => setPage("total-orders")}
            onGoPendingDelivery={() => setPage("pending-delivery")}
            pendingDeliveriesCount={
              pendingDeliveries.filter((d) => d.status === "pending").length
            }
            completeDeliveriesCount={completeDeliveries.length}
            onGoCompleteDelivery={() => setPage("complete-delivery")}
            onGoSettings={() => setPage("settings")}
            onGoReports={() => setPage("reports")}
            onGoClosedOrders={() => setPage("closed-orders")}
          />
        )}
        {page === "add-order" && (
          <AddOrder onSubmit={addOrder} onBack={() => setPage("dashboard")} />
        )}
        {page === "direct-delivery" && (
          <DirectDelivery
            onBack={() => setPage("dashboard")}
            vehicles={vehicles}
          />
        )}
        {page === "total-orders" && (
          <TotalOrders
            orders={activeOrders}
            onBack={() => setPage("dashboard")}
            onEdit={goEdit}
            onDelete={deleteOrder}
            onAddPayment={addPayment}
            onPendingOrder={goPendingOrder}
          />
        )}
        {page === "edit-order" && editingOrderId && (
          <EditOrder
            order={orders.find((o) => o.id === editingOrderId)!}
            onSave={(updates) => {
              updateOrder(editingOrderId, updates);
              setPage("total-orders");
            }}
            onBack={() => setPage("total-orders")}
          />
        )}
        {page === "pending-order" && pendingOrderId && (
          <PendingOrderPage
            order={orders.find((o) => o.id === pendingOrderId)!}
            existingPendingDeliveries={pendingDeliveries}
            onBack={() => setPage("total-orders")}
            onSave={(delivery) => {
              addPendingDelivery(delivery);
              setPage("pending-delivery");
            }}
          />
        )}
        {page === "pending-delivery" && (
          <PendingDeliveryPage
            deliveries={pendingDeliveries}
            onBack={() => setPage("total-orders")}
            onDelete={deletePendingDelivery}
            onCompleteDelivery={goCompleteDeliveryForm}
          />
        )}
        {page === "complete-delivery-form" && completingDeliveryId && (
          <CompleteDeliveryFormPage
            delivery={
              pendingDeliveries.find((d) => d.id === completingDeliveryId)!
            }
            vehicles={vehicles}
            onBack={() => setPage("pending-delivery")}
            onSave={(cd) => {
              addCompleteDelivery(cd);
              setPage("complete-delivery");
            }}
          />
        )}
        {page === "complete-delivery" && (
          <CompleteDeliveryListPage
            deliveries={completeDeliveries}
            onBack={() => setPage("dashboard")}
            onDelete={deleteCompleteDelivery}
          />
        )}
        {page === "closed-orders" && (
          <ClosedOrdersPage
            orders={closedOrders}
            onBack={() => setPage("dashboard")}
            onDelete={(id) =>
              setOrders((prev) => prev.filter((o) => o.id !== id))
            }
          />
        )}
        {page === "settings" && (
          <Settings
            onBack={() => setPage("dashboard")}
            vehicles={vehicles}
            onSaveVehicle={saveVehicle}
            onDeleteVehicle={deleteVehicle}
            onEditVehicle={editVehicle}
          />
        )}
        {page === "reports" && (
          <ReportsPage
            completeDeliveries={completeDeliveries}
            onBack={() => setPage("dashboard")}
          />
        )}
        <BottomNav current={page} onChange={setPage} />
      </div>
      <Toaster />
    </div>
  );
}
