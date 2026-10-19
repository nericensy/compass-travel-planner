import AddTripModal from './components/AddTripModal'
import TravelOverview from './components/TravelOverview'
import { useEffect, useMemo, useState } from 'react'
import { useCountries } from './hooks/useCountries'
import { generateItinerary } from './services/itineraryAPI'
import type { StructuredItinerary } from './services/itineraryAPI'
import ItineraryViewer from './components/ItineraryViewer'

import {
  Plus,
  Search,
  Moon,
  Sun,
  Compass,
  ArrowUpRight,
  Trash2,
  Sparkles,
  FileText,
} from 'lucide-react'


type Trip = {
  id: string
  destination: string
  country: string
  startDate: string
  endDate: string
  budget: number
  confirmed: boolean
  status: 'Planning' | 'Upcoming' | 'Completed'
}
type TripInput = Omit<Trip, 'id' | 'status'>

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount)


const getLocalToday = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Check if the selected dates overlap with another trip
const hasDateOverlap = (
  startDate: string,
  endDate: string,
  trips: Trip[],
  excludeTripId?: string
) => {
  return trips.some(trip =>
    trip.id !== excludeTripId &&
    startDate <= trip.endDate &&
    endDate >= trip.startDate
  )
}

// Update the trip status based on its end date and confirmation
const getTripStatus = (
  endDate: string,
  confirmed: boolean,
  today: string
): Trip['status'] => {
  if (endDate < today) {
    return 'Completed'
  }

  return confirmed ? 'Upcoming' : 'Planning'
}

const countryCodes: Record<string, string> = {
  Japan: 'jp',
  japan: 'jp',
  'South Korea': 'kr',
  Indonesia: 'id',
  indonesia: 'id',
  Thailand: 'th',
  thailand: 'th',
  Australia: 'au',
  australia: 'au',
  france: 'fr',
  France: 'fr',
  Singapore: 'sg',
  singapore: 'sg',
  China: 'cn',
  china: 'cn',
  taiwan: 'tw',
  Taiwan: 'tw',
  Malaysia: 'my',
  malaysia: 'my',
  Vietnam: 'vn',
  vietnam: 'vn',
  'United States': 'us',
  'united states' : 'us',
  'United states': 'us',
  'united States': 'us',
  'us': 'us',
  'US': 'us',
  'Us': 'us',
  'America':'us',
  'america': 'us',
  'United Kingdom': 'gb',
  'united kingdom': 'gb',
  'UK': 'gb',
  'uk': 'gb',
  'England': 'gb',
  'england': 'gb',
  Italy: 'it',
  italy : 'it',
  Spain: 'es',
  spain: 'es',
  Germany: 'de',
  germany: 'de',
  Switzerland: 'ch',
  switzerland: 'ch',
  Canada: 'ca',
  canada: 'ca',
  'New Zealand': 'nz',
  'new zealand': 'nz',
}

const countryAliases: Record<string, string> = {
  'South Korea': 'Korea (Republic of)',
  'United States': 'United States',
}


// Store the generated text against a trip ID and its relevant details.
type SavedItinerary = { fingerprint: string; text?: string; data?: StructuredItinerary }
type SavedItineraries = Record<string, SavedItinerary>
const ITINERARY_STORAGE_KEY = 'compass-saved-itineraries'

const tripFingerprint = (trip: Trip) =>
  JSON.stringify([trip.destination, trip.country, trip.startDate, trip.endDate, trip.budget])

