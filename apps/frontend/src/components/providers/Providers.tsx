"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { ServiceWorkerProvider } from "./ServiceWorkerProvider";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <ServiceWorkerProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ServiceWorkerProvider>
    </ErrorBoundary>
  );
};