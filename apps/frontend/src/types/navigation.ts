import { ReactNode } from "react";

export interface NavItem {
  name: string;
  path: string;
  icon: ReactNode;
  roles?: string[];
}

export interface NavigationState {
  isOpen: boolean;
  isMobile: boolean;
  currentPath: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}