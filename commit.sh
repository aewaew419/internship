#!/bin/bash
git add frontend/
git commit -m "เพิ่มระบบ UI Component Library ที่รองรับ Mobile-First Design

✨ คุณสมบัติที่เพิ่ม:
- Button components ที่รองรับ mobile touch targets และ responsive design
- Form components ครบชุด (Input, Field, FormControl, Select, Textarea, Checkbox)
- Table components ที่ responsive (ResponsiveTable, MobileTable, TableCard)
- Modal และ Popup components (Modal, Drawer, BottomSheet, Popover, Toast)
- CSS animations และ mobile utilities สำหรับ touch interactions
- Comprehensive tests และ Storybook stories

🎯 Mobile-First Features:
- Touch-friendly interactions (minimum 44px touch targets)
- iOS zoom prevention ด้วย appropriate font sizes
- Responsive breakpoints และ adaptive layouts
- Full accessibility support (ARIA, keyboard navigation)
- Mobile gestures, animations และ safe area support
- Performance optimized สำหรับ mobile networks

📱 Component Highlights:
- Button: 6 variants, loading states, icon support
- Forms: Mobile keyboard optimization, validation display
- Tables: Auto mobile card view, horizontal scroll, column priority
- Modals: Mobile full-screen, focus management, gesture support
- All components tested และ documented ครบถ้วน"

git push origin main