function App() {

  const { countries, loading: countriesLoading, error: countriesError } =
  useCountries()

  const [today, setToday] = useState(getLocalToday)
  useEffect(() => {
  const interval = window.setInterval(() => {
    setToday(getLocalToday())
  }, 60_000)

  return () => window.clearInterval(interval)
  }, [])

  const [showAddTrip, setShowAddTrip] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [budgetLimit, setBudgetLimit] = useState(() => {
  const saved = localStorage.getItem('atlas-planning-budget')
  const amount = saved === null ? 10000 : Number(saved)
    return Number.isFinite(amount) && amount >= 0 ? amount : 10000
  })

  useEffect(() => {
    localStorage.setItem('atlas-planning-budget', String(budgetLimit))
  }, [budgetLimit])

  const [trips, setTrips] = useState<Trip[]>([])
  const [search, setSearch] = useState('')
  const [savedItineraries, setSavedItineraries] = useState<SavedItineraries>(() => {
    try {
      const stored = localStorage.getItem(ITINERARY_STORAGE_KEY)
      return stored ? JSON.parse(stored) as SavedItineraries : {}
    } catch {
      return {}
    }
  })
  const [activeItineraryTrip, setActiveItineraryTrip] = useState<Trip | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [itineraryError, setItineraryError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('atlas-theme') === 'dark'
  )

 // Load initial trips from JSON, then restore saved changes from localStorage.
useEffect(() => {
  fetch('/data/trips.json')
    .then(response => {
      if (!response.ok) throw new Error('Unable to load trips')
      return response.json()
    })
    .then((data: Trip[]) => {
      const initialTrips = data.map(trip => ({
        ...trip,
        confirmed: trip.confirmed ?? trip.status === 'Upcoming',
      }))

      const savedTrips = localStorage.getItem('compass-trips')

      if (savedTrips !== null) {
        try {
          const parsedTrips: unknown = JSON.parse(savedTrips)

          if (Array.isArray(parsedTrips)) {
            setTrips(parsedTrips as Trip[])
          } else {
            setTrips(initialTrips)
          }
        } catch {
          setTrips(initialTrips)
        }
      } else {
        setTrips(initialTrips)
      }
    })
    .catch(() => setError('Unable to load trip data.'))
    .finally(() => setLoading(false))
}, [])

// Save trip changes after initial data has finished loading.
useEffect(() => {
  if (loading || error) return

  try {
    localStorage.setItem('compass-trips', JSON.stringify(trips))
  } catch {
    console.error('Unable to save trips to browser storage.')
  }
}, [trips, loading, error])


  // Persist the selected theme between browser sessions.
  useEffect(() => {
    localStorage.setItem(
      'atlas-theme',
      darkMode ? 'dark' : 'light'
    )
  }, [darkMode])


// Recalculate trip statuses when the trip data or date changes
const calculatedTrips = useMemo(
  () =>
    trips.map(trip => ({
      ...trip,
      status: getTripStatus(
        trip.endDate,
        trip.confirmed,
        today
      ),
    })),
  [trips, today]
)

  
// Save generated itineraries in the browser for later use.
useEffect(() => {
  try {
    localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(savedItineraries))
    setStorageError('')
  } catch {
    setStorageError('Browser storage is full or unavailable. Download a copy before leaving.')
  }
}, [savedItineraries])

const openItinerary = async (trip: Trip) => {
  if (generatingId) return // Prevent duplicate requests while one is running.

  setActiveItineraryTrip(trip)
  setItineraryError('')
  const saved = savedItineraries[trip.id]
  if (saved?.fingerprint === tripFingerprint(trip)) return

  setGeneratingId(trip.id)
  try {
    const data = await generateItinerary({
      destination: trip.destination,
      country: trip.country,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
    })
    setSavedItineraries(previous => ({
      ...previous,
      [trip.id]: { fingerprint: tripFingerprint(trip), data },
    }))
  } catch (error) {
    setItineraryError(error instanceof Error ? error.message : 'Unable to generate itinerary.')
  } finally {
    setGeneratingId(null)
  }
}

