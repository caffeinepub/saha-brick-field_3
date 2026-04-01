import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import BottomNav from "./components/BottomNav";
import AddOrder from "./pages/AddOrder";
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
  totalAmount: number;
  totalLabours: number;
  perLabourAvg: number;
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
  | "complete-delivery";

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
      "id" | "createdAt" | "status" | "paymentHistory" | "deliveryHistory"
    >,
  ) => {
    setOrders((prev) => [
      ...prev,
      {
        ...order,
        id: crypto.randomUUID(),
        status: "open",
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
        return {
          ...o,
          paidAmount: newPaid,
          dueAmount: o.totalAmount - newPaid,
          paymentHistory: [...o.paymentHistory, record],
        };
      }),
    );
  };

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
            onGoSettings={() => setPage("settings")}
            onGoReports={() => setPage("reports")}
          />
        )}
        {page === "add-order" && (
          <AddOrder onSubmit={addOrder} onBack={() => setPage("dashboard")} />
        )}
        {page === "direct-delivery" && (
          <DirectDelivery
            onSubmit={addDelivery}
            onBack={() => setPage("dashboard")}
          />
        )}
        {page === "total-orders" && (
          <TotalOrders
            orders={orders}
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
            onBack={() => setPage("pending-delivery")}
            onDelete={deleteCompleteDelivery}
          />
        )}
        {page === "settings" && (
          <Settings
            onBack={() => setPage("dashboard")}
            vehicles={vehicles}
            onSaveVehicle={saveVehicle}
            onDeleteVehicle={deleteVehicle}
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
