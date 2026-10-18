import { useState } from 'react'
import { PlaneTakeoff, Map, CircleCheck, Pencil, Info } from 'lucide-react'

type Trip = {
  id: string
  destination: string
  country: string
  startDate: string
  endDate: string
  budget: number
  status: 'Planning' | 'Upcoming' | 'Completed'
}

type Props = {
  trips: Trip[]
  budgetLimit: number
  onBudgetChange: (amount: number) => void
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount)

export default function TravelOverview({
  trips,
  budgetLimit,
  onBudgetChange,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draftBudget, setDraftBudget] = useState(String(budgetLimit))
  const [budgetError, setBudgetError] = useState('')

  const planningTrips = trips.filter(t => t.status === 'Planning')
  const completedTrips = trips.filter(t => t.status === 'Completed')

  const allocated = planningTrips.reduce((sum, trip) => sum + trip.budget, 0)
  const remaining = budgetLimit - allocated
  const percentage = budgetLimit > 0
    ? Math.min((allocated / budgetLimit) * 100, 100)
    : 0

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const nextTrip = trips
    .filter(t => t.status === 'Upcoming' && t.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]

  const formatDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const saveBudget = () => {
    const amount = Number(draftBudget)

    if (!draftBudget.trim() || !Number.isFinite(amount) || amount < 0) {
      setBudgetError('Enter a valid budget of S$0 or more.')
      return
    }

    if (amount < allocated) {
      setBudgetError(
        `Your budget cannot be below ${money(allocated)}, which is already allocated.`
      )
      return
    }

    onBudgetChange(amount)
    setEditing(false)
    setBudgetError('')
  }

  const cardClass =
    'rounded-2xl border border-atlas-stone bg-white p-6 shadow-sm dark:border-[#3B443E] dark:bg-[#242927]'
  const mutedClass = 'text-atlas-muted dark:text-[#A5ADA6]'

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-atlas-forest dark:text-[#F5F2E9]">
          Your travel overview
        </h2>
        <p className={`mt-1 text-sm ${mutedClass}`}>
          A clearer picture of your travel plans
        </p>
      </div>

      <div className="rounded-2xl bg-atlas-forest p-7 text-[#F5F2E9] shadow-sm dark:border dark:border-[#3B443E] dark:bg-[#303B35]">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[#D5DFD5] dark:text-[#C7CEC6]">
            Next confirmed trip
          </p>
          <PlaneTakeoff size={22} className="text-atlas-champagne" />
        </div>

        {nextTrip ? (
          <>
            <h3 className="text-3xl font-bold tracking-tight">
              {nextTrip.destination}, {nextTrip.country}
            </h3>
            <p className="mt-3 text-[#D5DFD5] dark:text-[#C7CEC6]">
              {formatDate(nextTrip.startDate)} – {formatDate(nextTrip.endDate)}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-5 dark:border-[#59675E]">
              <span className="text-sm text-[#D5DFD5] dark:text-[#C7CEC6]">
                Estimated trip budget
              </span>
              <span className="text-2xl font-bold text-atlas-champagne">
                {money(nextTrip.budget)}
              </span>
            </div>
          </>
        ) : (
          <div>
            <h3 className="text-2xl font-bold">No confirmed trips yet</h3>
            <p className="mt-2 text-sm text-[#D5DFD5] dark:text-[#C7CEC6]">
              Confirm a trip to see your next adventure here.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <div className="mb-5 inline-flex rounded-xl bg-[#EDF0E8] p-2.5 dark:bg-[#354139]">
            <Map size={23} className="text-atlas-sage dark:text-atlas-champagne" />
          </div>
          <p className="text-3xl font-bold text-atlas-forest dark:text-[#F5F2E9]">
            {planningTrips.length}
          </p>
          <h3 className="mt-3 font-semibold text-atlas-forest dark:text-[#F5F2E9]">
            Trips in planning
          </h3>
          <p className={`mt-1 text-sm ${mutedClass}`}>Not yet confirmed</p>
        </div>

        <div className={cardClass}>
          <div className="mb-5 inline-flex rounded-xl bg-[#F3EDE1] p-2.5 dark:bg-[#413D32]">
            <CircleCheck size={23} className="text-[#9A7D50] dark:text-atlas-champagne" />
          </div>
          <p className="text-3xl font-bold text-atlas-forest dark:text-[#F5F2E9]">
            {completedTrips.length}
          </p>
          <h3 className="mt-3 font-semibold text-atlas-forest dark:text-[#F5F2E9]">
            Completed trips
          </h3>
          <p className={`mt-1 text-sm ${mutedClass}`}>Travel history</p>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-atlas-sage dark:text-atlas-champagne">
              Your travel planning budget
            </p>
            <h3 className="mt-2 text-3xl font-bold text-atlas-forest dark:text-[#F5F2E9]">
              {money(budgetLimit)}
            </h3>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              Budget limit set by you
            </p>
          </div>

          <button
            type="button"
            aria-label="Edit planning budget"
            onClick={() => {
              setDraftBudget(String(budgetLimit))
              setBudgetError('')
              setEditing(!editing)
            }}
            className="rounded-xl bg-atlas-ivory p-3 text-atlas-forest transition-colors hover:bg-atlas-stone dark:bg-[#354039] dark:text-atlas-champagne dark:hover:bg-[#435147]"
          >
            <Pencil size={18} />
          </button>
        </div>

        {editing && (
          <div className="mt-5 rounded-xl bg-atlas-ivory p-4 dark:bg-[#303B35]">
            <label
              htmlFor="planning-budget"
              className="mb-2 block text-sm font-medium text-atlas-forest dark:text-[#F5F2E9]"
            >
              Set your planning budget (SGD)
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="planning-budget"
                type="number"
                min="0"
                step="0.01"
                value={draftBudget}
                onChange={event => {
                  setDraftBudget(event.target.value)
                  setBudgetError('')
                }}
                className="min-w-0 flex-1 rounded-lg border border-atlas-stone bg-white px-3 py-2 text-atlas-forest outline-none focus:border-atlas-sage focus:ring-2 focus:ring-atlas-sage/20 dark:border-[#536057] dark:bg-[#242927] dark:text-[#F5F2E9] dark:focus:border-atlas-champagne"
              />
              <button
                type="button"
                onClick={saveBudget}
                className="rounded-lg bg-atlas-forest px-4 py-2 font-medium text-white transition-colors hover:bg-[#355548] dark:bg-atlas-champagne dark:text-[#171A19] dark:hover:bg-[#D6C19F]"
              >
                Save
              </button>
            </div>
            {budgetError && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">
                {budgetError}
              </p>
            )}
          </div>
        )}

        <div className="mt-7">
          <div className="mb-2 flex justify-between gap-3 text-sm">
            <span className={mutedClass}>Allocated to planned trips</span>
            <span className="font-medium text-atlas-forest dark:text-[#F5F2E9]">
              {money(allocated)} / {money(budgetLimit)}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-atlas-stone dark:bg-[#3B443E]">
            <div
              className="h-full rounded-full bg-atlas-sage transition-all duration-300 dark:bg-atlas-champagne"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${mutedClass}`}>Allocated</p>
              <p className="mt-1 text-2xl font-bold text-atlas-forest dark:text-[#F5F2E9]">
                {money(allocated)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${mutedClass}`}>Remaining</p>
              <p className={`mt-1 text-2xl font-bold ${
                remaining < 0
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-atlas-sage dark:text-atlas-champagne'
              }`}>
                {money(remaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 border-t border-atlas-stone pt-4 text-sm text-atlas-muted dark:border-[#3B443E] dark:text-[#A5ADA6]">
          <Info size={17} className="mt-0.5 shrink-0" />
          <p>
            Only trips in Planning status count towards this limit.
            Confirmed and completed trips are excluded.
          </p>
        </div>
      </div>
    </section>
  )
}
