import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

const Y_TOLERANCE = 2

// Reads a PDF file entirely in-browser and reconstructs it as an array of
// text rows, clustering text items by y-position (PDF text items don't
// arrive pre-grouped into table rows).
export async function extractPdfRows(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const rows = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    const items = content.items
      .filter((item) => item.str && item.str.trim() !== '')
      .map((item) => ({ text: item.str, x: item.transform[4], y: item.transform[5] }))
      .sort((a, b) => b.y - a.y || a.x - b.x)

    let currentRow = []
    let currentY = null

    const flushRow = () => {
      if (currentRow.length === 0) return
      const line = currentRow
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (line) rows.push(line)
    }

    items.forEach((item) => {
      if (currentY === null || Math.abs(item.y - currentY) <= Y_TOLERANCE) {
        currentRow.push(item)
        currentY = currentY === null ? item.y : currentY
      } else {
        flushRow()
        currentRow = [item]
        currentY = item.y
      }
    })
    flushRow()
  }

  return rows
}
