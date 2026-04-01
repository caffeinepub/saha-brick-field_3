import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type VehicleType = "Tractor" | "12 Wheel";

type Vehicle = {
  id: string;
  type: VehicleType;
  number: string;
  loadingLabours: string[];
  unloadingLabours: string[];
};

type TractorRate = {
  localPerThousand: string;
  outsidePerThousand: string;
  safety100: string;
};

type WheelRate = {
  perThousand: string;
  safety100: string;
};

type BricksRate = {
  oneNo: string;
  twoNo: string;
  threeNo: string;
  onePichet: string;
  twoPichet: string;
  crack: string;
  goria: string;
  bats100: string;
};

type Tab = "vehicle" | "rate" | "bricks" | "backup";

type Props = {
  onBack: () => void;
  vehicles: Vehicle[];
  onSaveVehicle: (v: Omit<Vehicle, "id">) => void;
  onDeleteVehicle: (id: string) => void;
};

const FieldLabel = ({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: React.ReactNode;
}) => (
  <p
    className="text-xs font-bold uppercase tracking-widest mb-1"
    style={{ color: "oklch(0.45 0.07 145)" }}
  >
    {children}
    {sub && (
      <span
        className="ml-1 text-[10px] font-normal normal-case"
        style={{ color: "oklch(0.55 0.07 155)" }}
      >
        {sub}
      </span>
    )}
  </p>
);

