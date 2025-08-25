import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import xlsx from 'xlsx'
import path from 'node:path'

export default class ExcelController {
  async upload({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: '10mb',
      extnames: ['xlsx', 'xls'],
    })

    if (!file) {
      return response.badRequest({ message: 'No file uploaded' })
    }

    // Move file to tmp/uploads
    const fileName = `${new Date().getTime()}.${file.extname}`
    const uploadPath = app.makePath('tmp/uploads')

    await file.move(uploadPath, {
      name: fileName,
      overwrite: true,
    })

    const filePath = path.join(uploadPath, fileName)

    // Read Excel file
    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = xlsx.utils.sheet_to_json(sheet)

    console.log(jsonData)

    return response.ok({ message: 'Excel parsed', data: jsonData })
  }
}
