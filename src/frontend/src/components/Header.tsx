import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = time.toLocaleTimeString("en-IN");

  return (
    <header className="bg-[oklch(0.25_0.08_145)] text-white text-center py-5 px-4">
      <h1 className="text-2xl font-extrabold tracking-tight uppercase">
        SAHA BRICK FIELD
      </h1>
      <p className="text-xs font-semibold tracking-widest text-[oklch(0.8_0.08_145)] mt-0.5 uppercase">
        Orders &amp; Brick Management
      </p>
      <p className="text-sm font-bold mt-2 text-[oklch(0.9_0.06_145)]">
        {dateStr} &bull; {timeStr}
      </p>
    </header>
  );
}
