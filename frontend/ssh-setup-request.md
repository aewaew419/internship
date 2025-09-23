# คำขอติดตั้ง SSH Key สำหรับ VPS

## ข้อมูล VPS
- **Server Name:** dev.smart-solutions.com
- **IP Address:** 203.170.129.199
- **User:** root
- **Service:** Hostatom Cloud VPS SSD2

## SSH Public Key ที่ต้องการติดตั้ง

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDFDn20rUHFiJP1R/U2vVIbzmC0m1t5I53nAgk+FOQj1C+zn0SWW3Ks84KD6KzhyxitIhxrQkCBGwWp9mNBLbRU4tNcYncAqOmEhg7tG1q20MBK/lnsx1ozh0Hp9OT5yVyMd4x51Q1cl3hQrj5RwfvaqqaotAhck6Chf10eo0f2KV/NGPgBPjakuq8mQlZBXUs7Aa07Oa85BZkt9DZL64VuefE7DNeu8c5z4kKFsQK0eh5wxNx/Cx0jVoLFTXOUhfuaVfLY+8cFg3EtWzEVAAf1AGhu7uj9i8HM8EFwHe/foXuK6E2Plr+PFn77DdvIhLzNeJ5fWHXFSV+Q/RY0Mcq7es24hBQKcWj0+kedndK6+ufBrjlAaY/qnDi/0vf2KXNAauL2SVtOIRaWUyJN/7/qwXfUkJaH6wUJIYVmRV/70A4YMI+iY+J//6oppo/W5q/w5Kz3jKhExO2YvbKf0wHIjXGoEOVtoYyB/ljifw3Lj9G5C/Gsr77n1icX1Vwcr0omKDvXO5rCXZ5WSxX3bloOQpyf/3P0T1YWsWwqO+46HqlSqvaTMndFkDVI7dho5fMPGYcQpMaZciZ6gWyItjNk/3S42Bd/gDp1dfmdUTtyTqqo0sZGcQVxR+BpIuqFczzAB33SQswqg10PoRP6H9gWZl8SET0c4b2zxWGb8gN0IQ== deployment@Macbooks-MacBook-Pro.local
```

## คำขอการติดตั้ง

เรียน ทีมสนับสนุน Hostatom

ขอความกรุณาช่วยติดตั้ง SSH Public Key ข้างต้นให้กับ VPS ของเรา เพื่อให้สามารถเชื่อมต่อโดยไม่ต้องใส่รหัsผ่านทุกครั้ง

### ขั้นตอนการติดตั้ง:

1. SSH เข้า VPS: `ssh root@203.170.129.199`
2. สร้างโฟลเดอร์ .ssh: `mkdir -p ~/.ssh`
3. เพิ่ม public key: `echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDFDn20rUHFiJP1R/U2vVIbzmC0m1t5I53nAgk+FOQj1C+zn0SWW3Ks84KD6KzhyxitIhxrQkCBGwWp9mNBLbRU4tNcYncAqOmEhg7tG1q20MBK/lnsx1ozh0Hp9OT5yVyMd4x51Q1cl3hQrj5RwfvaqqaotAhck6Chf10eo0f2KV/NGPgBPjakuq8mQlZBXUs7Aa07Oa85BZkt9DZL64VuefE7DNeu8c5z4kKFsQK0eh5wxNx/Cx0jVoLFTXOUhfuaVfLY+8cFg3EtWzEVAAf1AGhu7uj9i8HM8EFwHe/foXuK6E2Plr+PFn77DdvIhLzNeJ5fWHXFSV+Q/RY0Mcq7es24hBQKcWj0+kedndK6+ufBrjlAaY/qnDi/0vf2KXNAauL2SVtOIRaWUyJN/7/qwXfUkJaH6wUJIYVmRV/70A4YMI+iY+J//6oppo/W5q/w5Kz3jKhExO2YvbKf0wHIjXGoEOVtoYyB/ljifw3Lj9G5C/Gsr77n1icX1Vwcr0omKDvXO5rCXZ5WSxX3bloOQpyf/3P0T1YWsWwqO+46HqlSqvaTMndFkDVI7dho5fMPGYcQpMaZciZ6gWyItjNk/3S42Bd/gDp1dfmdUTtyTqqo0sZGcQVxR+BpIuqFczzAB33SQswqg10PoRP6H9gWZl8SET0c4b2zxWGb8gN0IQ== deployment@Macbooks-MacBook-Pro.local' >> ~/.ssh/authorized_keys`
4. ตั้งค่าสิทธิ์: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

### วัตถุประสงค์:
- เพื่อใช้ในการเรียนรู้การ deploy application
- เตรียมความพร้อมสำหรับโปรเจ็กต์มหาวิทยาลัย
- ปรับปรุงความปลอดภัยในการเข้าถึง VPS