import { jsPDF } from 'jspdf'
import type { StructuredItinerary } from './itineraryAPI'

type TripDetails = {
  destination: string
  country: string
  startDate: string
  endDate: string
  budget: number
}

const sgd = (n: number) => `SGD ${new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 }).format(n)}`

// Replace special characters that may not display properly in the PDF.
const pdfText = (value: string) => value
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\u2022/g, '-')
  .replace(/\u00a0/g, ' ')


// Generate an A4 PDF using the trip details and itinerary.
export function downloadItineraryPdf(trip: TripDetails, itinerary: StructuredItinerary | string) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  const bottom = pageHeight - 21
  let y = 23

  const green: [number, number, number] = [36, 58, 50]
  const muted: [number, number, number] = [93, 108, 98]

 // Add a new page when there isn't enough space for the next section.
  function newPage() { pdf.addPage(); y = 23 }
  function ensureSpace(mm: number) { if (y + mm > bottom) newPage() }
  function paragraph(text: string, options: { size?: number; bold?: boolean; indent?: number; after?: number; color?: [number, number, number] } = {}) {
    const size = options.size ?? 10
    const indent = options.indent ?? 0
    const lineHeight = size * 0.48
    pdf.setFont('helvetica', options.bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(...(options.color ?? green))
    const lines = pdf.splitTextToSize(pdfText(text), contentWidth - indent) as string[]
    for (const line of lines) {
      ensureSpace(lineHeight)
      pdf.text(line || ' ', margin + indent, y)
      y += lineHeight
    }
    y += options.after ?? 3
  }
  function sectionHeading(text: string) {
    ensureSpace(17)
    y += 3
    paragraph(text, { size: 14, bold: true, after: 5 })
  }
  function activity(label: string, value: string) {
    ensureSpace(14)
    paragraph(label, { size: 10, bold: true, after: 1 })
    paragraph(value, { size: 10, indent: 3, after: 3 })
  }

  // Cover and summary
  pdf.setFillColor(...green)
  pdf.rect(0, 0, pageWidth, 11, 'F')
  paragraph('COMPASS  /  AI TRAVEL GUIDE', { size: 10, bold: true, color: muted, after: 7 })
  paragraph(`${trip.destination}, ${trip.country}`, { size: 23, bold: true, after: 5 })
  paragraph(`${trip.startDate} to ${trip.endDate}  |  Trip budget: ${sgd(trip.budget)}`, { size: 10, after: 8 })
  pdf.setDrawColor(210, 217, 210)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 8

  if (typeof itinerary === 'string') {
    // Older saved itineraries remain exportable without a new API request.
    for (const rawLine of itinerary.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line) { y += 2; continue }
      const cleaned = line.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').replace(/^\*\s*/, '- ')
      if (/^#{1,6}\s/.test(line)) sectionHeading(cleaned)
      else if (line !== '---') paragraph(cleaned, { after: 2 })
    }
  } else {
    paragraph(itinerary.introduction, { size: 10, after: 6 })
    sectionHeading('Daily itinerary')
    for (const day of itinerary.days) {
      // Start each day on a new page if there isn't enough room for its header
      // and at least one activity. Longer activities continue naturally.
      ensureSpace(52)
      paragraph(`DAY ${day.day}  |  ${day.date}`, { size: 9, bold: true, color: muted, after: 2 })
      paragraph(day.title, { size: 13, bold: true, after: 5 })
      activity('MORNING', day.morning)
      activity('AFTERNOON', day.afternoon)
      activity('EVENING', day.evening)
      activity('TRANSPORT', day.transport)
      paragraph(`Estimated daily spending: ${sgd(day.estimatedCostSGD)}`, { size: 10, bold: true, after: 8 })
      pdf.setDrawColor(222, 226, 222)
      ensureSpace(3)
      pdf.line(margin, y, pageWidth - margin, y)
      y += 4
    }

    sectionHeading('Estimated budget breakdown')
    const categories: Array<[string, number]> = [
      ['Accommodation', itinerary.budgetBreakdown.accommodation],
      ['Food & drink', itinerary.budgetBreakdown.food],
      ['Transport', itinerary.budgetBreakdown.transport],
      ['Activities', itinerary.budgetBreakdown.activities],
      ['Miscellaneous', itinerary.budgetBreakdown.miscellaneous],
    ]
    for (const [label, amount] of categories) paragraph(`${label}: ${sgd(amount)}`, { after: 2 })
    sectionHeading('Practical travel tips')
    itinerary.travelTips.forEach((tip, index) => paragraph(`${index + 1}. ${tip}`, { after: 3 }))
  }

  ensureSpace(15)
  paragraph('AI-generated suggestions. Verify prices, opening hours and transport details before travelling.', { size: 8, color: muted })

  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    pdf.setDrawColor(220, 225, 220)
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...muted)
    pdf.text('COMPASS  /  TRAVEL GUIDE', margin, pageHeight - 10)
    pdf.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  const safeName = trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'trip'
  pdf.save(`compass-${safeName}-itinerary.pdf`)
}
