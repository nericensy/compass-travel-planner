import { useForm } from 'react-hook-form'
import type { Country } from '../hooks/useCountries'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, PlaneTakeoff } from 'lucide-react'

//Set the validation rules 
const tripSchema = z.object({
  destination: z.string().trim().min(1, 'Destination is required'),
  country: z.string().trim().min(1, 'Country is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.coerce.number<number>().positive('Budget must be greater than 0'),
  confirmed: z.boolean(),
}).refine(
  data => !data.startDate || !data.endDate || data.endDate >= data.startDate,
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  }
)

type TripFormData = z.infer<typeof tripSchema>

type Props = {
  onClose: () => void
  onAdd: (newTrip: TripFormData) => void
  countries: Country[]
  countriesLoading: boolean
  countriesError: boolean
  initialData?: TripFormData
  isEditing?: boolean
}

const inputClass =
  'w-full rounded-xl border border-atlas-stone bg-white px-4 py-3 text-sm text-atlas-forest outline-none transition-colors placeholder:text-atlas-muted focus:border-atlas-sage focus:ring-2 focus:ring-atlas-sage/20 dark:border-[#3B443E] dark:bg-[#303B35] dark:text-[#F5F2E9] dark:placeholder:text-[#A5ADA6] dark:focus:border-atlas-champagne dark:focus:ring-atlas-champagne/20'

export default function AddTripModal({
  onClose,
  onAdd,
  countries,
  countriesLoading,
  countriesError,
  initialData,
  isEditing = false,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: initialData ?? {
      destination: '',
      country: '',
      startDate: '',
      endDate: '',
      budget: 0,
      confirmed: false,
    },
  })

  const confirmed = watch('confirmed')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#171A19]/65 p-4 backdrop-blur-[3px]"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-trip-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-atlas-stone bg-[#FFFEFB] p-7 text-atlas-forest shadow-2xl dark:border-[#3B443E] dark:bg-[#242927] dark:text-[#F5F2E9]"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex rounded-xl bg-[#EDF0E8] p-3 text-atlas-forest dark:bg-[#3B443E] dark:text-atlas-champagne">
              <PlaneTakeoff size={22} />
            </div>
            <h2 id="add-trip-title" className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Edit Trip' : 'Plan a new trip'}
            </h2>
            <p className="mt-1 text-sm text-atlas-muted dark:text-[#A5ADA6]">
              {isEditing
                ? 'Update your travel details and save your changes.'
                : 'Every great adventure starts with a plan.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="rounded-lg p-2 text-atlas-muted transition-colors hover:bg-atlas-ivory hover:text-atlas-forest dark:text-[#A5ADA6] dark:hover:bg-[#303B35] dark:hover:text-atlas-champagne"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Validate the form before passing it back to app.tsx */}
        <form noValidate onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div>
            <label htmlFor="destination" className="mb-1 block text-sm font-medium">
              Destination *
            </label>
            <input
              id="destination"
              autoFocus
              placeholder="e.g. Tokyo"
              className={inputClass}
              aria-invalid={!!errors.destination}
              {...register('destination')}
            />
            {errors.destination && (
              <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">
                {errors.destination.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="country" className="mb-1 block text-sm font-medium">
              Country *
            </label>
            {countriesError ? (
              <input
                id="country"
                placeholder="Enter country manually"
                className={inputClass}
                aria-invalid={!!errors.country}
                {...register('country')}
              />
            ) : (
              <select
                id="country"
                className={inputClass}
                disabled={countriesLoading}
                aria-invalid={!!errors.country}
                {...register('country')}
              >
                <option value="">
                  {countriesLoading ? 'Loading countries...' : 'Select a country'}
                </option>
                {countries.map(country => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            )}
            {errors.country && (
              <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">
                {errors.country.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
                Start date *
              </label>
              <input
                id="startDate"
                type="date"
                className={inputClass}
                aria-invalid={!!errors.startDate}
                {...register('startDate')}
              />
              {errors.startDate && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
                End date *
              </label>
              <input
                id="endDate"
                type="date"
                className={inputClass}
                aria-invalid={!!errors.endDate}
                {...register('endDate')}
              />
              {errors.endDate && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="budget" className="mb-1 block text-sm font-medium">
              Estimated budget (SGD) *
            </label>
            <input
              id="budget"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 2500"
              className={inputClass}
              aria-invalid={!!errors.budget}
              {...register('budget')}
            />
            {errors.budget && (
              <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">
                {errors.budget.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-atlas-stone bg-atlas-ivory/50 p-4 dark:border-[#3B443E] dark:bg-[#303B35]">
            <p className="mb-3 text-sm font-semibold">Have you confirmed your trip?</p>
            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="trip-confirmation"
                  className="accent-[#243A32] dark:accent-[#C4AD87]"
                  checked={confirmed === true}
                  onChange={() => setValue('confirmed', true)}
                />
                Yes, my trip is confirmed
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="trip-confirmation"
                  className="accent-[#243A32] dark:accent-[#C4AD87]"
                  checked={confirmed === false}
                  onChange={() => setValue('confirmed', false)}
                />
                No, I'm still planning
              </label>
            </div>
            <p className="mt-3 text-xs text-atlas-muted dark:text-[#A5ADA6]">
              Atlas automatically updates your trip status based on
              confirmation and travel dates.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-atlas-stone px-5 py-3 text-sm font-medium transition-colors hover:bg-atlas-ivory dark:border-[#3B443E] dark:hover:bg-[#303B35]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-atlas-forest px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#355548] dark:bg-atlas-champagne dark:text-[#171A19] dark:hover:bg-[#D6C19F]"
            >
              {isEditing ? 'Save Changes' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
