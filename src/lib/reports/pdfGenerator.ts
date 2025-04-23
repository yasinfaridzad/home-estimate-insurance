
const PDFDocument = require('pdfkit') 

export function generatePDFBuffer(items: any[], user: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const buffers: Buffer[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })

      doc.fontSize(18).text(`HomeScan Report für ${user.name}`, { align: 'center' }).moveDown()

      items.forEach((item, index) => {
        doc.fontSize(12).text(`${index + 1}. ${item.correctedName || item.name}`)
        doc.text(`Preis: €${item.estimatedValue || 'Unbekannt'}`)
        doc.text(`Confidence: ${Math.round(item.confidence * 100)}%`)
        doc.moveDown()
      })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
