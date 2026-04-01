import { LayoutDashboard, PlusCircle, Truck } from "lucide-react";
import type { Page } from "../App";

type Props = {
  current: Page;
  onChange: (page: Page) => void;
};

export default function BottomNav({ current, onChange }: Props) {
  const items: {
    page: Page;
    label: string;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  }[] = [
    { page: "dashboard", label: "DASHBOARD", Icon: LayoutDashboard },
    { page: "add-order", label: "ADD ORDER", Icon: PlusCircle },
    { page: "direct-delivery", label: "DIRECT DELIVERY", Icon: Truck },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-50 bg-[oklch(0.25_0.08_145)] flex">
      {items.map(({ page, label, Icon }) => (
        <button
          key={page}
          type="button"
          data-ocid={`nav.${page}.button`}
          onClick={() => onChange(page)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
            current === page
              ? "bg-[oklch(0.35_0.1_145)] text-white"
              : "text-[oklch(0.8_0.06_145)] hover:text-white"
          }`}
        >
          <Icon size={20} strokeWidth={2} />
          <span className="text-[10px] font-bold tracking-wide">{label}</span>
        </button>
      ))}
    </nav>
  );
}
