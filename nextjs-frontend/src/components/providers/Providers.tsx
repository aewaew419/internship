"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
};