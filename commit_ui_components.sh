#!/bin/bash

# Add all changes except .kiro folder (already in gitignore)
git add .

# Commit with Thai message
git commit -m "เพิ่มระบบ UI Component Library ที่รองรับ Mobile

- ปรับปรุง Button component ให้รองรับ mobile-first design
- เพิ่ม Form components (Input, Field, FormControl, Select, Textarea, Checkbox)
- สร้าง Table components ที่ responsive (ResponsiveTable, MobileTable, TableCard)
- เพิ่ม Modal และ Popup components (Modal, Drawer, BottomSheet, Popover, Toast)
- เพิ่ม CSS animations และ mobile utilities
- เพิ่ม comprehensive tests และ Storybook stories
- รองรับ touch targets, accessibility, และ mobile gestures"

# Push to remote
git push

echo "✅ Committed และ pushed การเปลี่ยนแปลงเรียบร้อยแล้ว"