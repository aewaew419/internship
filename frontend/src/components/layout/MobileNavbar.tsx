"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { NavItem } from "@/types/navigation";
import { PROTECTED_PATH } from "@/constants/navigation";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import Image from "next/image";

interface MobileNavbarProps {
  navItems: NavItem[];
}

export const MobileNavbar = ({ navItems }: MobileNavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);

  // Swipe gesture for closing sidebar
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (isOpen) {
        handleCloseMenu();
      }
    },
    threshold: 50,
  });

  // Close menu when route changes
  useEffect(() => {
    if (isOpen) {
      handleCloseMenu();
    }
  }, [pathname]);

  // Handle menu opening with animation
  const handleOpenMenu = () => {
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Handle menu closing with animation
  const handleCloseMenu = () => {
    setIsAnimating(true);
    setIsOpen(false);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActivePath = (path: string) => {
    if (path === PROTECTED_PATH.DASHBOARD) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleCloseMenu();
  };

  // Combine refs for swipe gesture
  useEffect(() => {
    if (sidebarRef.current && swipeRef.current) {
      swipeRef.current = sidebarRef.current;
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Internship Management System"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="ml-2 text-lg font-semibold text-text-900 truncate">
              ระบบจัดการฝึกงาน
            </span>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => isOpen ? handleCloseMenu() : handleOpenMenu()}
            className="btn-touch p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="เปิด/ปิดเมนู"
            disabled={isAnimating}
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${
                isOpen ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="mobile-nav-overlay md:hidden animate-in fade-in-0"
          onClick={handleCloseMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <nav
        ref={(el) => {
          sidebarRef.current = el;
          if (swipeRef.current) {
            swipeRef.current = el;
          }
        }}
        className={`mobile-nav-sidebar md:hidden ${
          isOpen ? "open animate-in slide-in-from-left" : "animate-out slide-out-to-left"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-text-200">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Internship Management System"
                width={48}
                height={48}
                className="h-12 w-auto"
                priority
              />
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-text-900">
                  ระบบจัดการฝึกงาน
                </h2>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-4">
              {/* Dashboard Link */}
              <li>
                <button
                  onClick={() => handleNavigation(PROTECTED_PATH.DASHBOARD)}
                  className={`${
                    isActivePath(PROTECTED_PATH.DASHBOARD)
                      ? "text-white bg-gradient"
                      : "hover:bg-gray-100 text-text-800"
                  } w-full flex items-center gap-3 font-medium py-3 px-4 rounded-lg transition-all duration-300 btn-touch mobile-nav-item touch-feedback relative`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm">หน้าแรก</span>
                  {/* Swipe indicator */}
                  <div className="swipe-indicator">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              </li>

              {/* Role-based Navigation Items */}
              {navItems.map((item, index) => (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`${
                      isActivePath(item.path)
                        ? "text-white bg-gradient"
                        : "hover:bg-gray-100 text-text-800"
                    } w-full flex items-center gap-3 font-medium py-3 px-4 rounded-lg transition-all duration-300 btn-touch mobile-nav-item touch-feedback relative`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-sm text-left">{item.name}</span>
                    {/* Swipe indicator */}
                    <div className="swipe-indicator">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-text-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 font-medium py-3 px-4 rounded-lg text-error hover:bg-error/10 transition-all duration-300 btn-touch mobile-nav-item touch-feedback"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};