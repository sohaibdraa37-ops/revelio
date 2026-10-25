"use client";

import React, { useEffect } from "react";
import AdminDashboard from "../AdminDashboard";
import { useRevelioStore } from "../store-data";

export default function AdminRoutePage() {
  const hydrateFromCloud = useRevelioStore((state) => state.hydrateFromCloud);
  const isHydrated = useRevelioStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrateFromCloud();
    }
  }, [isHydrated, hydrateFromCloud]);

  return <AdminDashboard />;
}