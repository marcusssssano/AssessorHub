"use client";

import { useEffect, useState } from "react";
import { formatPacificDateTime } from "@/lib/time";

export default function PacificClock({ className }: { className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setText(formatPacificDateTime());
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Render nothing until mounted, so the server-rendered markup never mismatches the client's clock.
  if (!text) return null;

  return <span className={className}>{text}</span>;
}
