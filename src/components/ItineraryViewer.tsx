import { useState } from 'react'
import { downloadItineraryPdf } from '../services/itineraryPdf'
import type { ReactNode } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Lightbulb, MapPin, TrainFront, Wallet, X, Printer, Download } from 'lucide-react'
import type { StructuredItinerary } from '../services/itineraryAPI'

type TripDetails = { destination: string; country: string; startDate: string; endDate: string; budget: number }
type Props = {
  trip: TripDetails
  itinerary: StructuredItinerary | string | null
  generating: boolean
  error: string
  storageError: string
  onClose: () => void
  onDownload: () => void
}
const money = (n: number) => new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)
const dateLabel = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
const labels: Record<string, string> = { accommodation: 'Accommodation', food: 'Food & drink', transport: 'Transport', activities: 'Activities', miscellaneous: 'Miscellaneous' }

export default function ItineraryViewer({ trip, itinerary, generating, error, storageError, onClose, onDownload }: Props) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [pdfError, setPdfError] = useState('')
  const savePdf = () => {
    if (itinerary === null) return
    try {
      setPdfError('')
      downloadItineraryPdf(trip, itinerary)
    } catch (error) {
      console.error('PDF export failed:', error)
      setPdfError('Could not create the PDF. Please try again.')
    }
  }
  const structured = itinerary !== null && typeof itinerary !== 'string' ? itinerary : null
  const totalDays = structured?.days.length ?? 0
  const breakdown = structured?.budgetBreakdown
  const budgetTotal = breakdown ? Object.values(breakdown).reduce((sum, n) => sum + n, 0) : 0
  const active = structured?.days[Math.min(selectedDay, Math.max(0, totalDays - 1))]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-6 print:static print:block print:bg-white print:p-0" onMouseDown={e => { if (e.target === e.currentTarget && !generating) onClose() }}>

      <section id="compass-itinerary-print" role="dialog" aria-modal="true" aria-labelledby="compass-itinerary-heading" className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white text-atlas-forest shadow-2xl dark:bg-[#242927] dark:text-[#F5F2E9] print:block">
        <header className="shrink-0 border-b border-atlas-stone p-5 sm:p-7 dark:border-[#3B443E] print:border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-atlas-sage dark:text-atlas-champagne"><MapPin size={14}/> COMPASS AI · TRAVEL GUIDE</p>
              <h2 id="compass-itinerary-heading" className="text-2xl font-bold sm:text-3xl">{trip.destination}, {trip.country}</h2>
              <p className="mt-2 text-sm text-atlas-muted dark:text-[#B7C2B8]">{dateLabel(trip.startDate)} – {dateLabel(trip.endDate)}</p>
            </div>
            <button type="button" disabled={generating} onClick={onClose} aria-label="Close itinerary" className="rounded-xl p-2 hover:bg-atlas-ivory disabled:opacity-40 dark:hover:bg-[#303B35] print:hidden"><X size={20}/></button>
          </div>
        </header>
        <div id="compass-itinerary-scroll" className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-7 print:overflow-visible">
          {generating && <p role="status" className="rounded-xl bg-atlas-ivory p-4 text-atlas-forest dark:bg-[#303B35] dark:text-atlas-champagne">Generating your travel guide with Gemini…</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
          {pdfError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{pdfError}</p>}
          {storageError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-[#493D2A] dark:text-amber-200">{storageError}</p>}
          {itinerary !== null && <p className="text-xs leading-5 text-atlas-muted dark:text-[#B7C2B8] print:text-gray-600">AI-generated suggestions. Verify opening hours, routes, prices and availability before travelling.</p>}
          {typeof itinerary === 'string' && <div className="whitespace-pre-wrap break-words text-sm leading-7">{itinerary}</div>}
          {structured && <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Summary icon={<CalendarDays size={19}/>} value={String(totalDays)} label="Days" />
              <Summary icon={<Wallet size={19}/>} value={money(trip.budget)} label="Trip budget" />
              <Summary icon={<MapPin size={19}/>} value={trip.destination} label="Destination" />
            </div>
            <div className="rounded-2xl bg-atlas-ivory p-5 text-sm leading-7 dark:bg-[#303B35]">{structured.introduction}</div>
            <section>
              <h3 className="mb-4 text-lg font-bold">Your daily itinerary</h3>
              <div className="mb-4 flex flex-wrap gap-2 print:hidden" role="group" aria-label="Select itinerary day">
                {structured.days.map((day, i) => <button type="button" key={`${day.date}-${i}`} onClick={() => setSelectedDay(i)} aria-pressed={selectedDay === i} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${selectedDay === i ? 'bg-atlas-forest text-white dark:bg-atlas-champagne dark:text-[#171A19]' : 'border border-atlas-stone hover:bg-atlas-ivory dark:border-[#3B443E] dark:hover:bg-[#303B35]'}`}>Day {day.day}</button>)}
              </div>
              {active && <div className="compass-screen-day rounded-2xl border border-atlas-stone p-5 dark:border-[#3B443E]">
                <DayContent day={active}/>
              </div>}
              <div className="mt-4 flex items-center justify-between print:hidden">
                <button type="button" disabled={selectedDay === 0} onClick={() => setSelectedDay(d => Math.max(0, d - 1))} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-35"><ChevronLeft size={16}/> Previous</button>
                <button type="button" disabled={selectedDay >= totalDays - 1} onClick={() => setSelectedDay(d => Math.min(totalDays - 1, d + 1))} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-35">Next day <ChevronRight size={16}/></button>
              </div>
              <div className="hidden print:block">{structured.days.map((day, i) => <div key={`${day.date}-${i}`} className="compass-print-day mb-5 rounded-xl border border-gray-200 p-4"><DayContent day={day}/></div>)}</div>
            </section>
            {breakdown && <section className="rounded-2xl border border-atlas-stone p-5 dark:border-[#3B443E]">
              <h3 className="mb-4 text-lg font-bold">Estimated budget breakdown</h3>
              {Object.entries(breakdown).map(([key, value]) => <div key={key} className="mb-3">
                <div className="mb-1 flex justify-between gap-2 text-sm"><span>{labels[key] ?? key}</span><span className="font-semibold">{money(value)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-atlas-stone dark:bg-[#3B443E]"><div className="h-full rounded-full bg-atlas-sage dark:bg-atlas-champagne" style={{ width: `${budgetTotal > 0 ? Math.min(100, Math.max(0, value / budgetTotal * 100)) : 0}%` }}/></div>
              </div>)}
              <p className="mt-4 text-sm font-semibold">Estimated allocation: {money(budgetTotal)} / {money(trip.budget)}</p>
              <p className="mt-1 text-xs text-atlas-muted dark:text-[#B7C2B8]">These are planning estimates; daily costs and budget categories may overlap.</p>
            </section>}
            {structured.travelTips.length > 0 && <section className="rounded-2xl bg-atlas-ivory p-5 dark:bg-[#303B35]">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><Lightbulb size={19}/> Practical travel tips</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6">{structured.travelTips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
            </section>}
          </>}
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-atlas-stone p-4 dark:border-[#3B443E] print:hidden">
          {itinerary !== null && <>
            <button type="button" onClick={onDownload} className="flex items-center gap-2 rounded-xl border border-atlas-stone px-4 py-2 text-sm font-medium dark:border-[#3B443E]"><Download size={16}/> Download copy</button>
            <button type="button" onClick={savePdf} className="flex items-center gap-2 rounded-xl border border-atlas-stone px-4 py-2 text-sm font-medium dark:border-[#3B443E]"><Printer size={16}/> Download PDF</button>
          </>}
          {!generating && <button type="button" onClick={onClose} className="rounded-xl bg-atlas-forest px-5 py-2 text-sm font-semibold text-white dark:bg-atlas-champagne dark:text-[#171A19]">Close</button>}
        </footer>
      </section>
    </div>
  )
}
function Summary({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return <div className="min-w-0 rounded-xl bg-atlas-ivory p-3 dark:bg-[#303B35]"><div className="mb-2 text-atlas-sage dark:text-atlas-champagne">{icon}</div><p className="break-words text-base font-bold sm:text-xl">{value}</p><p className="mt-1 text-xs text-atlas-muted dark:text-[#B7C2B8]">{label}</p></div>
}
function DayContent({ day }: { day: StructuredItinerary['days'][number] }) {
  return <>
    <p className="text-xs font-semibold uppercase tracking-widest text-atlas-sage dark:text-atlas-champagne">{dateLabel(day.date)}</p>
    <h4 className="mt-1 text-xl font-bold">Day {day.day} · {day.title}</h4>
    <div className="mt-5 space-y-4">
      {([['Morning', day.morning], ['Afternoon', day.afternoon], ['Evening', day.evening]] as const).map(([label, activity]) => <div key={label} className="flex gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-atlas-ivory text-atlas-sage dark:bg-[#303B35] dark:text-atlas-champagne"><Clock3 size={16}/></div><div><p className="font-semibold">{label}</p><p className="mt-1 text-sm leading-6 text-atlas-muted dark:text-[#CBD1CB]">{activity}</p></div></div>)}
    </div>
    <div className="mt-5 space-y-2 border-t border-atlas-stone pt-4 text-sm dark:border-[#3B443E]"><p className="flex items-start gap-2"><TrainFront size={17} className="mt-0.5 shrink-0 text-atlas-sage"/><span><strong>Transport:</strong> {day.transport}</span></p><p className="flex items-center gap-2"><Wallet size={17} className="text-atlas-sage"/><strong>Estimated day cost: {money(day.estimatedCostSGD)}</strong></p></div>
  </>
}
