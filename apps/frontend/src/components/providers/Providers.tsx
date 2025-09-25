"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { ServiceWorkerProvider } from "./ServiceWorkerProvider";
import { SecurityProvider } from "./SecurityProvider";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <ServiceWorkerProvider>
        <AuthProvider>
          <SecurityProvider>
            {children}
          </SecurityProvider>
        </AuthProvider>
      </ServiceWorkerProvider>
    </ErrorBoundary>
  );
};