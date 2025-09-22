"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ResponsiveNavigation } from "./ResponsiveNavigation";
import { ResponsiveBreadcrumb } from "./ResponsiveBreadcrumb";
import { BottomNavigation } from "./BottomNavigation";
import { QuickActions } from "./QuickActions";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { LoadingScreen } from "@/components/ui/LoadingSpinner";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="กำลังตรวจสอบการเข้าสู่ระบบ..." />;
  }

  // If user is not authenticated, don't show layout
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-bg-100">
      {/* Navigation */}
      <ResponsiveNavigation />

      {/* Main Content */}
      <main
        className={`flex-1 ${
          isMobile 
            ? "pt-0 pb-20" // Mobile has fixed header and bottom nav
            : "ml-64 p-4" // Desktop has fixed sidebar
        }`}
      >
        {/* Breadcrumb */}
        <ResponsiveBreadcrumb />

        {/* Page Content */}
        <div className={`${isMobile ? "px-4 pb-4" : ""}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Quick Actions Menu */}
      <QuickActions />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
};

// Popup Layout for modals and overlays
interface PopupLayoutProps {
  children: ReactNode;
  onClose?: () => void;
}

export const PopupLayout = ({ children, onClose }: PopupLayoutProps) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black/50 flex justify-center items-center z-[1000] backdrop-blur-sm p-4">
      <div className="bg-white py-4 px-6 md:px-10 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn-touch p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="ปิด"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
};