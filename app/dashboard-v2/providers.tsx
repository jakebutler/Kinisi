"use client";

import React from "react";
import { UserProvider } from "@/lib/v2/contexts/UserContext";
import { UIProvider } from "@/lib/v2/contexts/UIContext";

export default function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <UIProvider>{children}</UIProvider>
    </UserProvider>
  );
}
