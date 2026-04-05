import { Input } from "@/components/ui/input";
import { isWithinInterval, parse } from "date-fns";
import { ArrowLeft, Calendar, Clock, Edit2, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order } from "../App";
import AddPaymentModal from "../components/modals/AddPaymentModal";
import OrderHistoryModal from "../components/modals/OrderHistoryModal";

type Props = {
  orders: Order[];
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPayment: (orderId: string, amount: number) => void;
  onPendingOrder: (id: string) => void;
};

export default function TotalOrders({
  orders,
  onBack,
  onEdit,
  onDelete,
  onAddPayment,
  onPendingOrder,
}: Props) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtered, setFiltered] = useState<Order[]>(orders);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  const applyFilter = () => {
    let result = orders;
    if (search.trim()) {
      result = result.filter((o) =>
        o.customerName.toLowerCase().includes(search.trim().toLowerCase()),
      );
    }
    if (fromDate && toDate) {
      try {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        result = result.filter((o) => {
          try {
            const d = parse(o.orderDate, "dd/MM/yyyy", new Date());
            return isWithinInterval(d, { start: from, end: to });
          } catch {
            return true;
          }
        });
      } catch {
        // ignore
      }
    }
    setFiltered(result);
  };

  const displayOrders = search.trim() || fromDate ? filtered : orders;

  const handleDelete = (id: string) => {
    if (confirm("এই অর্ডারটি ডিলিট করবেন?")) {
      onDelete(id);
      toast.success("অর্ডার ডিলিট হয়েছে");
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-16 bg-[#edf5ed] min-h-screen">
      <header className="bg-[#1a3c2a] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="hover:opacity-70">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-extrabold uppercase tracking-widest">
            ALL ORDERS
          </h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#2e5c40] flex items-center justify-center text-white font-bold text-sm">
          {orders.length}
        </div>
      </header>

      <div className="flex flex-col gap-3 p-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name..."
            className="border-0 focus-visible:ring-0 text-sm py-3"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            FILTER BY DATE
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                FROM
              </span>
              <div className="flex items-center border border-[#c5dfc5] rounded-lg px-2 py-2 gap-2">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-xs flex-1 outline-none bg-transparent"
                />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                TO
              </span>
              <div className="flex items-center border border-[#c5dfc5] rounded-lg px-2 py-2 gap-2">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-xs flex-1 outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={applyFilter}
            className="bg-[#1a3c2a] text-white font-bold uppercase tracking-widest text-xs py-3 rounded-lg mt-1"
          >
            APPLY FILTER
          </button>
        </div>

        {displayOrders.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white rounded-xl">
            কোনো অর্ডার নেই
          </div>
        ) : (
          displayOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onHistory={() => setHistoryOrder(order)}
              onEdit={() => onEdit(order.id)}
              onDelete={() => handleDelete(order.id)}
              onAddPayment={() => setPaymentOrder(order)}
              onPendingOrder={() => onPendingOrder(order.id)}
            />
          ))
        )}
      </div>

      {historyOrder && (
        <OrderHistoryModal
          order={historyOrder}
          onClose={() => setHistoryOrder(null)}
        />
      )}
      {paymentOrder && (
        <AddPaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onConfirm={(amount) => {
            onAddPayment(paymentOrder.id, amount);
            setPaymentOrder(null);
            toast.success("Payment added!");
          }}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  onHistory,
  onEdit,
  onDelete,
  onAddPayment,
  onPendingOrder,
}: {
  order: Order;
  onHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPayment: () => void;
  onPendingOrder: () => void;
}) {
  // Use bricksDue/batsDue fields; fall back to totalBricks/batsSafety for old records
  const bricksDue =
    order.bricksDue !== undefined ? order.bricksDue : order.totalBricks;
  const batsDue =
    order.batsDue !== undefined ? order.batsDue : order.batsSafety;

  // Billing is active only when Approx Date is set
  const billingActive = !!(
    order.approxDeliveryDate && order.approxDeliveryDate.trim() !== ""
  );

  // Show purple dot only if approxDeliveryDate is set
  const showPurpleDot = billingActive;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-gray-900">
              {order.customerName}
            </span>
            {showPurpleDot && (
              <span className="relative inline-flex items-center justify-center w-8 h-8 flex-shrink-0">
                <span className="animate-ping-fast absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-90" />
                <span className="relative inline-flex rounded-full w-3 h-3 bg-purple-600" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onHistory}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Clock size={15} className="text-gray-500" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-50 transition-colors"
            >
              <Edit2 size={15} className="text-blue-500" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} className="text-red-500" />
            </button>
            <button
              type="button"
              onClick={onPendingOrder}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-orange-50 transition-colors"
              title="Pending Delivery"
            >
              <Truck size={15} className="text-orange-500" />
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-2">
          {order.address && <span>{order.address}</span>}
          {order.address && order.invoice && <span> · </span>}
          {order.invoice && <span>{order.invoice}</span>}
        </div>

        <div className="flex items-center gap-3 flex-wrap mb-1">
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>📅</span>
            <span className="font-semibold">{order.orderDate}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>📞</span>
            <a
              href={`tel:${order.phone}`}
              className="font-semibold text-blue-600 underline"
            >
              {order.phone}
            </a>
          </div>
          <span className="border border-gray-300 rounded-full px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            {order.locationType}
          </span>
        </div>

        {order.approxDeliveryDate && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <span>🚛</span>
            <span className="font-semibold">{order.approxDeliveryDate}</span>
          </div>
        )}

        {order.brickItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {order.brickItems.map((b) => (
              <span
                key={b.type}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                  b.type === "Bats"
                    ? "bg-[#fff7e6] border-[#e8b84b] text-[#b87333]"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                {b.type === "Bats"
                  ? `Bats Safety: ${b.quantity}`
                  : `${b.type}: ${b.quantity.toLocaleString()}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {billingActive && (
        <div className="border-t border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
          {[
            {
              label: "BRICKS",
              value: order.totalBricks.toLocaleString(),
              color: "text-gray-900",
            },
            {
              label: "TOTAL",
              value: order.totalAmount.toLocaleString(),
              color: "text-gray-900",
            },
            {
              label: "PAID",
              value: order.paidAmount.toLocaleString(),
              color: "text-gray-900",
            },
            {
              label: "DUE",
              value: order.dueAmount.toLocaleString(),
              color: "text-red-500",
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
      )}

      {billingActive && (
        <div className="border-t border-gray-100 flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase block">
                BRICKS DUE
              </span>
              <span className="text-base font-extrabold text-orange-500">
                {bricksDue.toLocaleString()}
              </span>
            </div>
            {batsDue > 0 && (
              <div>
                <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase block">
                  BATS DUE
                </span>
                <span className="text-base font-extrabold text-orange-500">
                  {batsDue}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onAddPayment}
            className="bg-[#1a3c2a] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-[#2a5c3a] transition-colors"
          >
            <span>💳</span> Add Payment
          </button>
        </div>
      )}
    </div>
  );
}
