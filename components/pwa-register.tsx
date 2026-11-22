"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js?v=8").catch(() => {
        /* ignore */
      });
    }
  }, []);
  return null;
}
