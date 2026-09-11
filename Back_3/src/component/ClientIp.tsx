"use client";

import { useEffect, useState } from "react";

export function useClientIp(endpoint: string = "/Api/GetIP") {
  const [ip, setIp] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const data = await res.json();
        const value = (data?.ip as string) || "";
        if (!cancelled) setIp(value);
      } catch {
        if (!cancelled) setIp("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return ip; // ✅ رشته
}
