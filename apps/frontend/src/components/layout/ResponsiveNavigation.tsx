"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { DesktopNavbar } from "./DesktopNavbar";
import { MobileNavbar } from "./MobileNavbar";
import {
  getStudentNavItems,
  getAdminNavItems,
  getInstructorNavItems,
  getCommitteeNavItems,
  getVisitorNavItems,
} from "@/constants/navigation";
import { NavItem } from "@/types/navigation";

export const ResponsiveNavigation = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Get navigation items based on user roles
  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    const navItems: NavItem[] = [];

    // Add navigation items based on user roles
    if (user.roles.student) {
      navItems.push(...getStudentNavItems());
    }

    if (user.roles.courseInstructor) {
      navItems.push(...getInstructorNavItems());
    }

    if (user.roles.committee) {
      navItems.push(...getCommitteeNavItems());
    }

    if (user.roles.visitor) {
      navItems.push(...getVisitorNavItems());
    }

    // Admin role (roleId === 1)
    if (user.user.roleId === 1) {
      navItems.push(...getAdminNavItems());
    }

    return navItems;
  };

  const navItems = getNavItems();

  // Don't render navigation if user is not authenticated
  if (!user) {
    return null;
  }

  return isMobile ? (
    <MobileNavbar navItems={navItems} />
  ) : (
    <DesktopNavbar navItems={navItems} />
  );
};