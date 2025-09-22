"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { BreadcrumbItem } from "@/types/navigation";
import { PROTECTED_PATH } from "@/constants/navigation";

// Breadcrumb mapping for different routes
const breadcrumbMap: Record<string, string> = {
  "/": "หน้าแรก",
  "/login": "เข้าสู่ระบบ",
  
  // Admin routes
  "/admin": "ผู้ดูแลระบบ",
  "/admin/upload-list": "อัปโหลดรายชื่อ",
  "/admin/upload-list/person": "รายละเอียดบุคคล",
  "/admin/intern-doc": "เอกสารขอสหกิจศึกษา / ฝึกงาน",
  "/admin/intern-doc/person": "รายละเอียดเอกสาร",
  "/admin/setting": "ตั้งค่า",
  
  // Reports routes
  "/reports": "รายงาน",
  "/reports/supervise-schedule": "นัดหมายนิเทศ",
  "/reports/supervise-report": "รายงานผลการนิเทศ",
  "/reports/summary-report": "รายงานสรุปผลรวม",
  "/reports/company-evaluation": "รายงานการประเมินสถานประกอบการ",
  "/reports/company-evaluation/company": "รายละเอียดการประเมิน",
  
  // Instructor routes
  "/instructor": "อาจารย์",
  "/instructor/intern-request": "รายการขอสหกิจศึกษา / ฝึกงาน",
  "/instructor/intern-request/person": "รายละเอียดคำขอ",
  "/instructor/assign-visitor": "มอบหมายอาจารย์นิเทศ",
  "/instructor/assign-visitor/person": "รายละเอียดการมอบหมาย",
  "/instructor/assign-grade": "บันทึกเกรด",
  "/instructor/assign-grade/person": "รายละเอียดเกรด",
  "/instructor/attend-training": "การเข้าอบรม",
  "/instructor/attend-training/person": "รายละเอียดการอบรม",
  
  // Student routes
  "/intern-request": "ยื่นขอสหกิจศึกษา / ฝึกงาน",
  "/intern-request/register-personal-info": "ลงทะเบียนข้อมูลส่วนตัว",
  "/intern-request/register-coop-info": "ลงทะเบียนข้อมูลสหกิจ",
  
  // Project routes
  "/project-info": "ข้อมูลโปรเจกต์",
  "/project-info/register-project": "ลงทะเบียนโปรเจกต์",
  
  // Evaluation routes
  "/evaluate": "แบบประเมิน",
  "/evaluate/company": "ประเมินสถานประกอบการ",
  
  // Visitor routes
  "/visitor": "อาจารย์นิเทศ",
  "/visitor/schedule": "นัดหมายนิเทศ",
  "/visitor/schedule/person": "รายละเอียดนัดหมาย",
  "/visitor/visits": "รายงานผลการนิเทศ",
  "/visitor/visits/person": "รายละเอียดการนิเทศ",
  "/visitor/evaluate": "ประเมิน",
  "/visitor/evaluate/student": "ประเมินนักศึกษา",
  "/visitor/evaluate/student/person": "รายละเอียดการประเมินนักศึกษา",
  "/visitor/evaluate/company": "ประเมินสถานประกอบการ",
  "/visitor/evaluate/company/person": "รายละเอียดการประเมินสถานประกอบการ",
  
  // Settings
  "/setting": "ตั้งค่า",
  "/setting/password": "เปลี่ยนรหัสผ่าน",
};

export const useBreadcrumbs = () => {
  const pathname = usePathname();
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<string[] | null>(null);

  const breadcrumbs = useMemo(() => {
    // Handle root path
    if (pathname === "/") {
      return [{ name: "หน้าแรก", path: "/" }];
    }

    // Split pathname into segments
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push({ name: "หน้าแรก", path: "/" });

    // Build breadcrumbs from segments
    let currentPath = "";
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Get the name from breadcrumb map
      const name = breadcrumbMap[currentPath];
      
      if (name) {
        breadcrumbs.push({
          name,
          path: currentPath,
        });
      } else {
        // Fallback: use segment as name (capitalize and replace hyphens)
        const fallbackName = segment
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        
        breadcrumbs.push({
          name: fallbackName,
          path: currentPath,
        });
      }
    });

    return breadcrumbs;
  }, [pathname, customBreadcrumbs]);

  const updateBreadcrumbs = useCallback((newBreadcrumbs: string[]) => {
    setCustomBreadcrumbs(newBreadcrumbs);
  }, []);

  const clearCustomBreadcrumbs = useCallback(() => {
    setCustomBreadcrumbs(null);
  }, []);

  // If custom breadcrumbs are set, use them instead
  const finalBreadcrumbs = useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs.map((name, index) => ({
        name,
        path: index === customBreadcrumbs.length - 1 ? pathname : '#'
      }));
    }
    return breadcrumbs;
  }, [customBreadcrumbs, breadcrumbs, pathname]);

  return {
    breadcrumbs: finalBreadcrumbs,
    updateBreadcrumbs,
    clearCustomBreadcrumbs
  };
};