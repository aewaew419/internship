// app/Controllers/Http/LetterController.ts
import puppeteer from 'puppeteer'
import { HttpContext } from '@adonisjs/core/http'

export default class LetterController {
  public async generateLetter({ response }: HttpContext) {
    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'TH Sarabun New', sans-serif; font-size: 16pt; line-height: 1.6; }
          .center { text-align: center; }
          .signature { margin-top: 50px; text-align: right; }
        </style>
      </head>
      <body>
        <h1>เอกสารแจ้งเตือน</h1>
        <div class="center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Emblem_of_Thailand.svg" width="80" />
        </div>
        <p><b>เรื่อง:</b> ขอความอนุเคราะห์รับนักศึกษาปฏิบัติงานสหกิจศึกษา</p>
        <p>เรียน ……………………………</p>
        <p>
          ด้วยคณะบริหารธุรกิจและศิลปศาสตร์ มีความประสงค์ให้นักศึกษา
          <b>นางสาวศศิธร เจริญพงค์</b> ได้มีโอกาสเข้าปฏิบัติงานสหกิจศึกษา
          ตั้งแต่วันที่ 18 พฤศจิกายน 2567 ถึงวันที่ 7 มีนาคม 2568
        </p>
        <div class="signature">
          <p>ขอแสดงความนับถือ</p>
          <img src="https://example.com/signature.png" width="150" /><br>
          (รองศาสตราจารย์กัญฐณา ดิษฐ์แก้ว)
        </div>
      </body>
      </html>
    `

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    })

    await browser.close()

    response.header('Content-Type', 'application/pdf')
    response.header('Content-Disposition', 'inline; filename=letter.pdf')
    response.send(pdf)
  }
}