// Filter trips based on the destination or country entered in search.
const filteredTrips = useMemo(
  () =>
    calculatedTrips.filter(trip =>
      `${trip.destination} ${trip.country}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ),
  [calculatedTrips, search]
)



// Check for overlapping dates and budget limits before adding a trip.
const handleAddTrip = (newTrip: TripInput) => {
  if (hasDateOverlap(newTrip.startDate, newTrip.endDate, trips)) {
  alert('These travel dates overlap with an existing trip. Please choose different dates.')
  return
}

  const allocated = calculatedTrips
    .filter(trip => trip.status === 'Planning')
    .reduce((sum, trip) => sum + trip.budget, 0)

  if (
    getTripStatus(newTrip.endDate, newTrip.confirmed, today) === 'Planning' &&
    allocated + newTrip.budget > budgetLimit
  ) {
    const remaining = Math.max(0, budgetLimit - allocated)

    alert(
      `Planning budget exceeded!\n\n` +
      `You have ${formatCurrency(remaining)} remaining.\n` +
      `This trip costs ${formatCurrency(newTrip.budget)}.\n\n` +
      `Please reduce the trip budget or increase your planning budget.`
    )
    return
  }

  
  const trip: Trip = {
  ...newTrip,
  id: crypto.randomUUID(),
  status: getTripStatus(
    newTrip.endDate,
    newTrip.confirmed,
    today
  ),
}


  setTrips(previous => [trip, ...previous])
  setSearch('')
  setShowAddTrip(false)
}

// Delete the selected trip and its saved itinerary after confirmation.
const handleDeleteTrip = (id: string) => {
  const tripToDelete = trips.find(trip => trip.id === id)

  if (!tripToDelete) return

  const confirmed = window.confirm(
    `Are you sure you want to delete your trip to ${tripToDelete.destination}?\n\nThis action cannot be undone.`
  )

  if (!confirmed) return

  setTrips(previousTrips =>
    previousTrips.filter(trip => trip.id !== id)
  )
  setSavedItineraries(previous => {
    const updated = { ...previous }
    delete updated[id]
    return updated
  })
}

// Validate the updated trip before saving changes.
const handleEditTrip = (updatedTrip: TripInput) => {
  if (!editingTrip) return
  if (hasDateOverlap(
    updatedTrip.startDate,
    updatedTrip.endDate,
    trips,
    editingTrip.id
  )) {
    alert('These travel dates overlap with an existing trip. Please choose different dates.')
    return
  }
  
const allocated = calculatedTrips
  .filter(
    trip =>
      trip.status === 'Planning' &&
      trip.id !== editingTrip.id
  )
  .reduce((sum, trip) => sum + trip.budget, 0)


  if (
    getTripStatus(updatedTrip.endDate, updatedTrip.confirmed, today) === 'Planning' &&
    allocated + updatedTrip.budget > budgetLimit
  ) {
    alert('Planning budget exceeded. Please adjust your budget.')
    return
  }

  
setTrips(previousTrips =>
  previousTrips.map(trip =>
    trip.id === editingTrip.id
      ? {
          ...updatedTrip,
          id: trip.id,
          status: getTripStatus(
            updatedTrip.endDate,
            updatedTrip.confirmed,
            today
          ),
        }
      : trip
  )
)



  setEditingTrip(null)
}



  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-atlas-ivory text-atlas-forest dark:bg-atlas-dark dark:text-[#F5F2E9]">
        <header className="border-b border-atlas-stone bg-white/90 dark:border-[#3A453F] dark:bg-atlas-dark-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-atlas-forest p-2.5 text-atlas-champagne shadow-sm dark:bg-atlas-champagne dark:text-atlas-dark">
                <Compass size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">Compass</h1>
                <p className="text-xs text-atlas-muted dark:text-[#B7C2B8]">YOUR TRAVEL COMPANION</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode(previous => !previous)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-xl border border-atlas-stone p-3 text-atlas-forest transition-colors hover:bg-[#EDF0E8] dark:border-[#3A453F] dark:text-atlas-champagne dark:hover:bg-[#2E3D34]"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-atlas-sage">
                YOUR JOURNEY STARTS HERE
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Your travel dashboard
              </h2>
              <p className="mt-2 text-atlas-muted dark:text-[#B7C2B8]">
                All your adventures, beautifully organized in one place.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowAddTrip(true)}
              className="flex items-center gap-2 rounded-xl bg-atlas-forest px-5 py-3 font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#355548] hover:shadow-md dark:bg-atlas-champagne dark:text-atlas-dark dark:hover:bg-[#D4BF9C]"
            >
              <Plus size={19} />
              Add New Trip
            </button>

          </section>

          
        <TravelOverview
        trips={calculatedTrips}
        budgetLimit={budgetLimit}
        onBudgetChange={setBudgetLimit}
        />


          <section className="overflow-hidden rounded-2xl border border-atlas-stone bg-white shadow-sm dark:border-[#3A453F] dark:bg-atlas-dark-card">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-atlas-stone p-6 dark:border-[#3A453F]">
              <div>
                <h3 className="text-xl font-bold">Your Trips</h3>
                <p className="mt-1 text-sm text-atlas-muted dark:text-[#B7C2B8]">
                  Manage and explore your travel plans.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-atlas-stone px-4 py-2 focus-within:border-atlas-sage dark:border-[#3A453F]">
                <Search size={18} className="text-atlas-sage" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search destinations..."
                  aria-label="Search destinations"
                  className="w-48 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-atlas-ivory text-xs uppercase tracking-wider text-atlas-muted dark:bg-[#2E3D34] dark:text-[#B7C2B8]">
                  <tr>
                    <th className="px-6 py-4">Destination</th>
                    <th className="px-6 py-4">Travel Dates</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-atlas-stone dark:divide-[#3A453F]">
                  {filteredTrips.map(trip => (
                    <tr
                      key={trip.id}
                      className=" group relative transition-all duration-300 ease-out hover:bg-[#EDF0E8] hover:shadow-sm dark:hover:bg-[#2E3D34]"
                    >
                      
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-atlas-ivory dark:bg-[#2E3D34]">
                          {(() => {
                          {/* Find the country's flag, or show a default icon if unavailable. */}
                          const countryName = countryAliases[trip.country] ?? trip.country

                          const match = countries.find(
                            country =>
                              country.name.toLowerCase() === countryName.toLowerCase()
                          )

                          const code = match?.code ?? countryCodes[trip.country]

                          return code ? (
                            <img
                              src={match?.flag ?? `https://flagcdn.com/w80/${code}.png`}
                              alt={`${trip.country} flag`}
                              className="h-7 w-10 object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-lg">🌍</span>
                          )
                        })()}
                      </div>

                      {/* Destination information */}
                      <div>
                        <p className="font-semibold">{trip.destination}</p>
                        <p className="text-xs text-atlas-muted dark:text-[#B7C2B8]">{trip.country}</p>
                      </div>

                    </div>
                  </td>

                      <td className="px-6 py-5 text-atlas-muted dark:text-[#B7C2B8]">
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                      </td>
                      <td className="px-6 py-5 font-medium">
                        {formatCurrency(trip.budget)}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          trip.status === 'Completed'
                            ? 'bg-[#E5EEE6] text-[#42694D] dark:bg-[#30483A] dark:text-[#BBDCC1]'
                            : trip.status === 'Upcoming'
                              ? 'bg-[#E8EEE8] text-[#355C4B] dark:bg-[#30483A] dark:text-[#D2E4D5]'
                              : 'bg-[#F5ECD9] text-[#876A38] dark:bg-[#4B4030] dark:text-[#E7C995]'
                        }`}>
                          {trip.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">

                          {/* AI generation button */}
                          <button
                            type="button"
                            disabled={generatingId !== null}
                            onClick={() => void openItinerary(trip)}
                            title={savedItineraries[trip.id]?.fingerprint === tripFingerprint(trip)
                              ? `View ${trip.destination} itinerary`
                              : `Generate ${trip.destination} itinerary`}
                            aria-label={savedItineraries[trip.id]?.fingerprint === tripFingerprint(trip)
                              ? `View saved itinerary for ${trip.destination}`
                              : `Generate itinerary for ${trip.destination}`}
                            className="rounded-lg p-2 text-atlas-sage transition-colors hover:bg-[#E8EEE8] hover:text-atlas-forest disabled:cursor-wait disabled:opacity-40 dark:text-atlas-champagne dark:hover:bg-[#303B35]"
                          >
                            {savedItineraries[trip.id]?.fingerprint === tripFingerprint(trip)
                              ? <FileText size={18} />
                              : <Sparkles size={18} />}
                          </button>

                          {/* Details icon */}
                          <button
                            type="button"
                            onClick={() => setEditingTrip(trip)}
                            title={`Edit ${trip.destination}`}
                            aria-label={`Edit trip to ${trip.destination}`}
                            className="rounded-lg p-2 text-atlas-sage transition-colors hover:bg-[#E8EEE8] hover:text-atlas-forest dark:hover:bg-[#30483A] dark:hover:text-atlas-champagne"
                          >
                            <ArrowUpRight size={18} />
                          </button>

                          {/* Delete trip button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTrip(trip.id)}
                            title={`Delete ${trip.destination}`}
                            aria-label={`Delete trip to ${trip.destination}`}
                            className="rounded-lg p-2 text-atlas-muted transition-colors hover:bg-[#F9E9E5] hover:text-[#A64C3D] dark:hover:bg-[#50332E] dark:hover:text-[#F1B4A8]"
                          >
                            <Trash2 size={18} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && (
                <p className="p-8 text-center text-atlas-muted">Loading trips...</p>
              )}
              {error && (
                <p role="alert" className="p-8 text-center text-red-500">{error}</p>
              )}
              {!loading && !error && filteredTrips.length === 0 && (
                <p className="p-8 text-center text-atlas-muted">
                  No trips found.
                </p>
              )}
            </div>
          </section>

          <footer className="text-center text-sm text-atlas-muted dark:text-[#B7C2B8]">
            Atlas Travel Planner · Made for explorers
          </footer>
        
        </main>
      </div>

      
      {showAddTrip && (
        <AddTripModal
          onClose={() => setShowAddTrip(false)}
          onAdd={handleAddTrip}
          countries={countries}
          countriesLoading={countriesLoading}
          countriesError={countriesError}
        />
      )}


      {editingTrip && (
        <AddTripModal
          key={editingTrip.id}
          onClose={() => setEditingTrip(null)}
          onAdd={handleEditTrip}
          countries={countries}
          countriesLoading={countriesLoading}
          countriesError={countriesError}
          initialData={{
            destination: editingTrip.destination,
            country: editingTrip.country,
            startDate: editingTrip.startDate,
            endDate: editingTrip.endDate,
            budget: editingTrip.budget,
            confirmed: editingTrip.confirmed,
          }}
          isEditing={true}
        />
      )}

      {activeItineraryTrip && (() => {
        const trip = activeItineraryTrip
        const saved = savedItineraries[trip.id]
        const isCurrent = saved?.fingerprint === tripFingerprint(trip)
        const content = isCurrent ? (saved?.data ?? saved?.text ?? null) : null
        return (
          <ItineraryViewer
            trip={trip}
            itinerary={content}
            generating={generatingId === trip.id}
            error={itineraryError}
            storageError={storageError}
            onClose={() => setActiveItineraryTrip(null)}
          />
        )
      })()}

    </div>
  )
}

export default App