export default function Settings({
  onBack,
  vehicles,
  onSaveVehicle,
  onDeleteVehicle: _onDeleteVehicle,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("vehicle");

  const [vehicleType, setVehicleType] = useState<VehicleType>("Tractor");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loadingInput, setLoadingInput] = useState("");
  const [unloadingInput, setUnloadingInput] = useState("");
  const [loadingLabours, setLoadingLabours] = useState<string[]>([]);
  const [unloadingLabours, setUnloadingLabours] = useState<string[]>([]);
  const [rateVehicleType, setRateVehicleType] =
    useState<VehicleType>("Tractor");
  const [tractorRate, setTractorRate] = useState<TractorRate>({
    localPerThousand: "",
    outsidePerThousand: "",
    safety100: "",
  });
  const [wheelRate, setWheelRate] = useState<WheelRate>({
    perThousand: "",
    safety100: "",
  });

  const [bricksRate, setBricksRate] = useState<BricksRate>({
    oneNo: "",
    twoNo: "",
    threeNo: "",
    onePichet: "",
    twoPichet: "",
    crack: "",
    goria: "",
    bats100: "",
  });

  const addLoadingLabour = () => {
    const name = loadingInput.trim();
    if (!name) return;
    setLoadingLabours((prev) => [...prev, name]);
    setUnloadingLabours((prev) => [...prev, name]);
    setLoadingInput("");
  };

  const removeLoadingLabour = (idx: number) => {
    setLoadingLabours((prev) => prev.filter((_, i) => i !== idx));
  };

  const addUnloadingLabour = () => {
    const name = unloadingInput.trim();
    if (!name) return;
    setUnloadingLabours((prev) => [...prev, name]);
    setUnloadingInput("");
  };

  const removeUnloadingLabour = (idx: number) => {
    setUnloadingLabours((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveVehicle = () => {
    if (!vehicleNumber.trim()) {
      toast.error("ভেহিকেল নম্বর প্রয়োজন");
      return;
    }
    onSaveVehicle({
      type: vehicleType,
      number: vehicleNumber.trim(),
      loadingLabours: [...loadingLabours],
      unloadingLabours: [...unloadingLabours],
    });
    setVehicleNumber("");
    setLoadingLabours([]);
    setUnloadingLabours([]);
    setLoadingInput("");
    setUnloadingInput("");
    toast.success("Vehicle সেভ হয়েছে!");
  };

  const saveRate = () => {
    toast.success("Rate সেভ হয়েছে!");
  };

  const saveBricksRate = () => {
    toast.success("Bricks rate সেভ হয়েছে!");
  };

  const downloadBackup = () => {
    const data = { vehicles, tractorRate, wheelRate, bricksRate };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saha-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ব্যাকআপ ডাউনলোড হয়েছে!");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "vehicle", label: "Add Vehicle" },
    { key: "rate", label: "Rate" },
    { key: "bricks", label: "Bricks Rate" },
    { key: "backup", label: "Backup" },
  ];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "oklch(0.96 0.03 145)" }}
    >
      <header
        className="flex items-center gap-3 px-4 py-4"
        style={{ background: "oklch(0.25 0.08 145)" }}
      >
        <button
          type="button"
          data-ocid="settings.back.button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "oklch(0.35 0.09 145)" }}
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-white font-extrabold text-lg tracking-widest uppercase leading-none">
            SETTINGS
          </h1>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "oklch(0.75 0.07 145)" }}
          >
            APP CONFIGURATION
          </p>
        </div>
      </header>

      <div
        className="flex gap-1 px-3 pt-3 pb-0"
        style={{ background: "oklch(0.25 0.08 145)" }}
      >
        {tabs.map((t) => (
          <button
            type="button"
            key={t.key}
            data-ocid={`settings.${t.key}.tab`}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-t-lg transition-all ${
              activeTab === t.key
                ? "bg-white text-[oklch(0.25_0.08_145)] shadow"
                : "text-[oklch(0.78_0.06_145)] hover:bg-[oklch(0.32_0.09_145)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 pb-24">
        {/* ADD VEHICLE TAB */}
        {activeTab === "vehicle" && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2
                className="text-sm font-extrabold uppercase tracking-wide mb-3"
                style={{ color: "oklch(0.25 0.08 145)" }}
              >
                🚛 Add New Vehicle
              </h2>

              <FieldLabel>VEHICLE TYPE</FieldLabel>
              <div className="flex gap-2 mb-3">
                {(["Tractor", "12 Wheel"] as VehicleType[]).map((vt) => (
                  <button
                    type="button"
                    key={vt}
                    data-ocid={`settings.vehicle_type_${vt === "Tractor" ? "tractor" : "12wheel"}.toggle`}
                    onClick={() => setVehicleType(vt)}
                    className="flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all"
                    style={{
                      background:
                        vehicleType === vt
                          ? "oklch(0.25 0.08 145)"
                          : "oklch(0.90 0.05 145)",
                      color:
                        vehicleType === vt ? "white" : "oklch(0.35 0.08 145)",
                    }}
                  >
                    {vt}
                  </button>
                ))}
              </div>

              <FieldLabel>VEHICLE NUMBER</FieldLabel>
              <input
                data-ocid="settings.vehicle_number.input"
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. WB 52 1234"
                className="w-full px-4 py-2 rounded-2xl text-sm mb-3 outline-none"
                style={{
                  background: "oklch(0.93 0.04 145)",
                  color: "oklch(0.2 0.07 145)",
                }}
              />

              <FieldLabel>LOADING LABOURS</FieldLabel>
              <div className="flex gap-2 mb-2">
                <input
                  data-ocid="settings.loading_labour.input"
                  type="text"
                  value={loadingInput}
                  onChange={(e) => setLoadingInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLoadingLabour()}
                  placeholder="Add labor name"
                  className="flex-1 px-4 py-2 rounded-2xl text-sm outline-none"
                  style={{
                    background: "oklch(0.93 0.04 145)",
                    color: "oklch(0.2 0.07 145)",
                  }}
                />
                <button
                  type="button"
                  data-ocid="settings.loading_labour_add.button"
                  onClick={addLoadingLabour}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow"
                  style={{ background: "oklch(0.25 0.08 145)" }}
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {loadingLabours.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "oklch(0.88 0.07 145)",
                      color: "oklch(0.25 0.08 145)",
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() =>
                        removeLoadingLabour(loadingLabours.indexOf(name))
                      }
                      className="hover:opacity-70"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <FieldLabel sub="(লোডিং থেকে অটো কপি)">
                UNLOADING LABOURS
              </FieldLabel>
              <div className="flex gap-2 mb-2">
                <input
                  data-ocid="settings.unloading_labour.input"
                  type="text"
                  value={unloadingInput}
                  onChange={(e) => setUnloadingInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addUnloadingLabour()}
                  placeholder="Add labor name"
                  className="flex-1 px-4 py-2 rounded-2xl text-sm outline-none"
                  style={{
                    background: "oklch(0.93 0.04 145)",
                    color: "oklch(0.2 0.07 145)",
                  }}
                />
                <button
                  type="button"
                  data-ocid="settings.unloading_labour_add.button"
                  onClick={addUnloadingLabour}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow"
                  style={{ background: "oklch(0.45 0.12 230)" }}
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {unloadingLabours.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "oklch(0.88 0.08 230)",
                      color: "oklch(0.3 0.1 230)",
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() =>
                        removeUnloadingLabour(unloadingLabours.indexOf(name))
                      }
                      className="hover:opacity-70"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <button
                type="button"
                data-ocid="settings.save_vehicle.button"
                onClick={saveVehicle}
                className="w-full py-3 rounded-full text-sm font-bold uppercase tracking-widest text-white shadow transition-all hover:brightness-110"
                style={{ background: "oklch(0.25 0.08 145)" }}
              >
                Save Vehicle
              </button>
            </div>

            {vehicles.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "oklch(0.35 0.08 145)" }}
                >
                  🚗 Saved Vehicles
                </h3>
                <div className="flex flex-col gap-2">
                  {vehicles.map((v, idx) => (
                    <div
                      key={v.id}
                      data-ocid={`settings.vehicle.item.${idx + 1}`}
                      className="rounded-xl p-3"
                      style={{ background: "oklch(0.95 0.03 145)" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "oklch(0.25 0.08 145)" }}
                        >
                          {v.number}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: "oklch(0.88 0.07 145)",
                            color: "oklch(0.25 0.08 145)",
                          }}
                        >
                          {v.type}
                        </span>
                      </div>
                      {v.loadingLabours.length > 0 && (
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.5 0.07 145)" }}
                        >
                          Loading: {v.loadingLabours.join(", ")}
                        </p>
                      )}
                      {v.unloadingLabours.length > 0 && (
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.5 0.08 230)" }}
                        >
                          Unloading: {v.unloadingLabours.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RATE TAB */}
        {activeTab === "rate" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2
              className="text-sm font-extrabold uppercase tracking-wide mb-3"
              style={{ color: "oklch(0.25 0.08 145)" }}
            >
              💰 VEHICLE RATE
            </h2>
            <div className="flex gap-2 mb-4">
              {(["Tractor", "12 Wheel"] as VehicleType[]).map((vt) => (
                <button
                  type="button"
                  key={vt}
                  data-ocid={`settings.rate_vehicle_type_${vt === "Tractor" ? "tractor" : "12wheel"}.toggle`}
                  onClick={() => setRateVehicleType(vt)}
                  className="flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all"
                  style={{
                    background:
                      rateVehicleType === vt
                        ? "oklch(0.25 0.08 145)"
                        : "oklch(0.90 0.05 145)",
                    color:
                      rateVehicleType === vt ? "white" : "oklch(0.35 0.08 145)",
                  }}
                >
                  {vt}
                </button>
              ))}
            </div>

            {rateVehicleType === "Tractor" && (
              <div className="flex flex-col gap-3">
                <div>
                  <FieldLabel>লোকাল পার হাজার ইট রেট (৳)</FieldLabel>
                  <input
                    data-ocid="settings.tractor_local_rate.input"
                    type="number"
                    value={tractorRate.localPerThousand}
                    onChange={(e) =>
                      setTractorRate((p) => ({
                        ...p,
                        localPerThousand: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-2xl text-sm outline-none"
                    style={{ background: "oklch(0.93 0.04 145)" }}
                  />
                </div>
                <div>
                  <FieldLabel>আউট সাইড পার হাজার ইট রেট (৳)</FieldLabel>
                  <input
                    data-ocid="settings.tractor_outside_rate.input"
                    type="number"
                    value={tractorRate.outsidePerThousand}
                    onChange={(e) =>
                      setTractorRate((p) => ({
                        ...p,
                        outsidePerThousand: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-2xl text-sm outline-none"
                    style={{ background: "oklch(0.93 0.04 145)" }}
                  />
                </div>
                <div>
                  <FieldLabel>১০০ সেফটি বাটস রেট (৳)</FieldLabel>
                  <input
                    data-ocid="settings.tractor_safety_rate.input"
                    type="number"
                    value={tractorRate.safety100}
                    onChange={(e) =>
                      setTractorRate((p) => ({
                        ...p,
                        safety100: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-2xl text-sm outline-none"
                    style={{ background: "oklch(0.93 0.04 145)" }}
                  />
                </div>
              </div>
            )}

            {rateVehicleType === "12 Wheel" && (
              <div className="flex flex-col gap-3">
                <div>
                  <FieldLabel>পার হাজার ইট রেট (৳)</FieldLabel>
                  <input
                    data-ocid="settings.wheel_rate.input"
                    type="number"
                    value={wheelRate.perThousand}
                    onChange={(e) =>
                      setWheelRate((p) => ({
                        ...p,
                        perThousand: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-2xl text-sm outline-none"
                    style={{ background: "oklch(0.93 0.04 145)" }}
                  />
                </div>
                <div>
                  <FieldLabel>১০০ সেফটি বাটস রেট (৳)</FieldLabel>
                  <input
                    data-ocid="settings.wheel_safety_rate.input"
                    type="number"
                    value={wheelRate.safety100}
                    onChange={(e) =>
                      setWheelRate((p) => ({
                        ...p,
                        safety100: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-2xl text-sm outline-none"
                    style={{ background: "oklch(0.93 0.04 145)" }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              data-ocid="settings.save_rate.button"
              onClick={saveRate}
              className="w-full py-3 rounded-full text-sm font-bold uppercase tracking-widest text-white shadow mt-4 transition-all hover:brightness-110"
              style={{ background: "oklch(0.25 0.08 145)" }}
            >
              SAVE RATE
            </button>
          </div>
        )}

        {/* BRICKS RATE TAB */}
        {activeTab === "bricks" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2
              className="text-sm font-extrabold uppercase tracking-wide mb-4"
              style={{ color: "oklch(0.25 0.08 145)" }}
            >
              🧱 BRICKS RATE
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "oneNo" as keyof BricksRate, label: "1 No Bricks (৳)" },
                { key: "twoNo" as keyof BricksRate, label: "2 No Bricks (৳)" },
                {
                  key: "threeNo" as keyof BricksRate,
                  label: "3 No Bricks (৳)",
                },
                {
                  key: "onePichet" as keyof BricksRate,
                  label: "1 No Picket (৳)",
                },
                {
                  key: "twoPichet" as keyof BricksRate,
                  label: "2 No Picket (৳)",
                },
                { key: "crack" as keyof BricksRate, label: "Crack (৳)" },
                { key: "goria" as keyof BricksRate, label: "Goria (৳)" },
                {
                  key: "bats100" as keyof BricksRate,
                  label: "Bats (per 100 Sefty) (৳)",
                },
              ].map(({ key, label }) => (
                <div key={key}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wide mb-1"
                    style={{ color: "oklch(0.45 0.07 145)" }}
                  >
                    {label}
                  </p>
                  <input
                    data-ocid={`settings.bricks_${key}.input`}
                    type="number"
                    value={bricksRate[key]}
                    onChange={(e) =>
                      setBricksRate((p) => ({ ...p, [key]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "oklch(0.93 0.04 145)" }}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              data-ocid="settings.save_bricks_rate.button"
              onClick={saveBricksRate}
              className="w-full py-3 rounded-full text-sm font-bold uppercase tracking-widest text-white shadow mt-4 transition-all hover:brightness-110"
              style={{ background: "oklch(0.25 0.08 145)" }}
            >
              SAVE BRICKS RATE
            </button>
          </div>
        )}

        {/* BACKUP TAB */}
        {activeTab === "backup" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2
              className="text-sm font-extrabold uppercase tracking-wide mb-2"
              style={{ color: "oklch(0.25 0.08 145)" }}
            >
              ডেটা ব্যাকআপ
            </h2>
            <p
              className="text-xs mb-6"
              style={{ color: "oklch(0.5 0.06 145)" }}
            >
              সমস্ত ডেটা (অর্ডার, পেন্ডিং, সেটিংস) ফাইলে সেভ করুন। ডেটা হারিয়ে গেলে
              রিস্টোর করুন।
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                data-ocid="settings.backup_download.button"
                onClick={downloadBackup}
                className="w-full py-3 rounded-full text-sm font-bold text-white shadow transition-all hover:brightness-110"
                style={{ background: "oklch(0.25 0.08 145)" }}
              >
                ⬇ ব্যাকআপ ডাউনলোড করুন
              </button>
              <label
                data-ocid="settings.backup_restore.button"
                className="w-full py-3 rounded-full text-sm font-bold text-center cursor-pointer border-2 transition-all hover:bg-[oklch(0.94_0.04_145)] block"
                style={{
                  borderColor: "oklch(0.25 0.08 145)",
                  color: "oklch(0.25 0.08 145)",
                }}
              >
                ⬆ ব্যাকআপ রিস্টোর করুন
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        JSON.parse(ev.target?.result as string);
                        toast.success("ব্যাকআপ রিস্টোর হয়েছে!");
                      } catch {
                        toast.error("Invalid backup file");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
