import { useEffect, type ReactNode } from "react";
import { registerSW } from "virtual:pwa-register";
import { ensureDefaultProfile } from "@/db/repositories/profileRepo";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    ensureDefaultProfile();
    registerSW({ immediate: true });
  }, []);

  return children;
}
