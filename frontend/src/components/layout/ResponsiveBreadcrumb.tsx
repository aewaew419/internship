"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { Breadcrumb } from "./Breadcrumb";
import { MobileBreadcrumb } from "./MobileBreadcrumb";

export const ResponsiveBreadcrumb = () => {
  const isMobile = useIsMobile();

  return isMobile ? <MobileBreadcrumb /> : <Breadcrumb />;
};