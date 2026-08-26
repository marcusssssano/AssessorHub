"use client";

import { useEffect, useState } from "react";

export default function UserBadge() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    try {
      setName(sessionStorage.getItem("ah_user_name"));
    } catch {
      // sessionStorage unavailable — just skip the badge.
    }
  }, []);

  if (!name) return null;

  return (
    <span className="text-xs text-white/50 font-normal">
      {" "}
      · {name}&apos;s Dashboard
    </span>
  );
}
