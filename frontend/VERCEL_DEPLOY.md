# Deploy to Vercel - Easy Way! 🚀

## ขั้นตอนการ Deploy:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
# เลือก GitHub account
```

### 3. Deploy
```bash
# Deploy ครั้งแรก
vercel

# หรือ deploy production เลย
vercel --prod
```

### 4. Setup Auto Deploy
1. ไปที่ https://vercel.com/dashboard
2. เชื่อม GitHub repository
3. ทุกครั้งที่ push จะ auto deploy

## ข้อดีของ Vercel:
- ✅ Deploy ง่ายมาก (1 คำสั่ง)
- ✅ Auto deploy จาก GitHub
- ✅ SSL certificate อัตโนมัติ
- ✅ CDN global
- ✅ ฟรี!

## หลังจาก Deploy:
- เว็บไซต์จะได้ URL แบบ: https://internship-xxx.vercel.app
- สามารถตั้ง custom domain ได้

## สำหรับ Backend:
- Vercel เหมาะกับ frontend
- Backend แนะนำใช้ Railway หรือ Render
- หรือใช้ VPS ที่มีอยู่

---
**หมายเหตุ:** วิธีนี้ง่ายที่สุดสำหรับ frontend deployment!
