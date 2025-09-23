"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { ServiceWorkerProvider } from "./ServiceWorkerProvider";
import { NotificationProvider } from "./NotificationProvider";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <ServiceWorkerProvider>
        <AuthProvider>
          <NotificationProvider
            enableRealTime={true}
            cacheEnabled={true}
            autoFetch={true}
            fetchInterval={30000}
          >
            {children}
          </NotificationProvider>
        </AuthProvider>
      </ServiceWorkerProvider>
    </ErrorBoundary>
  );
};