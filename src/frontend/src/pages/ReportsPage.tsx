import { ArrowLeft } from "lucide-react";

type Props = {
  completeDeliveries: unknown[];
  onBack: () => void;
};

export default function ReportsPage({ onBack }: Props) {
  return (
    <div className="flex flex-col flex-1 pb-16">
      <div className="sticky top-0 z-10 bg-[oklch(0.25_0.08_145)] text-white px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <span className="font-bold text-base flex-1">REPORTS</span>
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        কোনো রিপোর্ট উপলব্ধ নেই
      </div>
    </div>
  );
}
