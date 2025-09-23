// app/Controllers/Http/LetterController.ts
import puppeteer from 'puppeteer'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import StudentEnroll from '#models/student_enroll'
import { DateTime } from 'luxon'

export default class LetterController {
  constructor() {}
  private toThaiDigits(input: string | number): string {
    const s = String(input)
    const map = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
    return s.replace(/\d/g, (d) => map[Number(d)])
  }

  private toBangkokDate(v: unknown): Date {
    if (DateTime.isDateTime(v)) return v.toJSDate()
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00+07:00`)
      return new Date(v)
    }
    if (typeof v === 'number' || v instanceof Date) return new Date(v as any)
    if (v && typeof (v as any).toISO === 'function') return new Date((v as any).toISO())
    return new Date(v as any)
  }

  /** "๑๖ กันยายน ๒๕๖๗" – Thai month + Thai digits + Buddhist Era */
  private parseDateToThai(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) return ''
    // try Intl with Thai digits; fallback + digit conversion
    try {
      return new Intl.DateTimeFormat('th-TH-u-ca-buddhist-nu-thai', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Bangkok',
      }).format(date)
    } catch {
      const s = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Bangkok',
      }).format(date)
      return this.toThaiDigits(s)
    }
  }
  private formatDateBEEng(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) return ''
    const tz = 'Asia/Bangkok'
    const day = new Intl.DateTimeFormat('en', { day: 'numeric', timeZone: tz }).format(date)
    const month = new Intl.DateTimeFormat('en', { month: 'long', timeZone: tz }).format(date) // September
    const ad = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: tz }).format(date)) // 2024
    const be = ad + 543
    return `${day} ${month} B.E. ${be} (${ad})`
  }
  private async savePdfAndLink(
    pdf: Buffer,
    request: HttpContext['request'],
    baseName: string
  ): Promise<{ url: string; path: string; filename: string; size: number }> {
    const dir = app.makePath('public', 'letter')
    await mkdir(dir, { recursive: true })

    const safe = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160)
    const filename = `${safe}.pdf`
    const filePath = join(dir, filename)

    await writeFile(filePath, pdf)

    const path = `/letter/${filename}`
    const absolute =
      (request as any).completeUrl?.(path) ?? `${request.protocol()}://${request.hostname()}${path}`

    return { url: absolute, path, filename, size: pdf.length }
  }
  public async requestCoopTH({ response, params, request }: HttpContext) {
    const studentEnroll = await StudentEnroll.query()
      .where('id', params.id)
      .preload('student', (q) => q.preload('curriculum'))
      .preload('course_section', (q) => q.preload('course'))
      .preload('student_training', (q) => q.preload('company'))
      .firstOrFail()

    const { docNo, issueDate } = request.body() || {}

    const crestPath = app.makePath('./public/image.png')
    const [crestB64] = await Promise.all([readFile(crestPath).then((b) => b.toString('base64'))])
    const crestUrl = `data:image/png;base64,${crestB64}`

    const semesterTh = this.toThaiDigits(studentEnroll.course_section.semester)
    const yearBETh = this.toThaiDigits(studentEnroll.course_section.year + 543)
    const issueDateTh = this.parseDateToThai(new Date(issueDate))
    const startTh = this.parseDateToThai(
      this.toBangkokDate(studentEnroll.student_training.start_date)
    )
    const endTh = this.parseDateToThai(this.toBangkokDate(studentEnroll.student_training.end_date))

    const course_id = studentEnroll.course_section.course_id

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 12mm 10mm 10mm 10mm; }
          body { font-family: "Sarabun", sans-serif; font-size: 14px; line-height: 2; color: #000; }
          .container { padding: 12mm 10mm 10mm 10mm; }
          .header { display: flex; justify-content: space-between; width: 100%; margin-left:10mm; }
          .content { padding: 0mm 10mm; }
          .crest { width: 28mm; margin-left: 30mm; position:absolute; top:0; left:35%; transform: translateX(-50%); }
          .right { text-align: right; max-width: 55%; }
          .docno { margin-top: 6mm; }
          .date { margin-top: 6mm; transform: translateX(-50mm); }
          h1 { font-size: 16pt; text-align: center; }
          .underline-red { border-bottom: 2px solid #c1121f; display: inline-block; padding-bottom: 2px; }
          .signature { margin-top: 15mm; width: fit-content; margin-left: auto; margin-right: 10mm; text-align: center; }
          .footer { position: fixed; bottom: 8mm; left: 15mm; right: 15mm; font-size: 11pt; color: #444; }
          .bold { font-weight: 700; }
          .indent { text-indent: 5em; }
          .info {font-size: 10px;}
          .addr-block { width: 80mm; }
          .addr {
            overflow-wrap: anywhere;      
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="crest" src="${crestUrl}"/>
          <div class="header">
            <div><p>ที่ อว๐๖๕๔.๐๒/${docNo}</p></div>
            <div >
              <div>
                คณะบริหารธุรกิจและศิลปศาสตร์<br/>
                มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา<br/>
                ๑๒๘ ถนนห้วยแก้ว ตำบลสุเทพ <br/>
                อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ <br/>
                ๕๐๓๐๐
              </div>
              <div class="date">${issueDateTh}</div>
            </div>
          </div>

          <div class="content">
            <p>เรื่อง ขอความอนุเคราะห์รับนักศึกษา${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'}</p>
            <p>เรียน ${studentEnroll.student_training.company.company_name_th}</p>
            <p>สิ่งที่ส่งมาด้วย หนังสือตอบรับนักศึกษา${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'} จำนวน ๑ ฉบับ</p>

            <p class="indent">
              ด้วย คณะบริหารธุรกิจและศิลปศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา มีความประสงค์ให้นักศึกษาระดับปริญญาตรี
              หลักสูตรการจัดการธุรกิจระหว่างประเทศ ได้มีโอกาสเข้า${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงาน'}ในหน่วยงานของท่าน
              ในรายวิชา ${course_id === 1 ? 'Co-Operative Education in Business Administration' : 'Job Internship in Business Management'} ซึ่งเป็นการจัดให้มีการบูรณาการการเรียนของนักศึกษา
              กับการปฏิบัติงานเพื่อหาประสบการณ์จริงจากสถานประกอบการ
            </p>

            <p class="indent">
              ในการนี้ ${course_id === 1 ? 'คณะ' : 'คณะบริหารธุรกิจและศิลปศาสตร์'}ได้พิจารณาแล้วเห็นว่าการเข้า
              ${
                course_id === 1
                  ? 'ปฏิบัติงานสหกิจศึกษาในหน่วยงานของท่าน จะเกิดประโยชน์แก่นักศึกษาเป็นอย่างยิ่ง ดังนั้น คณะจึงขอความอนุเคราะห์ท่านรับนักศึกษาปฏิบัติงานสหกิจศึกษาใน'
                  : 'ฝึกงานในสถานประกอบการของท่านจะเกิดประโยชน์แก่นักศึกษาเป็นอย่างมาก จึงใคร่ขอความอนุเคราะห์ท่านรับนักศึกษา เข้าฝึกงานในสถานประกอบการ '
              }
              ภาคการศึกษาที่ ${semesterTh}
              ปีการศึกษา ${yearBETh}
              ${course_id === 1 ? 'ตั้งแต่วันที่' : 'ระหว่างวันที่'} ${startTh} ถึงวันที่ ${endTh}
              โดยคณะ${course_id === 1 ? '' : 'ฯ '}กำหนดให้นักศึกษาออกปฏิบัติงานสหกิจศึกษาในสถานประกอบการในฐานะพนักงานเต็มเวลา
              ${course_id === 1 ? 'และระหว่างการปฏิบัติงานสหกิจศึกษานั้น นักศึกษาต้องจัดทำโครงงาน ๑ เรื่อง เพื่อให้เป็นไปตามข้อกำหนดของหลักสูตร' : ''}
            </p>

            <p class="indent">
              จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ หากผลการพิจารณาเป็นประการใด
              กรุณาส่งหนังสือตอบรับที่แนบมาพร้อมนี้กลับมายัง หลักสูตรการจัดการธุรกิจระหว่างประเทศ
              คณะบริหารธุรกิจและศิลปศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา
            </p>

            <div class="signature">
              <p>ขอแสดงความนับถือ</p>
              <br/>
              (รองศาสตราจารย์กัญฐณา ดิษฐ์แก้ว)
              <br/>
              คณบดีคณะบริหารธุรกิจและศิลปศาสตร์
            </div>
            <p class="info"> 
            หลักสูตรการจัดการธุรกิจระหว่างประเทศ<br/>
            โทรศัพท์ 0 5392 1444 ต่อ 1294<br/>
            (นายพุฒิพงค์  ประสงค์ทรัพย์  ผู้ประสานงาน) 
            </p>
          </div>
        </div>

        <div  style="break-before: page; page-break-before: always;">
         
          <h1>หนังสือตอบรับนักศึกษา${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงาน'}</h1>
          <div class="header">
            <p>ที่………………………………</p>
            <div class="addr addr-block">
              <p>${studentEnroll.student_training.company.company_address} <br/>
              วันที่…………เดือน………………………พ.ศ…………</p>
            </div>
          </div>
          <div class="content">
            <p>เรื่อง การรับนักศึกษา${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'}</p>
            <p>เรียน คณบดีคณะบริหารธุรกิจและศิลปศาสตร์</p>
            <p>อ้างถึง หนังสือที่ ${docNo} <span style="margin-left: 20px;">ลงวันที่ ${issueDateTh}</span></p>

            <p class="indent">ตามที่ ท่านได้ขอความอนุเคราะห์เพื่อรับนักศึกษาระดับปริญญาตรี หลักสูตรการจัดการธุรกิจระหว่างประเทศ คณะบริหารธุรกิจและศิลปศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา 
              เข้า${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'รับฝึกงาน'}ในหน่วยงานแห่งนี้ ในภาคการศึกษาที่ ${semesterTh}
              ปีการศึกษา ${yearBETh} ตั้งแต่วันที่ ${startTh} ถึงวันที่ ${endTh} นั้น ทางหน่วยงานได้พิจารณาแล้ว เห็นว่า
            </p>

            <div style="display: flex; gap: 5px; margin-left: 20mm;">
              <div style="width: 3mm; height: 3mm; border: 2px solid black; margin-top: auto; margin-bottom: auto;"></div>
              <p> ยินดีให้ความร่วมมือรับนักศึกษาเข้า${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงาน'} จำนวน ๑ ราย คือ</p>
            </div>
			      <p class="indent" style="margin-left: 20mm; margin-top: -10px;">๑.${studentEnroll.student.name} ${studentEnroll.student.middle_name || ''} ${studentEnroll.student.surname}</p>
            
            <div style="display: flex; gap: 5px; margin-left: 20mm; margin-top: -10px;">
              <div style="width: 3mm; height: 3mm; border: 2px solid black; margin-top: auto; margin-bottom: auto;"></div>
              <p>ไม่สามารถรับนักศึกษาเข้า${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงาน'}ได้</p>
            </div>

            <p class="indent"><b>ตำแหน่งงาน / ลักษณะงาน ที่ให้นักศึกษาปฏิบัติในหน่วยงาน</b></p>
            <p style="margin-left: 20mm;">๒.๑………………………………………………………………………………………………………………………………<br/>
                ๒.๒………………………………………………………………………………………………………………………………<br/>
                ๒.๓………………………………………………………………………………………………………………………………<br/>
                ๒.๔………………………………………………………………………………………………………………………………<br/>
                จึงเรียนมาเพื่อทราบ
                </p>


             <div class="signature">
              <p>ขอแสดงความนับถือ</p>
              <br/>
              (…………………………………………………………………………)
              <br/>
              ตำแหน่ง…………………………………………………………………………
              <br/>
              กรุณาประทับตราหน่วยงาน
            </div>
          </div>
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

    // response.header('Content-Type', 'application/pdf')
    // response.header(
    //   'Content-Disposition',
    //   `inline; filename=request_letter_${studentEnroll.student.student_id}.pdf`
    // )
    // response.send(pdf)
    const link = await this.savePdfAndLink(
      Buffer.from(pdf),
      request,
      `request_coop_th_${studentEnroll.student.student_id}_${(docNo ?? 'doc').toString().replace(/\//g, '-')}_${Date.now()}`
    )
    return response.ok(link)
  }
  public async requestCoopEN({ response, params, request }: HttpContext) {
    const studentEnroll = await StudentEnroll.query()
      .where('id', params.id)
      .preload('student', (q) => q.preload('curriculum'))
      .preload('course_section', (q) => q.preload('course'))
      .preload('student_training', (q) => q.preload('company'))
      .firstOrFail()

    const { docNo, issueDate, prefix } = request.body() || {}

    const crestPath = app.makePath('./public/image.png')
    const [crestB64] = await Promise.all([readFile(crestPath).then((b) => b.toString('base64'))])
    const crestUrl = `data:image/png;base64,${crestB64}`

    const semester = studentEnroll.course_section.semester
    const year = studentEnroll.course_section.year
    const issueDateBBE = this.formatDateBEEng(new Date(issueDate))

    const startDate = this.formatDateBEEng(
      this.toBangkokDate(studentEnroll.student_training.start_date)
    )
    const endDate = this.formatDateBEEng(
      this.toBangkokDate(studentEnroll.student_training.end_date)
    )
    const course_id = studentEnroll.course_section.course_id

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 12mm 10mm 10mm 10mm; }
          body { font-family: "Sarabun", sans-serif; font-size: 14px; line-height: 2; color: #000; }
          .container { padding: 12mm 10mm 10mm 10mm; }
          .header { display: flex; justify-content: space-between; width: 100%; margin-left:10mm; }
          .content { padding: 0mm 10mm; }
          .crest { width: 28mm; margin-left: 30mm; position:absolute; top:0; left:35%; transform: translateX(-50%); }
          .right { text-align: right; max-width: 55%; }
          .docno { margin-top: 6mm; }
          .date { margin-top: 6mm; transform: translateX(-50mm); }
          h1 { font-size: 16pt; text-align: center; }
          .underline-red { border-bottom: 2px solid #c1121f; display: inline-block; padding-bottom: 2px; }
          .signature { margin-top: 15mm; width: fit-content; margin-left: auto; margin-right: 10mm; text-align: center; }
          .footer { position: fixed; bottom: 8mm; left: 15mm; right: 15mm; font-size: 11pt; color: #444; }
          .bold { font-weight: 700; }
          .indent { text-indent: 5em; }
          .info {font-size: 10px;}
          .addr-block { width: 80mm; }
          .addr {
            overflow-wrap: anywhere;      
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="crest" src="${crestUrl}"/>
          <div class="header">
            <div><p>No 0654.02/${docNo}</p></div>
            <div>
              <div>
              Faculty of Business Administration<br/>
              And Liberal Arts<br/>
              Rajamangala University of Technology<br/>
              Lanna<br/>
              128 Huay Kaew Road, Chang Puek,<br/>
              Mueang, Chiang Mai 50300<br/>
              THAILAND<br/>
              </div>
              <div class="date">${issueDateBBE}</div>
            </div>
          </div>

          <div class="content">
            <p>Dear ${studentEnroll.student_training.company.company_name_th}</p>
            <p style="text-align: center;">Subject: Request for Acceptance of Student Trainee</p>

            <p class="indent">
             The Faculty of Business Administration and Liberal Arts, Rajamangala University of
            Technology Lanna (RMUTL), would like to propose the placement of 
            ${
              course_id === 1
                ? `${prefix} ${studentEnroll.student.name} ${studentEnroll.student.middle_name || ''} ${studentEnroll.student.surname},`
                : 'the following'
            }
            4th-year student majoring in the International Business Management Program, as trainee students
            in your esteemed organization${course_id === 1 ? '.' : ':'}
            </p>

          ${
            course_id === 1
              ? ''
              : `<p class="indent">1. ${prefix} ${studentEnroll.student.name} ${studentEnroll.student.middle_name || ''} ${studentEnroll.student.surname}</p>`
          }

            <p class="indent">
            In line with our Cooperative Education in International Affairs course, the objective
            of this program is to integrate theoretical learning with practical experience in a professional
            environment. The faculty respectfully requests that your organization consider accepting these
            students for practical training. We propose that the students undertake full-time trainee positions
            ${
              course_id === 1
                ? `,during which they will be required to complete a project. This project should address a minor issue
            or challenge faced by your organization. `
                : '. '
            }
            The proposed training period is scheduled for the 
            ${semester === 1 ? 'first ' : 'second '}
            semester of the ${year} academic year, from ${startDate} to ${endDate}.
            </p>

            <p class="indent">
              If you find this proposal acceptable, kindly complete and return the attached
              'Acceptance Student Trainee Form' via email to sjariangprasert@gmail.com.
            </p>

            <div class="signature">
              <p>Sincerely yours,</p>
              <br/>
              (Associate Professor Kanthana Ditkaew)
              <br/>
              Dean, Faculty of Business Administration and Liberal Arts
            </div>
            <p class="info"> 
              International Business Management Program<br/>
              Tel: +66 835700055
            </p>
          </div>
        </div>

        <div style="break-before: page; page-break-before: always;">
          <h1>Acceptance Student Trainee Form</h1>
          <div class="header">
            <p>No. ………………………………</p>
            <div class="addr addr-block">
              <p>${studentEnroll.student_training.company.company_address} <br/>
              Date…………Month………………………Year…………</p>
            </div>
          </div>
          <div class="content">
            <p>Subject: Request for Acceptance of Student Trainee</p>
            <p>To: Dean, Faculty of Business Administration and Liberal Arts</p>
            <p>Refer to Letter: No. 0654.02/${docNo} <span style="margin-left: 20px;">register ${issueDateBBE}</span></p>

            <p class="indent">
              In reference to your request for our organization to accept 4th-year undergraduate
              students from the English for International Communication Program, Faculty of Business
              Administration and Liberal Arts, Rajamangala University of Technology Lanna (RMUTL), for
              ${course_id === 1 ? ` cooperative education internships` : ' an internship'} during the ${semester === 1 ? 'first ' : 'second '} 
              semester of the academic year ${year}, 
              from ${startDate} to ${endDate}, we have reviewed your request and would
              like to inform you of the following decision:
            </p>

            <div style="display: flex; gap: 5px; margin-left: 20mm;">
              <div style="width: 3mm; height: 3mm; border: 2px solid black; margin-top: 5.5mm;"></div>
              <p> We are pleased to confirm our willingness to accept the following <br/>
              students for ${course_id === 1 ? `the cooperative education internship` : 'an internship'}:</p>
            </div>
			      <p class="indent" style="margin-left: 20mm; margin-top: -10px;">1.${prefix} ${studentEnroll.student.name} ${studentEnroll.student.middle_name || ''} ${studentEnroll.student.surname}</p>
            
            <p class="indent"><b>Job Position / Job Description for Students at the Organization:</b></p>
            <p style="margin-left: 20mm;">1.………………………………………………………………………………………………………………………………<br/>
                2.………………………………………………………………………………………………………………………………
            </p>

            <div style="display: flex; gap: 5px; margin-left: 20mm; margin-top: -10px;">
              <div style="width: 3mm; height: 3mm; border: 2px solid black; margin-top: 5.5mm;"></div>
              <p>We regret to inform you that we are unable to accept students for the <br/>
                  ${course_id === 1 ? `the cooperative education internship` : 'the internship'} at this time.<br/>
                  This is for your information.
              </p>
            </div>

             <div class="signature">
              <p>Sincerely,</p>
              <br/>
              (…………………………………………………………………………)
              <br/>
              Position:…………………………………………………………………………
              <br/>
              Please affix the organization’s seal.
            </div>
          </div>
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
    response.header(
      'Content-Disposition',
      `inline; filename=request_letter_${studentEnroll.student.student_id}.pdf`
    )
    response.send(pdf)
  }

  public async requestReferLetterTH({ response, params, request }: HttpContext) {
    const studentEnroll = await StudentEnroll.query()
      .where('id', params.id)
      .preload('student', (q) => q.preload('curriculum'))
      .preload('course_section', (q) => q.preload('course'))
      .preload('student_training', (q) => q.preload('company'))
      .firstOrFail()

    const { docNo, issueDate } = request.body() || {}

    const crestPath = app.makePath('./public/image.png')
    const [crestB64] = await Promise.all([readFile(crestPath).then((b) => b.toString('base64'))])
    const crestUrl = `data:image/png;base64,${crestB64}`

    const semesterTh = this.toThaiDigits(studentEnroll.course_section.semester)
    const yearBETh = this.toThaiDigits(studentEnroll.course_section.year + 543)
    const issueDateTh = this.parseDateToThai(new Date(issueDate))
    const startTh = this.parseDateToThai(
      this.toBangkokDate(studentEnroll.student_training.start_date)
    )
    const endTh = this.parseDateToThai(this.toBangkokDate(studentEnroll.student_training.end_date))

    const course_id = studentEnroll.course_section.course_id

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 12mm 10mm 10mm 10mm; }
          body { font-family: "Sarabun", sans-serif; font-size: 14px; line-height: 2; color: #000; }
          .container { padding: 12mm 10mm 10mm 10mm; }
          .header { display: flex; justify-content: space-between; width: 100%; }
          .content { padding: 0mm 10mm; }
          .crest { width: 28mm; margin-left: 30mm; position:absolute; top:0; left:35%; transform: translateX(-50%); }
          .right { text-align: right; max-width: 55%; }
          .docno { margin-top: 6mm; }
          .date { margin-top: 6mm; transform: translateX(-50mm); }
          h1 { font-size: 16pt; text-align: center; }
          .underline-red { border-bottom: 2px solid #c1121f; display: inline-block; padding-bottom: 2px; }
          .signature { margin-top: 15mm; width: fit-content; margin-left: auto; margin-right: 10mm; text-align: center; }
          .footer { position: fixed; bottom: 8mm; left: 20mm; right: 15mm; font-size: 11pt; color: #444; }
          .bold { font-weight: 700; }
          .indent { text-indent: 5em; }
          .info {font-size: 10px;}
          .addr-block { width: 55mm; }
          .addr {
            overflow-wrap: anywhere;      
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="crest" src="${crestUrl}"/>
          <div class="header">
            <div><p>ที่ อว๐๖๕๔.๐๒/${docNo}</p></div>
            <div>
              <div>
                คณะบริหารธุรกิจและศิลปศาสตร์<br/>
                มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา<br/>
                ๑๒๘ ถนนห้วยแก้ว ตำบลสุเทพ <br/>
                อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ <br/>
                ๕๐๓๐๐
              </div>
              <div class="date">${issueDateTh}</div>
            </div>
          </div>

          <div class="content">
            <p>เรื่อง ขอส่งตัวนักศึกษา${course_id === 1 ? 'ฝึกปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'}</p>
            <p>เรียน ${studentEnroll.student_training.company.company_name_th}</p>
            <p>สิ่งที่ส่งมาด้วย ๑.รายชื่อนักศึกษา${course_id === 1 ? 'ฝึกปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'} จำนวน ๑ ฉบับ</p>

            <p class="indent">
              ตามที่ท่านได้ให้ความอนุเคราะห์รับนักศึกษาหลักสูตรการจัดการธุรกิจระหว่างประเทศ คณะบริหารธุรกิจและศิลปศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา 
              เข้ารับการ${course_id === 1 ? 'ฝึกปฏิบัติงานสหกิจศึกษา' : 'ฝึกงาน'}ในหน่วยงานของท่าน นั้น
            </p>

            <p class="indent">
              คณะขอส่งตัวนักศึกษา${course_id === 1 ? 'ฝึกปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'} จำนวน ๑ ราย 
              เพื่อรายงานตัวเข้ารับการ${course_id === 1 ? 'ฝึกปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'} ในภาคเรียนที่ ${semesterTh} ปีการศึกษา ${yearBETh} 
              ${course_id === 1 ? 'ตั้งแต่วันที่' : 'ระหว่างวันที่'} ${startTh} ถึงวันที่ ${endTh} 
              หากการ${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงานในสถานประกอบการ'}ของนักศึกษาสิ้นสุดลง 
              ขอความอนุเคราะห์สถานประกอบการประเมินผลการ${course_id === 1 ? 'ปฏิบัติงานสหกิจศึกษา' : 'ฝึกงาน'}ของนักศึกษา 
              และนำส่งกลับมายังหลักสูตรการจัดการธุรกิจระหว่างประเทศ 
              คณะบริหารธุรกิจและศิลปศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา โดยปิดผนึกฝากกับนักศึกษา หรือส่งผ่านไปรษณีย์อิเล็กทรอนิกส์ sjariangprasert@gmail.com 
              ภายในเวลา ๗ วันหลังจากนักศึกษาฝึกงานเสร็จสิ้น หากมีข้อส่งสัยเกี่ยวข้องกับการฝึกงานในครั้งนี้ 
              สามารถติดต่อประสานงานกับอาจารย์ศิวพร ศิริกมล หมายเลขโทรศัพท์ ๐ ๕๓๙๒ ๑๔๔๔ ต่อ ๑๒๙๔
            </p>

            <p class="indent">
             คณะขอขอบคุณที่ท่านได้กรุณารับนักศึกษาเข้า${course_id === 1 ? 'ฝึกปฏิบัติงานสหกิจศึกษาในหน่วยงาน' : 'ฝึกงานในสถานประกอบการ'}ของท่าน 
             และหวังเป็นอย่างยิ่งว่าจะได้รับความอนุเคราะห์จากท่านอีกในโอกาสต่อไป
            </p>

            <div class="signature">
              <p>ขอแสดงความนับถือ</p>
              <br/>
              (รองศาสตราจารย์กัญฐณา ดิษฐ์แก้ว)
              <br/>
              คณบดีคณะบริหารธุรกิจและศิลปศาสตร์
            </div>
            <p class="info footer"> 
            หลักสูตรการจัดการธุรกิจระหว่างประเทศ<br/>
            โทรศัพท์ 0 5392 1444 ต่อ 1294<br/>
            (นายพุฒิพงค์  ประสงค์ทรัพย์  ผู้ประสานงาน) 
            </p>
          </div>
        </div>

        <div class="content" style="break-before: page; page-break-before: always;">
         
          <div class="header">
            <p> คณะบริหารธุรกิจและศิลปศาสตร์<br/>
              มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา</p>

            <p> ๑๒๘ ถนนห้วยแก้ว ตำบลช้างเผือก <br/>
                อำเภอเมือง จังหวัดเชียงใหม่ ๕๐๓๐๐ <br/>
                โทร ๐ ๕๓๙๒ ๑๔๔๔ ต่อ ๑๒๙๔ <br/>
                โทรสาร ๐ ๕๓๓๕ ๗๗๘๙ <br/>
            </p>
          </div>
          <hr/>
          <div class="header">
            <p>สถานประกอบการ</p>
            
            <div class="addr addr-block">
              <p>${studentEnroll.student_training.company.company_address}</p>
            </div>
          </div>
          <div>
            <div style="display: flex; gap: 5px;">
              <p> <b style="margin-right: 10px;">รายชื่อนักศึกษาที่เข้ารับ${course_id === 1 ? 'การฝึกประสบการณ์' : 'การฝึกงาน'}</b> จำนวน ๑ ราย คือ</p>
            </div>
			      <p class="indent" style="margin-top: -10px;">๑.${studentEnroll.student.name} ${studentEnroll.student.middle_name || ''} ${studentEnroll.student.surname}</p>
          </div>
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
    response.header(
      'Content-Disposition',
      `inline; filename=refer_letter_${studentEnroll.student.student_id}.pdf`
    )
    response.send(pdf)
  }
  public async requestReferLetterEN({ response, params, request }: HttpContext) {
    const studentEnroll = await StudentEnroll.query()
      .where('id', params.id)
      .preload('student', (q) => q.preload('curriculum'))
      .preload('course_section', (q) => q.preload('course'))
      .preload('student_training', (q) => q.preload('company'))
      .firstOrFail()

    const { docNo, issueDate, prefix } = request.body() || {}

    const crestPath = app.makePath('./public/image.png')
    const [crestB64] = await Promise.all([readFile(crestPath).then((b) => b.toString('base64'))])
    const crestUrl = `data:image/png;base64,${crestB64}`

    const year = studentEnroll.course_section.year
    const issueDateBBE = this.formatDateBEEng(new Date(issueDate))

    const startDate = this.formatDateBEEng(
      this.toBangkokDate(studentEnroll.student_training.start_date)
    )
    const endDate = this.formatDateBEEng(
      this.toBangkokDate(studentEnroll.student_training.end_date)
    )
    const course_id = studentEnroll.course_section.course_id

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 12mm 10mm 10mm 10mm; }
          body { font-family: "Sarabun", sans-serif; font-size: 14px; line-height: 2; color: #000; }
          .container { padding: 12mm 10mm 10mm 10mm; }
          .header { display: flex; justify-content: space-between; width: 100%; margin-left:10mm; }
          .content { padding: 0mm 10mm; }
          .crest { width: 28mm; margin-left: 30mm; position:absolute; top:0; left:35%; transform: translateX(-50%); }
          .right { text-align: right; max-width: 55%; }
          .docno { margin-top: 6mm; }
          .date { margin-top: 6mm; transform: translateX(-50mm); }
          h1 { font-size: 16pt; text-align: center; }
          .underline-red { border-bottom: 2px solid #c1121f; display: inline-block; padding-bottom: 2px; }
          .signature { width: fit-content; margin-left: auto; margin-right: 5mm; text-align: center; }
          .footer { position: fixed; bottom: 8mm; left: 20mm; right: 15mm; font-size: 11pt; color: #444; }
          .bold { font-weight: 700; }
          .indent { text-indent: 5em; }
          .info {font-size: 10px;}
          .addr-block { width: 80mm; }
          .addr {
            overflow-wrap: anywhere;      
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="crest" src="${crestUrl}"/>
          <div class="header">
            <div><p>No 0654.02/${docNo}</p></div>
            <div>
              <div>
              Faculty of Business Administration<br/>
              And Liberal Arts<br/>
              Rajamangala University of Technology Lanna<br/>
              128 Huay Kaew Road, Chang Puek,<br/>
              Mueang, Chiang Mai 50300<br/>
              THAILAND<br/>
              </div>
              <div class="date">${issueDateBBE}</div>
            </div>
          </div>

          <div class="content">
            <p>Dear ${studentEnroll.student_training.company.company_name_th}</p>
            <p style="text-align: center;">Subject: Request for Internship Program Student Placement</p>

          ${
            course_id === 1
              ? `<p class="indent">We would like to express our sincere gratitude for your willingness to
                  accommodate a student from the International Business Management Program at the Faculty
                  of Business Administration and Liberal Arts, Rajamangala University of Technology Lanna
                  (RMUTL), as a student trainee in your esteemed organization.</p>
                
                  <p class="indent">The faculty hereby requests permission to send the following student to
                  undertake an internship during the academic year ${year}:</p>`
              : `<p class="indent"> In accordance with your kind support for accepting an undergraduate student from
                  the Bachelor’s Degree Program in International Business Management, Faculty of Business
                  Administration and Liberal Arts, Rajamangala University of Technology Lanna, for his internship
                  placement in your organization, we would like to submit the following student for his internship: </p>`
          }
            
            <p class="indent">1. ${prefix} ${studentEnroll.student.name} ${studentEnroll.student.middle_name || ''} ${studentEnroll.student.surname}</p>

            <p class="indent">
              ${
                course_id === 1
                  ? `The proposed internship period is from `
                  : `We are sending one student to report for his internship in the second semester of
                    the academic year ${year}, from`
              } ${startDate} to ${endDate}.
               ${
                 course_id === 1
                   ? `Upon completion of the internship, we kindly ask for your evaluation of the student’s
                      performance based on the internship evaluation form we have provided. We would appreciate it if
                      you could return the completed form to the International Business Management Program at
                      Rajamangala University of Technology Lanna.`
                   : `Upon completion of the student’s internship, we kindly ask you to evaluate his performance using the
                      enclosed evaluation form and return it to the International Business Management Program,
                      Faculty of Business Administration and Liberal Arts, Rajamangala University of Technology Lanna, via
                      email at sjariangprasert@gmail.com, or place it in a sealed envelope with the student.`
               }
            </p>

            <p class="indent">
              ${
                course_id === 1
                  ? `We sincerely appreciate your support in accepting our student for the internship
                    program, and we hope for your continued collaboration in the future. Thank you for your
                    consideration.`
                  : `We sincerely appreciate your generosity in accepting our student for his internship at
                    your organization and hope to receive your continued support in the future.`
              }
            </p>

            <div class="signature">
              <p>Sincerely yours,</p>
              <br/>
              (Associate Professor Kanthana Ditkaew)
              <br/>
              Dean, Faculty of Business Administration and Liberal Arts
            </div>
            <p class="info footer"> 
              International Business Management Program<br/>
              Tel: +66 835700055
            </p>
          </div>
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
    response.header(
      'Content-Disposition',
      `inline; filename=refer_letter_${studentEnroll.student.student_id}.pdf`
    )
    response.send(pdf)
  }
}
