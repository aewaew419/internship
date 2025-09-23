"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { NavItem } from "@/types/navigation";
import { PROTECTED_PATH } from "@/constants/navigation";
import { NotificationBell } from "./NotificationBell/NotificationBell";
import Image from "next/image";

interface DesktopNavbarProps {
  navItems: NavItem[];
}

export const DesktopNavbar = ({ navItems }: DesktopNavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

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

  return (
    <nav
      className="bg-white fixed h-screen overflow-y-auto shadow-lg z-30 w-64"
      style={{ scrollbarColor: "#c6c8d1 #e3e5e9", scrollbarWidth: "thin" }}
    >
      <div className="container">
        {/* Logo Section */}
        <div className="py-5 mx-5 border-b-2 border-text-200">
          <div className="flex items-center justify-between">
            <Image
              src="/logo.png"
              alt="Internship Management System"
              width={64}
              height={64}
              className="h-16 w-auto"
              priority
            />
            {/* Notification Bell */}
            <NotificationBell
              size="md"
              showBadge={true}
              animate={true}
              mobileOptimized={false}
              showDropdown={true}
              dropdownPosition="right"
              maxDropdownItems={5}
              className="text-text-600 hover:text-text-900"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <ul className="mx-5">
            {/* Dashboard Link */}
            <li
              onClick={() => router.push(PROTECTED_PATH.DASHBOARD)}
              className={`${
                isActivePath(PROTECTED_PATH.DASHBOARD)
                  ? "text-white bg-gradient"
                  : "hover:bg-gray-100 text-text-800"
              } flex gap-2 font-bold my-5 py-3 px-5 rounded-lg cursor-pointer transition-colors duration-300`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="ml-2 my-auto w-32 text-sm">หน้าแรก</p>
            </li>

            {/* Role-based Navigation Items */}
            {navItems.map((item) => (
              <li
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`${
                  isActivePath(item.path)
                    ? "text-white bg-gradient"
                    : "hover:bg-gray-100 text-text-800"
                } flex gap-2 font-bold my-5 py-3 px-5 rounded-lg cursor-pointer transition-colors duration-300`}
              >
                {item.icon}
                <p className="ml-2 my-auto w-32 text-sm">{item.name}</p>
              </li>
            ))}
          </ul>

          {/* Logout Button */}
          <div className="mt-auto mx-5 pb-5">
            <button
              onClick={handleLogout}
              className="w-full hover:bg-gray-100 text-error flex gap-2 font-bold my-5 pb-2 pt-3 px-5 rounded-lg cursor-pointer transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <p>ออกจากระบบ</p>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};