import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";

type Props = {
  onClose: () => void;
};

export default function SettingsModal({ onClose }: Props) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="settings.dialog"
        className="max-w-[460px] mx-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-[oklch(0.25_0.08_145)] uppercase tracking-wide">
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-[oklch(0.88_0.07_145)] flex items-center justify-center">
            <Settings size={32} className="text-[oklch(0.25_0.08_145)]" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-[oklch(0.25_0.08_145)] uppercase tracking-tight">
              SAHA BRICK FIELD
            </h2>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
              Orders &amp; Brick Management
            </p>
          </div>
          <div className="w-full bg-muted rounded-lg p-4 text-sm text-center text-muted-foreground">
            Business management dashboard for tracking orders, deliveries, and
            payments.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
